// models/Player.js
import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  stats: {
    classic: {
      score: { type: Number, default: 0 },
      time: { type: Number, default: 0 },
    },
  },
});

const Player = mongoose.model("Player", playerSchema);
export default Player;
