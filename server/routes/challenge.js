import express from "express";
import { challengeWord } from "../services/challengeService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { word } = req.body;

    const result = await challengeWord(word);

    res.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Challenge validation failed"
    });
  }
});

export default router;
