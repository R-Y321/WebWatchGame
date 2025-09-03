"use client";

import React from "react";
import TagSelector from "./TagSelector";

export default function TagSearchModal({
  show,
  onClose,
  selectedMaps,
  setSelectedMaps,
  selectedAgents,
  setSelectedAgents,
  selectedRole,
  setSelectedRole,
  onSearch
}) {
  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      maps: selectedMaps,
      agents: selectedAgents,
      role: selectedRole
    });
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <h2>SelectTags</h2>
        <form onSubmit={handleSubmit}>
          <TagSelector
            selectedMaps={selectedMaps}
            setSelectedMaps={setSelectedMaps}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
          />
          <button type="submit" className="submitButton">検索</button>
        </form>
        <button onClick={onClose} className="closeButton">×</button>
      </div>
    </div>
  );
}
