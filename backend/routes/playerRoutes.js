const express = require("express");
const router = express.Router();
let activePlayers = new Map(); // You can replace with Redis if scaling

// 👥 Add player to queue or mark online
router.post("/online", (req, res) => {
  const { username } = req.body;
  activePlayers.set(username, Date.now());
  res.status(200).json({ message: "Player marked online" });
});

// 🔍 Get all currently active players
router.get("/active", (req, res) => {
  const now = Date.now();
  const threshold = 1000 * 60 * 5; // 5 mins active window
  const active = Array.from(activePlayers.entries()).filter(([_, ts]) => now - ts < threshold).map(([name]) => name);
  res.status(200).json({ active });
});

module.exports = router;
