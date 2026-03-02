import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  valid: { type: Boolean, required: true },
  definition: { type: String, default: null },
  source: { type: String, default: "makedonski.gov.mk" },
  checkedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Word", wordSchema);
