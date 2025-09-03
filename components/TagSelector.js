"use client";
import { useState } from "react";

export default function TagSelector({
    selectedMaps,
    setSelectedMaps,
    selectedAgents,
    setSelectedAgents,
    selectedRole,
    setSelectedRole,
}) {
    const maps = [
        "Ascent", "Bind", "Haven", "Icebox", "Breeze", "Fracture",
        "Pearl", "Lotus", "Sunset", "Abyss", "Karod", "Split"
    ];
    const agents = [
        "Brimstone", "Phoenix", "Sage", "Sova", "Viper", "Cypher",
        "Reyna", "Killjoy", "Breach", "Omen", "Jett", "Raze",
        "Skye", "Yoru", "Astra", "KAY/O", "Chamber", "Neon",
        "Fade", "Harbor", "Gekko", "Deadlock", "Iso", "Clove",
        "Vyse", "Tejo", "Waylay"
    ];
    const roles = ["攻撃", "防衛", "攻撃 | 防衛"];

    const toggleSelection = (value, selectedArray, setSelectedArray) => {
        if (selectedArray.includes(value)) {
            setSelectedArray(selectedArray.filter((v) => v !== value));
        } else {
            setSelectedArray([...selectedArray, value]);
        }
    };

    return (
        <div className="tagSelector">
            {/* Maps */}
            <div className="tagGroup">
                <p className="tagGroupTitle">Maps</p>
                <div className="tagContainer">
                    {maps.map((map) => (
                        <div
                            key={map}
                            className={`tagCard ${selectedMaps.includes(map) ? "selected" : ""}`}
                            onClick={() => toggleSelection(map, selectedMaps, setSelectedMaps)}
                        >
                            {map}
                        </div>
                    ))}
                </div>
            </div>

            {/* Agents */}
            <div className="tagGroup">
                <p className="tagGroupTitle">Agents</p>
                <div className="tagContainer">
                    {agents.map((agent) => (
                        <div
                            key={agent}
                            className={`tagCard ${selectedAgents.includes(agent) ? "selected" : ""}`}
                            onClick={() => toggleSelection(agent, selectedAgents, setSelectedAgents)}
                        >
                            {agent}
                        </div>
                    ))}
                </div>
            </div>

            {/* Role */}
            <div className="tagGroup">
                <p className="tagGroupTitle">Role</p>
                <div className="tagContainer">
                    {roles.map((role) => (
                        <div
                            key={role}
                            className={`tagCard ${selectedRole === role ? "selected" : ""}`}
                            onClick={() => setSelectedRole(role)}
                        >
                            {role}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
