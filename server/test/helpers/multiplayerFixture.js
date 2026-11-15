import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { configurePassport } from "../../config/passport.js";
import authRouter from "../../routes/auth.js";
import gamesRouter from "../../routes/games.js";
import User from "../../models/User.js";
import Game from "../../models/Game.js";
import Word from "../../models/Word.js";
import PersonalDictionary from "../../models/PersonalDictionary.js";

// Test-only login and deterministic racks. Never mounted by server/app.js.
export async function multiplayerFixture({ browser = false } = {}) {
  const dbName = `scrabble_regression_${randomUUID().replaceAll("-", "")}`;
  const mongoUrl = `mongodb://127.0.0.1:27017/${dbName}`;
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 3000 });
  await Promise.all([User.init(), Game.init(), Word.init(), PersonalDictionary.init()]);
  const users = await User.create(["Ана тест", "Бојан тест"].map((displayName, i) => ({
    googleId: `fixture-${i}`, displayName, email: `fixture-${i}@example.invalid`,
  })));
  process.env.GOOGLE_CLIENT_ID ||= "test-only-client";
  process.env.GOOGLE_CLIENT_SECRET ||= "test-only-secret";
  process.env.SERVER_URL ||= "http://127.0.0.1";
  configurePassport();
  const app = express();
  const store = MongoStore.create({ mongoUrl });
  app.use(express.json());
  app.use(session({ secret: randomUUID(), resave: false, saveUninitialized: false, store }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.post("/__test/login/:index", (req, res, next) => {
    const user = users[Number(req.params.index)];
    if (!user) return res.sendStatus(404);
    req.login(user, error => error ? next(error) : res.json({ success: true }));
  });
  const seedRack = async gameId => {
    const game = await Game.findOne({ gameId });
    if (!game || game.status === "challenge") throw new Error("Cannot seed a pending move");
    const letters = ["М", "А", "М", "А", "Ж", "Ж", "Р"];
    game.players[game.currentPlayerIndex].rack = letters.map((letter, i) => ({ id: `${randomUUID()}-${i}`, letter, points: 1 }));
    await game.save();
    return game;
  };
  app.post("/__test/rack/:gameId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (game?.createdBy.toString() !== req.user._id.toString()) return res.sendStatus(403);
    await seedRack(game.gameId);
    res.json({ success: true });
  });
  await Word.create([
    { word: "ма", valid: true, definition: "Тест-дефиниција за зборот ма." },
    { word: "жж", valid: false, definition: null },
    { word: "мм", valid: true, definition: "Дефиниција за вкрстениот збор." },
    { word: "аа", valid: true, definition: "Друга дефиниција." },
  ]);
  app.use("/api/auth", authRouter);
  app.use("/api/games", gamesRouter);
  if (browser) {
    const dist = fileURLToPath(new URL("../../../client/dist/", import.meta.url));
    app.use(express.static(dist));
    app.get("/{*path}", (_req, res) => res.sendFile(`${dist}/index.html`));
  }
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (cookie, path, body, method = body === undefined ? "GET" : "POST") => {
    const response = await fetch(base + path, {
      method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
  };
  const cookies = [];
  for (let i = 0; i < users.length; i++) cookies.push((await request(null, `/__test/login/${i}`, {})).cookie);
  const close = async () => {
    await new Promise(resolve => server.close(resolve));
    await store.close();
    // Only the unique database created by this fixture is removed.
    if (mongoose.connection.name !== dbName || !dbName.startsWith("scrabble_regression_")) throw new Error("Unexpected test database");
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  };
  return { app, base, users, cookies, request, seedRack, close };
}
