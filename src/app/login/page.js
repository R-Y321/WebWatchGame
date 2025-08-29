"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, provider } from "../../app/firebase";

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // リダイレクト結果を取得（ログイン直後）
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          setUser(result.user);
          router.push("/"); // ログイン後はホームへ
        }
      })
      .catch((error) => {
        console.error("ログイン失敗:", error);
      });

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
      await signInWithRedirect(auth, provider);
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
        <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
          ログアウト
        </button>
      ) : (
        <button onClick={handleLogin} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Googleでログイン
        </button>
      )}
    </div>
  );
}
