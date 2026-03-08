/**
 * Express middleware that rejects unauthenticated requests.
 * Use on any route that requires a logged-in user.
 *
 * Usage:
 *   import { requireAuth } from "../middleware/requireAuth.js";
 *   router.post("/", requireAuth, handler);
 */
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Not authenticated" });
}