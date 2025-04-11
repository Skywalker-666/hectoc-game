// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { evaluate } = require("mathjs");

const authRoutes = require("./routes/authRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const userRoutes = require("./routes/userRoutes");

const User = require("./models/User");

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});


module.exports.io = io;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/user", userRoutes);

const playerGames = {};
const waitingQueue = [];
const activeDuels = {};

io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);

  socket.on("start-game", ({ username }) => {
    socket.username = username;
    const digits = generateNumbers();
    playerGames[socket.id] = { digits, startTime: Date.now() };
    socket.emit("game-started", digits);
  });

  socket.on("start-duel", ({ username, uid }) => {
    socket.username = username;
    socket.uid = uid; // store UID in socket
  

    if (!waitingQueue.includes(socket)) {
      waitingQueue.push(socket);
    }

    while (waitingQueue.length >= 2) {
      const p1 = waitingQueue.shift();
      const p2 = waitingQueue.shift();

      if (!p1.connected || !p2.connected) continue;

      const digits = generateNumbers();

      activeDuels[p1.id] = { opponent: p2.id, digits, startTime: Date.now() };
      activeDuels[p2.id] = { opponent: p1.id, digits, startTime: Date.now() };

      p1.emit("duel-started", { digits, opponent: p2.username || "Guest" });
      p2.emit("duel-started", { digits, opponent: p1.username || "Guest" });
      break;
    }

    if (waitingQueue.includes(socket)) {
      socket.emit("waiting-for-opponent");
    }
  });

  socket.on("cancel-duel", () => {
    const index = waitingQueue.findIndex((s) => s.id === socket.id);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
      console.log("❌ Player cancelled duel:", socket.id);
      socket.emit("duel-cancelled");
    }
  });

  socket.on("submit-solution", async ({ solution, duelMode, uid }) => {
    let digits, startTime;

    if (duelMode && activeDuels[socket.id]) {
      ({ digits, startTime } = activeDuels[socket.id]);
    } else if (playerGames[socket.id]) {
      ({ digits, startTime } = playerGames[socket.id]);
    }

    if (!digits) {
      return socket.emit("solution-validated", "❌ No active game! Start a new game.");
    }

    if (!uid) {
      return socket.emit("solution-validated", "❌ UID is missing. Please log in again.");
    }

    try {
      if (!areDigitsMatching(solution, digits)) {
        return socket.emit("solution-validated", "❌ You must use all provided numbers exactly once.");
      }

      if (!validateExpression(solution)) {
        return socket.emit("solution-validated", "❌ Invalid expression.");
      }

      let result;
      try {
        result = evaluate(solution.replace(/\s+/g, ""));
      } catch (err) {
        console.error("⚠️ Evaluation failed:", err.message, "Input:", solution);
        return socket.emit("solution-validated", "❌ Evaluation error. Check your input.");
      }

      if (result === 100) {
        const username = socket.username || "Guest";
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const mode = duelMode ? "duel" : "classic";

        let user = await User.findOne({ uid });

        if (!user) {
          user = await User.create({
            username: socket.username || "Guest",
            displayName: socket.username || "Guest",
            email: `${socket.username || "guest"}@hectoc.com`,
            uid: uid,
            stats: {
              [mode]: {
                score: 1,
                time: timeTaken,
              },
            },
          });
        } else {
          user.stats = user.stats || {};
          user.stats[mode] = user.stats[mode] || { score: 0, time: Infinity };

          user.stats[mode].score += 1;
          if (timeTaken < user.stats[mode].time) {
            user.stats[mode].time = timeTaken;
          }

          await user.save();
        }

        console.log(`✅ Score updated for ${username}: ${user.stats[mode].score}`);
        await broadcastLeaderboard(mode);

        if (duelMode && activeDuels[socket.id]) {
          const opponentId = activeDuels[socket.id].opponent;
          io.to(socket.id).emit("duel-result", "🎉 You win the duel!");
          io.to(opponentId).emit("duel-result", "❌ You lost the duel!");
          delete activeDuels[socket.id];
          delete activeDuels[opponentId];
        } else {
          socket.emit("solution-validated", "✅ Correct! 🎉");
        }
      } else {
        socket.emit("solution-validated", "❌ Result isn't 100.");
      }
    } catch (err) {
      console.error("🚨 Submission error:", err);
      socket.emit("solution-validated", "❌ Evaluation error. Check your input.");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    delete playerGames[socket.id];

    const index = waitingQueue.findIndex((s) => s.id === socket.id);
    if (index !== -1) waitingQueue.splice(index, 1);

    if (activeDuels[socket.id]) {
      const opponentId = activeDuels[socket.id].opponent;
      io.to(opponentId).emit("duel-result", "❌ Opponent disconnected. You win!");
      delete activeDuels[socket.id];
      delete activeDuels[opponentId];
    }
  });
});

function generateNumbers() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 9) + 1);
}

function validateExpression(expr) {
  return /^[0-9+\-*/().\s]+$/.test(expr);
}

function extractDigits(expression) {
  return expression
    .replace(/[^0-9]/g, "")
    .split("")
    .map(Number)
    .sort((a, b) => a - b);
}

function areDigitsMatching(expression, originalDigits) {
  const usedDigits = extractDigits(expression);
  const sortedOriginal = [...originalDigits].sort((a, b) => a - b);
  return (
    usedDigits.length === sortedOriginal.length &&
    usedDigits.every((val, i) => val === sortedOriginal[i])
  );
}

async function broadcastLeaderboard(mode) {
  try {
    const leaderboard = await User.find()
      .sort({ [`stats.${mode}.score`]: -1, [`stats.${mode}.time`]: 1 })
      .select("username stats");

    io.emit("leaderboardUpdate", leaderboard);
  } catch (err) {
    console.error("🚨 Leaderboard error:", err);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
