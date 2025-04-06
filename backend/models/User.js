const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  stats: {
    classic: { score: { type: Number, default: 0 }, time: { type: Number, default: 9999 } },
    challenge: { score: { type: Number, default: 0 }, time: { type: Number, default: 9999 } },
    duel: { score: { type: Number, default: 0 }, time: { type: Number, default: 9999 } }, // <-- ADD THIS
  },
}, { collection: "leaderboard" });


module.exports = mongoose.model("User", UserSchema);
