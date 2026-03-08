import express from "express";
import passport from "passport";

const router = express.Router();

// ── Kick off Google OAuth flow ───────────────
// Browser visits /api/auth/google → redirected to Google consent screen
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ── Google redirects back here after consent ─
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173?auth=failed",
  }),
  (_req, res) => {
    // Success — send user back to the app
    res.redirect("http://localhost:5173");
  }
);

// ── Logout ───────────────────────────────────
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

// ── Who am I? ────────────────────────────────
// Client calls this on load to check if already logged in.
// Returns the user object if authenticated, or 401 if not.
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      id:          req.user._id,
      displayName: req.user.displayName,
      email:       req.user.email,
      avatar:      req.user.avatar,
    });
  }
  return res.status(401).json({ user: null });
});

export default router;