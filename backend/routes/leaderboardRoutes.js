// backend/routes/leaderboardRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { io } = require("../server"); // Make sure io is exported from server.js

// 🏆 GET Leaderboard by Mode (classic or duel)
router.get("/:mode", async (req, res) => {
  const { mode } = req.params;

  if (!["classic", "duel"].includes(mode)) {
    return res.status(400).json({ message: "Invalid mode" });
  }

  try {
    const leaderboard = await User.find({
      [`stats.${mode}`]: { $exists: true },
    })
      .sort({ [`stats.${mode}.score`]: -1, [`stats.${mode}.time`]: 1 })
      .select("username stats");

    res.status(200).json({ leaderboard });
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard", error });
  }
});

// 🏆 Update User Stats (After a Game)
router.post("/update", async (req, res) => {
  const { username, mode, score, time } = req.body;

  if (!["classic", "duel"].includes(mode)) {
    return res.status(400).json({ message: "Invalid mode" });
  }

  try {
    let user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure stats object exists
    user.stats = user.stats || {};
    user.stats[mode] = user.stats[mode] || { score: 0, time: 9999 };

    if (
      score > user.stats[mode].score ||
      (score === user.stats[mode].score && time < user.stats[mode].time)
    ) {
      user.stats[mode].score = score;
      user.stats[mode].time = time;
      await user.save();

      // Emit updated leaderboard if io is available
      if (io) {
        const leaderboard = await User.find({
          [`stats.${mode}`]: { $exists: true },
        })
          .sort({ [`stats.${mode}.score`]: -1, [`stats.${mode}.time`]: 1 })
          .select("username stats");

        io.emit("leaderboardUpdate", leaderboard);
      }
    }

    res.status(200).json({ message: "Stats updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating stats", error });
  }
});

module.exports = router;
