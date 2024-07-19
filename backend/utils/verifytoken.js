import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";
import Booking from '../models/booking.js'; // Import the Booking model
import User from '../models/user.js'; // Import the User model

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('Token not found');
    return next(createError(401, "You are not authenticated!"));
  }

  jwt.verify(token, process.env.JWT, (err, user) => {
    if (err) {
      console.log('Token verification failed', err);
      return next(createError(403, "Token is not valid!"));
    }
    req.user = user;
    console.log('Token verified successfully', user);
    next();
  });
};

export const verifyBookingOwnerOrAdmin = (req, res, next) => {
  verifyToken(req, res, async (err) => {
    if (err) return next(err);

    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return next(createError(404, "Booking not found!"));
      }

      if (req.user.id === booking.userId.toString() || req.user.isAdmin) {
        next();
      } else {
        return next(createError(403, "You are not authorized!"));
      }
    } catch (error) {
      next(createError(500, "Internal Server Error"));
    }
  });
};

// Middleware to verify user owner or admin
export const verifyUserOwnerOrAdmin = (req, res, next) => {
  verifyToken(req, res, async (err) => {
    if (err) return next(err);

    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return next(createError(404, "User not found!"));
      }

      if (req.user.id === user._id.toString() || req.user.isAdmin) {
        next();
      } else {
        return next(createError(403, "You are not authorized!"));
      }
    } catch (error) {
      next(createError(500, "Internal Server Error"));
    }
  });
};

// Middleware to verify user
export const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return next(createError(403, "You are not authorized!"));
    }
  });
};

// Middleware to verify admin
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user.isAdmin) {
      next();
    } else {
      return next(createError(403, "You are not authorized!"));
    }
  });
};