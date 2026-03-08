import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import { Server as SocketIO } from "socket.io";

import { configurePassport } from "./config/passport.js";
import authRoute      from "./routes/auth.js";
import challengeRoute from "./routes/challenge.js";
import wordInfoRoute  from "./routes/wordInfo.js";
import aiMoveRoute    from "./routes/aiMove.js";
import gamesRoute     from "./routes/games.js";

const app    = express();
const server = http.createServer(app);

const io = new SocketIO(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

app.use(express.json());

const MONGO_URI = "mongodb://127.0.0.1:27017/scrabble";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ───────────────────────────────────
app.use("/api/auth",      authRoute);
app.use("/api/challenge", challengeRoute);
app.use("/api/word-info", wordInfoRoute);
app.use("/api/ai-move",   aiMoveRoute);
app.use("/api/games",     gamesRoute);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// ── Socket.io (Phase 5) ───────────────────────
io.on("connection", socket => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

server.listen(3000, () => console.log("Server running on port 3000"));