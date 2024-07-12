import 'dotenv/config'; // Load environment variables
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/user.js'; // Adjust the import according to your project structure

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`, // Use BASE_URL from the .env file
    scope: ['profile', 'email'], // Request profile and email information
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                googleId: profile.id,
                name: profile.displayName, // Get name from Google's profile
                email: profile.emails[0].value, // Get email from Google's profile
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
