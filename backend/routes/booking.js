import express from 'express';
import {
  createBooking,
  updateBooking,
  deleteBooking,
  confirmBooking,
  getAllBookings,
  getBookingById
} from '../controls/booking.js'; // Corrected import path
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

// Route to create a booking
router.post('/', verifyUser, createBooking);

// Route to update a booking
router.put('/:id', verifyUser, updateBooking);

// Route to delete a booking
router.delete('/:id', verifyUser, deleteBooking);

// Admin routes to update and delete any booking
router.put('/:id', verifyAdmin, updateBooking);
router.delete('/:id', verifyAdmin, deleteBooking);

// Route to confirm a booking by admin
router.put('/confirm/:id', verifyAdmin, confirmBooking);

// Route to get all bookings
router.get('/',  getAllBookings);

// Route to get a booking by ID
router.get('/:id', getBookingById);

export default router;
