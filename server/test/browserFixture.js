import { multiplayerFixture } from "./helpers/multiplayerFixture.js";

const fixture = await multiplayerFixture({ browser: true });
fixture.app.post("/__test/shutdown", (_req, res) => {
  res.json({ success: true });
  setImmediate(async () => {
    await fixture.close();
  });
});
console.log(JSON.stringify({ fixtureUrl: fixture.base }));
