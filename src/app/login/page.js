"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, provider } from "../../app/firebase";

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // 認証状態を監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        router.push("/"); // ログイン済みならホームへ
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/"); // ログイン後にトップへ
    } catch (error) {
      console.error("ログイン失敗:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">ログインページ</h1>

      {user ? (
        <button
          onClick={handleLogout}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          ログアウト
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Googleでログイン
        </button>
      )}
    </div>
  );
}
