import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./Leaderboard.css";

// ✅ Use environment variable for backend URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const socket = io(API_URL, { transports: ["websocket"] });

const Leaderboard = () => {
  const [mode, setMode] = useState("classic");
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = () => {
      fetch(`${API_URL}/leaderboard/${mode}`)
        .then((res) => res.json())
        .then((data) =>
          setLeaderboard(
            data.leaderboard
              .filter((player) => player.stats?.[mode])
              .map((player, index) => ({ ...player, rank: index + 1 }))
          )
        )
        .catch((error) => console.error("Error fetching leaderboard:", error));
    };

    fetchLeaderboard();

    const handleUpdate = (data) => {
      setLeaderboard(
        data
          .filter((player) => player.stats?.[mode])
          .map((player, index) => ({
            ...player,
            rank: index + 1,
          }))
      );
    };

    socket.on("leaderboardUpdate", handleUpdate);
    socket.on("connect_error", (err) => console.error("Socket error:", err));

    return () => {
      socket.off("leaderboardUpdate", handleUpdate);
    };
  }, [mode]);

  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  return (
    <div className="leaderboard-container">
      {/* Return Button */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => navigate("/game")}>🔙 Return to Game</button>
      </div>

      <h2>🏆 Leaderboard 🏆</h2>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          onClick={() => setMode("classic")}
          className={mode === "classic" ? "active" : ""}
        >
          Single Player
        </button>
        <button
          onClick={() => setMode("duel")}
          className={mode === "duel" ? "active" : ""}
        >
          Multiplayer Duel
        </button>
      </div>

      {/* Leaderboard Table */}
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">
                No data available
              </td>
            </tr>
          ) : (
            leaderboard.map((player) => (
              <tr key={player.username}>
                <td>{getMedalIcon(player.rank)}</td>
                <td>{player.username}</td>
                <td>
                  {player.stats[mode]?.score === 9999
                    ? "-"
                    : player.stats[mode]?.score ?? 0}
                </td>
                <td>{player.stats[mode]?.time ?? "-"} sec</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
