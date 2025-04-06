// === FRONTEND: Game.js ===
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "./Game.css";

const socket = io("http://localhost:5000");

const Game = () => {
  const [digits, setDigits] = useState([]);
  const [solution, setSolution] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [duelMode, setDuelMode] = useState(false);
  const [username, setUsername] = useState("");
  const [opponentName, setOpponentName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "Guest");

    socket.on("game-started", (data) => {
      setDigits(data);
      setGameStarted(true);
      setSolution("");
      setMessage("");
      setDuelMode(false);
    });

    socket.on("solution-validated", (result) => {
      setMessage(result);
    });

    socket.on("waiting-for-opponent", () => {
      setWaiting(true);
      setMessage("Waiting for an opponent...");
    });

    socket.on("duel-started", ({ digits, opponent }) => {
      setDigits(digits);
      setGameStarted(true);
      setDuelMode(true);
      setWaiting(false);
      setMessage("Duel Started! Solve the challenge first!");
      setOpponentName(opponent);
    });

    socket.on("duel-cancelled", () => {
      setWaiting(false);
      setMessage("Duel cancelled.");
    });

    socket.on("duel-result", (result) => {
      setMessage(result);
      setDuelMode(false);
    });

    return () => {
      socket.off("game-started");
      socket.off("solution-validated");
      socket.off("waiting-for-opponent");
      socket.off("duel-started");
      socket.off("duel-cancelled");
      socket.off("duel-result");
    };
  }, []);

  const startGame = () => {
    socket.emit("start-game", { username });
  };

  const startDuel = () => {
    const uid = localStorage.getItem("uid");
    socket.emit("start-duel", { username, uid });
    setWaiting(true);
    setMessage("Searching for an opponent...");
  };
  

  const cancelDuel = () => {
    socket.emit("cancel-duel");
    setWaiting(false);
    setMessage("Duel cancelled.");
  };

  const submitSolution = () => {
    if (!solution.trim()) {
      setMessage("Please enter a solution first!");
      return;
    }
    const uid = localStorage.getItem("uid");
    socket.emit("submit-solution", { solution, duelMode, uid });
  };

  const clearSolution = () => {
    setSolution("");
  };

  const returnToMenu = () => {
    setGameStarted(false);
    setDigits([]);
    setSolution("");
    setMessage("");
    setWaiting(false);
    setDuelMode(false);
    setOpponentName("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="game-container">
      <h1>Hectoc Game</h1>

      {username && (
        <div className="mb-3 text-start">
          <strong>👤 Logged in as:</strong>{" "}
          <span className="text-primary">{username}</span>
        </div>
      )}

      {!gameStarted ? (
        <div className="game-menu">
          <button className="btn btn-primary mb-2" onClick={startGame}>
            Start Single Game
          </button>
          {waiting ? (
            <>
              <button className="btn btn-warning mb-2" disabled>
                Waiting for opponent...
              </button>
              <button className="btn btn-secondary mb-2" onClick={cancelDuel}>
                Cancel Duel
              </button>
            </>
          ) : (
            <button className="btn btn-danger mb-2" onClick={startDuel}>
              Start Duel
            </button>
          )}

          <button
            className="btn btn-info mb-2"
            onClick={() => navigate("/leaderboard")}
          >
            📊 View Leaderboard
          </button>

          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <div className="game-board">
          <h2>
            Use these numbers: <span className="digits">{digits.join(" ")}</span>
          </h2>

          {duelMode && opponentName && (
            <h4 className="text-danger">🔥 Opponent: {opponentName}</h4>
          )}

          <div className="solution-display">
            <input
              type="text"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Build your solution..."
              className="solution-input"
            />
          </div>

          {/* === Button Group === */}
          <div className="button-group mt-4">
            <button className="btn btn-clear" onClick={clearSolution}>
              ❌ Clear
            </button>
            <button className="btn btn-success" onClick={submitSolution}>
              ✅ Submit
            </button>
            <button className="btn btn-warning" onClick={returnToMenu}>
              ⬅ Return to Menu
            </button>
          </div>

          {message && (
            <div
              className={`message ${
                message.includes("Correct") || message.includes("win")
                  ? "success"
                  : "error"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
