const express = require("express");
const router = express.Router();
const admin = require("../config/firebase");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  const { uid, email, displayName, username } = req.body;

  try {
    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = new User({ uid, email, displayName, username });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});


router.post("/login", async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    let user = await User.findOne({ uid });

    if (!user) {
      // Generate a unique username from Google name
      let username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

      // Ensure username is unique
      while (await User.findOne({ username })) {
        username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
      }

      user = new User({ uid, email, displayName: name, username });
      await user.save();
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(401).json({ message: "Invalid Token", error });
  }
});


module.exports = router;
