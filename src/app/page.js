"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../app/firebase";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
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
  const router = useRouter();


  useEffect(() => {
    // ユーザーのログイン状態を監視
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Valorant コレクションの動画をリアルタイムで取得
    const q = query(collection(db, "Valorant"), orderBy("createdAt", "desc"));
    const unsubscribeDB = onSnapshot(q, (snapshot) => {
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVideos(videoList);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDB();
    };
  }, []);

  const goToLogin = () => {
    router.push("/login")
  }

  const toggleModal = () => {
    if (!user) {
      alert("ログインしてください");
      return;
    }
    setShowModal(!showModal);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !videoURL) {
      alert("タイトルと動画URLを入力してください");
      return;
    }

    const videoId = extractYouTubeId(videoURL);
    if (!videoId) {
      alert("正しいYouTube URLを入力してください");
      return;
    }

    const thumbnailUrl = getThumbnailUrl(videoId);

    try {
      await addDoc(collection(db, "Valorant"), {
        title,
        videoURL,
        thumbnail: thumbnailUrl,
        likes: 0,
        likedUsers: [],
        userId: auth.currentUser?.uid || "anonymous",
        userName: auth.currentUser?.displayName || "匿名ユーザー",
        createdAt: serverTimestamp(),
      });

      alert("投稿完了！");
      setTitle("");
      setVideoURL("");
      setShowModal(false);
    } catch (error) {
      console.error("Firestore 保存エラー:", error);
      alert("投稿に失敗しました");
    }
  };

  const handleLike = async (video) => {
    // ここにいいね機能を後で追加可能
    console.log("いいね", video.id);
  };

  return (
    <div className="Home">
      <div className="HomeTitle">
        <h1 className="GameTitle">Valorant</h1>
        <button onClick={toggleModal} className="goToUpload">
          <p className="uploadButton">+</p>
        </button>

        {user ? (
          <div className="userInfo">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="User Icon"
              className="userIcon"
            />
            <span className="userName">{user.displayName || "匿名ユーザー"}</span>
            <button onClick={() => signOut(auth)} className="LogoutButton">
              ︙
            </button>
          </div>
        ) : (
          <div className="text-gray-500" onClick={goToLogin}>ログイン</div>
        )}
      </div>

      {/* 動画リスト */}
<div className="PostHome">
  {videos.length > 0 ? (
    videos.map((video) => (
      <div key={video.id} className="Post">
        <a href={video.videoURL} target="_blank" rel="noopener noreferrer">
          <img src={video.thumbnail} alt={video.title} className="thumbnail" />
        </a>
        <h2 className="videoTitle">
          <p>{video.title}</p>
        </h2>
        <div className="videoInfo">
           <p className="PostuserName">投稿者: {video.userName}</p>
          <p>👍 {video.likes || 0}</p>
          <button
            onClick={() => handleLike(video)}
            className="mt-2 bg-green-500 text-white px-2 py-1 rounded"
          >
           いいね
         </button>
        </div>
       
      </div>
    ))
  ) : (
    <p>動画はまだありません</p>
  )}
</div>



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
              <button type="submit" className="submitButton">
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
