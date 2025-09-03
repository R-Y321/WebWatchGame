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
import TagSelector from "../../components/TagSelector";
import TagSearchModal from "../../components/TagSearchModal";
import useLike from "../../components/useLike";

// YouTube URL から動画IDを抽出
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
  const [videoURL, setVideoURL] = useState("");
  const [videos, setVideos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState({ maps: [], agents: [], role: "" });


  // Tag
  const [selectedMaps, setSelectedMaps] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showTagModal, setShowTagModal] = useState(false);

  //Like
  const { handleLike } = useLike(user, setVideos);

  // 認証状態と最初の動画20件を取得
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchInitialVideos();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);

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

    let q = query(
      collection(db, "Valorant"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(20)
    );

    const snapshot = await getDocs(q);
    let newVideos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 検索条件がある場合はフィルター
    if (searchQuery.maps.length > 0)
      newVideos = newVideos.filter(
        (v) => v.tags?.maps?.length > 0 && searchQuery.maps.every((m) => v.tags.maps.includes(m))
      );
    if (searchQuery.agents.length > 0)
      newVideos = newVideos.filter(
        (v) => v.tags?.agents?.length > 0 && searchQuery.agents.every((a) => v.tags.agents.includes(a))
      );
    if (searchQuery.role)
      newVideos = newVideos.filter((v) => v.tags?.role === searchQuery.role);

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
    if (showModal) {
      setSelectedMaps([]);
      setSelectedAgents([]);
      setSelectedRole("");
      setVideoURL("");
    }
    setShowModal(!showModal);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 検索
  const handleSearch = async ({ maps = [], agents = [], role = "" }) => {
    setSearchQuery({ maps, agents, role }); // 検索条件を保持

    let q = query(
      collection(db, "Valorant"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    // Firestoreクエリにタグ条件を追加する場合（必要に応じて）
    // ここでは簡易的に全件取得してフィルターしています
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (maps.length > 0)
      results = results.filter(
        (v) => v.tags?.maps?.length > 0 && maps.every((m) => v.tags.maps.includes(m))
      );

    if (agents.length > 0)
      results = results.filter(
        (v) => v.tags?.agents?.length > 0 && agents.every((a) => v.tags.agents.includes(a))
      );

    if (role)
      results = results.filter((v) => v.tags?.role === role);

    setVideos(results);

    // ページネーション用に lastVisible を設定
    setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
  };

  // 投稿処理（タイトル削除済）
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) return alert("ログインしてください");
    if (!videoURL) return alert("動画URLを入力してください");
    if (isUploading) return;

    if (selectedMaps.length === 0) {
      return alert("Mapを少なくとも1つ選択してください");
    }
    if (selectedAgents.length === 0) {
      return alert("Agentを少なくとも1つ選択してください");
    }
    if (!selectedRole) {
      return alert("Roleを選択してください");
    }
    setIsUploading(true);

    const videoId = extractYouTubeId(videoURL);
    if (!videoId) {
      setIsUploading(false);
      return alert("正しいYouTube URLを入力してください");
    }

    const thumbnailUrl = getThumbnailUrl(videoId);

    try {
      const docRef = await addDoc(collection(db, "Valorant"), {
        videoURL,
        thumbnail: thumbnailUrl,
        likes: 0,
        likedUsers: [],
        userId: user.uid,
        userName: user.displayName || "匿名ユーザー",
        tags: {
          maps: selectedMaps,
          agents: selectedAgents,
          role: selectedRole,
        },
        createdAt: serverTimestamp(),
      });

      setVideos((prev) => [
        {
          id: docRef.id,
          videoURL,
          thumbnail: thumbnailUrl,
          likes: 0,
          likedUsers: [],
          userId: user.uid,
          userName: user.displayName || "匿名ユーザー",
          tags: {
            maps: selectedMaps,
            agents: selectedAgents,
            role: selectedRole,
          },
          createdAt: { seconds: Date.now() / 1000 },
        },
        ...prev,
      ]);

      setVideoURL("");
      setShowModal(false);
      setSelectedMaps([]);
      setSelectedAgents([]);
      setSelectedRole("");
      alert("投稿完了！");
    } catch (error) {
      console.error("Firestore 保存エラー:", error);
      alert("投稿に失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="Home">
      <div className="HomeTitle">
        <h1 className="GameTitle">Valorant Info</h1>
        {/* タグ検索ボタン */}
        <button
          onClick={() => setShowTagModal(true)}
          className="tagSearchButton"
          title="タグ検索"
        >
          {/* SVGで虫眼鏡アイコン */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="searchIcon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            width={24}
            height={24}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
            />
          </svg>
          <span>Search</span>
        </button>

        <TagSearchModal
          show={showTagModal}
          onClose={() => setShowTagModal(false)}
          selectedMaps={selectedMaps}
          setSelectedMaps={setSelectedMaps}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          onSearch={handleSearch}
        />
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
            {/* <button onClick={() => signOut(auth)} className="LogoutButton">
              Logout
            </button> */}
          </div>
        ) : (
          <div className="text-gray-500" onClick={goToLogin}>
            GoogleでLogin
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
                  alt="YouTube Thumbnail"
                  className="thumbnail"
                />
              </a>
              {/* タイトル部分削除済み */}
              <div className="videoInfo">
                <h5 className="PostuserName">user: {video.userName}</h5>
                <h5>Agent: {video.tags?.agents?.join(" | ") || "none"}</h5>
                <h5>Map: {video.tags?.maps?.join(" | ") || "none"}</h5>
                <h5>Role: {video.tags?.role || "none"}</h5>

                <h5 className="PostTimestump">
                  {video.createdAt
                    ? new Date(video.createdAt.seconds * 1000).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "日時なし"}
                </h5>
                <div className="likeInfo">
                  <button
                    className="likeButton"
                    onClick={() => handleLike(video)}
                  >
                    {video.likedUsers?.includes(user?.uid) ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="red">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="gray">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                  </button>
                  <p>Like: {video.likes || 0}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>動画はまだありません</p>
        )}
      </div>

      {/* もっとみる */}
      {lastVisible && videos.length >= 20 && (
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
                type="url"
                placeholder="YouTube動画URL"
                value={videoURL}
                onChange={(e) => setVideoURL(e.target.value)}
                className="inputField"
                required
              />
              <TagSelector
                selectedMaps={selectedMaps}
                setSelectedMaps={setSelectedMaps}
                selectedAgents={selectedAgents}
                setSelectedAgents={setSelectedAgents}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
              />
              <button type="submit" className="submitButton" disabled={isUploading}>
                投稿
              </button>
            </form>
            <button onClick={toggleModal} className="closeButton">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
