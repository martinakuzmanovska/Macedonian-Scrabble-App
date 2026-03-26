import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export function configurePassport() {
  // ── Serialize: store only user ID in the session cookie ──
  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  // ── Deserialize: load full user from DB on each request ──
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // ── Google OAuth strategy ─────────────────────────────────
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.CLIENT_URL + '/api/auth/google/callback'
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Find existing user or create a new one
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login time
          user.lastLogin = new Date();
          await user.save();
        } else {
          user = await User.create({
            googleId:    profile.id,
            displayName: profile.displayName,
            email:       profile.emails?.[0]?.value ?? "",
            avatar:      profile.photos?.[0]?.value ?? null,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
}