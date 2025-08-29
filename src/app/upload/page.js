"use client";

import { useState } from "react";
import { storage, db, auth } from "../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "./page.module.css";

export default function Upload() {
  const [title, setTitle] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [image, setImage] = useState(null);

  // 画像選択時の処理
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeMB = 2; // 2MBまで
    if (file.size / 1024 / 1024 > maxSizeMB) {
      alert(`画像は${maxSizeMB}MB以下にしてください`);
      e.target.value = null;
      return;
    }

    setImage(file);
  };

  // アップロード処理
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!videoURL) return alert("動画URLを入力してください");
    if (!image) return alert("画像を選択してください");

    const fileName = `${Date.now()}_${image.name}`;
    const storageRef = ref(storage, `thumbnails/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, image);

    uploadTask.on(
      "state_changed",
      null,
      (error) => alert(error),
      async () => {
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

        // Firestoreに保存
        await addDoc(collection(db, "videos"), {
          title,
          videoURL,
          thumbnail: imageUrl,
          likes: 0,
          likedUsers: [],
          userId: auth.currentUser?.uid || "anonymous",
          createdAt: serverTimestamp(),
        });

        alert("アップロード完了!");
        setTitle("");
        setVideoURL("");
        setImage(null);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">動画アップロード</h1>
      <form
        onSubmit={handleUpload}
        className={`${styles.container}`}
      >
        <input
          className={styles.input}
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={styles.input}
          type="url"
          placeholder="動画URLを貼ってください"
          value={videoURL}
          onChange={(e) => setVideoURL(e.target.value)}
        />
        <input
          className={styles.input}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {image && (
          <img
            className={styles.previewImage}
            src={URL.createObjectURL(image)}
            alt="プレビュー"
          />
        )}

        <button className={styles.button} type="submit">
          アップロード
        </button>
      </form>
    </div>
  );
}
