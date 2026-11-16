import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  challengedAt: { type: Date, required: true },
  gameId: { type: String, required: true },
  author: {
    playerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    displayName: { type: String, required: true },
  },
}, { _id: false });
const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  normalizedWord: { type: String, required: true },
  word: { type: String, required: true },
  definition: { type: String, required: true },
  history: { type: [historySchema], default: [] },
});
schema.index({ ownerId: 1, normalizedWord: 1 }, { unique: true });
export default mongoose.model("PersonalDictionary", schema);
