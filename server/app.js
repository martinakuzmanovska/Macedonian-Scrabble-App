import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import challengeRoute from "./routes/challenge.js";
import wordInfoRoute  from "./routes/wordInfo.js";
import aiMoveRoute    from "./routes/aiMove.js";
import cors from "cors";
import http from "http";
import { Server as SocketIO } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// ── MongoDB ──────────────────────────────────
mongoose
  .connect("mongodb://127.0.0.1:27017/scrabble")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ── Routes ───────────────────────────────────
app.use("/api/challenge", challengeRoute);
app.use("/api/word-info",  wordInfoRoute);
app.use("/api/ai-move",    aiMoveRoute);

// ── Health check ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Socket.io (placeholder for Phase 5) ──────
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ── Start ─────────────────────────────────────
// NOTE: server.listen (not app.listen) so Socket.io works
server.listen(3000, () => {
  console.log("Server running on port 3000");
});