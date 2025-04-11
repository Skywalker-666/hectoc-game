const express = require("express");
const router = express.Router();
const adminAuth = require("../config/firebase"); // assuming you're exporting admin.auth()
const User = require("../models/User");

// ✅ Signup Route
router.post("/signup", async (req, res) => {
  const { uid, email, displayName, username, token } = req.body;

  try {
    // 🔒 Verify Firebase ID token
    const decoded = await adminAuth.verifyIdToken(token);

    if (decoded.uid !== uid) {
      return res.status(401).json({ message: "UID mismatch" });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = new User({ uid, email, displayName, username });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
  const { token, displayName, uid } = req.body;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { email } = decodedToken;

    if (decodedToken.uid !== uid) {
      return res.status(401).json({ message: "UID mismatch" });
    }

    let user = await User.findOne({ uid });

    if (!user) {
      // Generate a unique username from displayName
      let username = displayName.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000);
      while (await User.findOne({ username })) {
        username = displayName.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000);
      }

      user = new User({ uid, email, displayName, username });
      await user.save();
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(401).json({ message: "Invalid Token", error: error.message });
  }
});

module.exports = router;
