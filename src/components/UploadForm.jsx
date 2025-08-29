"use client";

import { useState } from "react";
import { saveVideo } from "../lib/saveVideo";

export default function UploadForm() {
  const [title, setTitle] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [image, setImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !videoURL || !image) return alert("全て入力してください");

    await saveVideo({ title, videoURL, imageFile: image });

    setTitle("");
    setVideoURL("");
    setImage(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="url" placeholder="動画URL" value={videoURL} onChange={(e) => setVideoURL(e.target.value)} />
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {image && <img src={URL.createObjectURL(image)} alt="プレビュー" />}
      <button type="submit">投稿</button>
    </form>
  );
}
