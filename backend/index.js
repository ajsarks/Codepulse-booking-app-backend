import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from 'express-session';
import cors from 'cors';

// Import Passport configuration
import './passport.js'; // Ensure this path is correct

// Import routes
import authRoute from './routes/auth.js';
import userRoute from './routes/users.js';
import teamsRoute from './routes/teams.js';
import classRoute from './routes/classes.js';
import bookingRoute from './routes/booking.js';
import confirmationRoute from './routes/confirmation.js';
import teammembersroute from './routes/teamember.js'

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: true, // Your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT, // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Set secure to true if using HTTPS
}));

// Initialize Passport
import passport from 'passport'; // Import passport here after passport-config has been loaded
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/classes', classRoute);
app.use('/api/teams', teamsRoute);
app.use('/api/booking', bookingRoute);
app.use('/api/confirmation', confirmationRoute);
app.use('/api/teammembers', teammembersroute); // Added this line

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

const PORT = process.env.PORT2 || 8000; // Default to 8000 if PORT2 is not set
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});