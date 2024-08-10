import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { register, login, forgotPassword, resetPassword, confirmEmailHandler } from '../controls/authcontro.js'; // Adjust the path as necessary

const router = express.Router();

// Registration and login routes
router.post('/register', register);
router.post('/login', login);

// Route for initiating forgot password process
router.post('/forgot-password', forgotPassword);

// Route for resetting password with token
router.post('/reset-password/:token', resetPassword);

// Email confirmation route
router.get('/confirmation/:token', confirmEmailHandler);

// Route to trigger OAuth authentication (example with Google)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// OAuth callback URL
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, generate JWT token
        const token = jwt.sign(
            { id: req.user._id, isAdmin: req.user.isAdmin },
            process.env.JWT,
            { expiresIn: '24h' }
        );

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        });

        // Redirect to the frontend with user details
        res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?user=${JSON.stringify(req.user)}`);
    }
);

// Logout route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

export default router; // Ensure this is a default export