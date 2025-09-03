"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../app/firebase";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  increment
} from "firebase/firestore";
import "../../src/styles/home.css";

// YouTube URL から動画IDを抽出する関数
function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// 動画IDからサムネイルURLを生成
function getThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [videos, setVideos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // 投稿連打防止
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);


  // 認証状態と最初の動画20件を取得
  useEffect(() => {
    // 認証監視
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 初期動画取得
    fetchInitialVideos();

    // スクロール監視
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);

    // クリーンアップ
    return () => {
      unsubscribeAuth();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  // 最初の20件
  const fetchInitialVideos = async () => {
    const q = query(
      collection(db, "Valorant"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const videoList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setVideos(videoList);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
  };

  // もっとみる
  const fetchMoreVideos = async () => {
    if (!lastVisible) return;
    setLoadingMore(true);
    const q = query(
      collection(db, "Valorant"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const newVideos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setVideos((prev) => [...prev, ...newVideos]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
    setLoadingMore(false);
  };

  const goToLogin = () => {
    router.push("/login");
  };

  const toggleModal = () => {
    if (!user) {
      alert("ログインしてください");
      return;
    }
    setShowModal(!showModal);
  };

  // Topにもどる
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  // ---------------- 投稿処理 ----------------
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) return alert("ログインしてください");
    if (!title || !videoURL) return alert("タイトルと動画URLを入力してください");
    if (isUploading) return; // 二重投稿防止

    setIsUploading(true);

    const videoId = extractYouTubeId(videoURL);
    if (!videoId) {
      setIsUploading(false);
      return alert("正しいYouTube URLを入力してください");
    }

    const thumbnailUrl = getThumbnailUrl(videoId);

    try {
      const docRef = await addDoc(collection(db, "Valorant"), {
        title,
        videoURL,
        thumbnail: thumbnailUrl,
        likes: 0,
        likedUsers: [],
        userId: user.uid,
        userName: user.displayName || "匿名ユーザー",
        createdAt: serverTimestamp(),
      });

      // UIに即時反映（追加した動画のみ）
      setVideos((prev) => [
        {
          id: docRef.id,
          title,
          videoURL,
          thumbnail: thumbnailUrl,
          likes: 0,
          likedUsers: [],
          userId: user.uid,
          userName: user.displayName || "匿名ユーザー",
          createdAt: { seconds: Date.now() / 1000 },
        },
        ...prev,
      ]);

      setTitle("");
      setVideoURL("");
      setShowModal(false);
      alert("投稿完了！");
    } catch (error) {
      console.error("Firestore 保存エラー:", error);
      alert("投稿に失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------- いいね処理 ----------------
  const handleLike = async (video) => {
    if (!user) {
      alert("ログインしてください");
      return;
    }

    if (video.isLiking) return; // 連打防止
    const videoRef = doc(db, "Valorant", video.id);
    const userId = user.uid;

    setVideos((prev) =>
      prev.map((v) =>
        v.id === video.id ? { ...v, isLiking: true } : v
      )
    );

    try {
      const snap = await getDoc(videoRef);
      if (!snap.exists()) throw new Error("動画が存在しません");
      const data = snap.data();

      // すでにいいね済みなら何もしない
      if (data.likedUsers?.includes(userId)) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, isLiking: false } : v
          )
        );
        return;
      }

      await updateDoc(videoRef, {
        likes: increment(1),
        likedUsers: arrayUnion(userId),
      });

      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id
            ? {
              ...v,
              likes: (v.likes || 0) + 1,
              likedUsers: [...(v.likedUsers || []), userId],
              isLiking: false,
            }
            : v
        )
      );
    } catch (error) {
      console.error("いいね処理失敗:", error);
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, isLiking: false } : v
        )
      );
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="Home">
      <div className="HomeTitle">
        <h1 className="GameTitle">Valorant Ranking</h1>
        <div style={{ position: "fixed", bottom: "30px", right: "30px", display: "flex", gap: "10px", zIndex: 1000 }}>
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="scrollTopButton"
            >
              <p className="gotoTop">^</p>
            </button>
          )}
          <button onClick={toggleModal} className="goToUpload">
            <p className="uploadButton">+</p>
          </button>
        </div>


        {user ? (
          <div className="userInfo">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="User Icon"
              className="userIcon"
            />
            {/* <span className="userName">
              {user.displayName || "匿名ユーザー"}
            </span> */}
            <button onClick={() => signOut(auth)} className="LogoutButton">
              ︙
            </button>
          </div>
        ) : (
          <div className="text-gray-500" onClick={goToLogin}>
            ログイン
          </div>
        )}
      </div>

      {/* 動画リスト */}
      <div className="PostHome">
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video.id} className="Post">
              <a
                href={video.videoURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="thumbnail"
                />
              </a>
              <h2 className="videoTitle">
                <p>{video.title}</p>
              </h2>
              <div className="videoInfo">
                <p className="PostuserName">投稿者: {video.userName}</p>
                <p className="PostTimestump">
                  {video.createdAt
                    ? new Date(video.createdAt.seconds * 1000).toLocaleString(
                      "ja-JP",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                    : "日時なし"}
                </p>
                <p>👍 {video.likes || 0}</p>
                <button
                  className={`likeButton ${video.isLiking || video.likedUsers?.includes(user?.uid) ? "liked" : ""}`}
                  onClick={() => handleLike(video)}
                  disabled={video.likedUsers?.includes(user?.uid) || video.isLiking}
                >
                  {video.likedUsers?.includes(user?.uid) ? "❤️" : "🤍"} {video.likes || 0}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>動画はまだありません</p>
        )}
      </div>

      {/* もっとみる */}
      {lastVisible && (
        <div className="moreButtonTop">
          <button
            onClick={fetchMoreVideos}
            disabled={loadingMore}
            className="moreButton"
          >
            <p style={{ fontFamily: "Trebuchet MS", fontWeight: "bold" }}>
              {loadingMore ? "読み込み中..." : "もっとみる"}
            </p>
          </button>
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div className="modalOverlay" onClick={toggleModal}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">動画アップロード</h2>
            <form onSubmit={handleUpload}>
              <input
                type="text"
                placeholder="タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="inputField"
              />
              <input
                type="url"
                placeholder="YouTube動画URL"
                value={videoURL}
                onChange={(e) => setVideoURL(e.target.value)}
                className="inputField"
              />
              <button type="submit" className="submitButton" disabled={isUploading}>
                投稿
              </button>
            </form>
            <button onClick={toggleModal} className="closeButton">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
