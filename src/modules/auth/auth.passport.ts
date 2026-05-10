import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateUser, createTokens } from "./auth.service";
import type { ObjectId } from "mongodb";

passport.serializeUser((user: { _id?: ObjectId; id?: string }, done) => {
  done(null, (user._id || user.id)?.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    // For now, just pass the id - in production, fetch user from DB
    done(null, { sub: id });
  } catch (error) {
    done(error);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        const user = await findOrCreateUser({
          email,
          name,
          googleId,
          avatar: profile.photos?.[0]?.value,
        });

        const tokens = createTokens(user._id!);

        // Attach tokens to the user object to pass to serialize
        (profile as any).userTokens = tokens;
        (profile as any).userId = user._id;

        return done(null, profile as any);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;