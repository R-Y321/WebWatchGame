"use client";

import { useState } from "react";
import { db } from "../src/app/firebase";
import { doc, getDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";

export default function useLike(user, setVideos) {
  const [loadingLike, setLoadingLike] = useState(false);

  const handleLike = async (video) => {
    if (!user) {
      alert("ログインしてください");
      return;
    }

    if (video.isLiking || loadingLike) return; // 連打防止
    setLoadingLike(true);

    const videoRef = doc(db, "Valorant", video.id);
    const userId = user.uid;

    // UI先行更新（ボタンのローディング）
    setVideos((prev) =>
      prev.map((v) =>
        v.id === video.id ? { ...v, isLiking: true } : v
      )
    );

    try {
      const snap = await getDoc(videoRef);
      if (!snap.exists()) throw new Error("動画が存在しません");
      const data = snap.data();

      // すでにいいね済みならスキップ
      if (data.likedUsers?.includes(userId)) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, isLiking: false } : v
          )
        );
        setLoadingLike(false);
        return;
      }

      await updateDoc(videoRef, {
        likes: increment(1),
        likedUsers: arrayUnion(userId),
      });

      // UI更新
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
    } finally {
      setLoadingLike(false);
    }
  };

  return { handleLike, loadingLike };
}
