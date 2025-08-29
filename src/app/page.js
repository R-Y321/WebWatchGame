"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../app/firebase";
import { useRouter } from "next/navigation";
import "../../src/styles/home.css"

export default function HomePage({ videos, handleLike }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // ログインしているユーザーを監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // アップロードボタンを押したときの処理
  const goToUpload = () => {
    if (!user) {
      // ログインしていなければログインページへ
      router.push("/login");
    } else {
      // ログイン済みならアップロードページへ
      router.push("/upload");
    }
  };

  return (
    <div className="Home">
      <div className="HomeTitle">
        <h1 className="GameTitle">Valorant</h1>

        {/* アップロードボタン */}
        <button
          onClick={goToUpload}
          className="goToUpload"
        >
          投稿画面へ
        </button>

        {/* ユーザー情報 */}
        {user ? (
          <div className="userInfo">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="User Icon"
              className="userIcon"
            />
            <span className="userName">{user.displayName || "匿名ユーザー"}</span>
            <button
              onClick={() => signOut(auth)}
              className="LogoutButton"
            >
              ︙
            </button>
          </div>
        ) : (
          <span className="text-gray-500">ログインしていません</span>
        )}
      </div>

      {/* 動画リスト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos && videos.length > 0 ? (
          videos.map((video) => (
            <div key={video.id} className="bg-white shadow rounded p-2">
              <video
                className="aspect-video w-full mb-2"
                controls
                src={video.url}
              ></video>
              <h2 className="text-lg font-semibold">{video.title}</h2>
              <p>👍 {video.likes || 0}</p>
              <button
                onClick={() => handleLike(video)}
                className="mt-2 bg-green-500 text-white px-2 py-1 rounded"
              >
                いいね
              </button>
            </div>
          ))
        ) : (
          <p>動画はまだありません</p>
        )}
      </div>
    </div>
  );
}
