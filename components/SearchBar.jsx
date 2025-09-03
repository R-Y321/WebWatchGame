"use client";

import React, { useState } from "react";

export default function SearchBar({ onSearch, openTagModal }) {
    const [title, setTitle] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ title });
    };

    return (
        <div className="searchBarContainer">
            <form onSubmit={handleSubmit} className="searchContainer">
                <button type="submit" className="submitButton">
                    検索
                </button>
            </form>

            {/* タグモーダルを開くボタン */}
            <button onClick={openTagModal} className="openTagButton">
                タグで絞り込む
            </button>
        </div>
    );
}
