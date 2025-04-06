const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 📌 GET User Profile
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    let user = await User.findOne({ username }).select("-_id username email stats");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

// 📌 GET User Rank in a Specific Game Mode
router.get("/:username/rank/:mode", async (req, res) => {
  const { username, mode } = req.params;

  try {
    let users = await User.find().sort({ [`stats.${mode}.score`]: -1, [`stats.${mode}.time`]: 1 });
    
    let rank = users.findIndex(user => user.username === username) + 1;
    
    if (rank === 0) {
      return res.status(404).json({ message: "User not found in leaderboard" });
    }

    res.status(200).json({ username, mode, rank });
  } catch (error) {
    res.status(500).json({ message: "Error fetching rank", error });
  }
});

module.exports = router;
