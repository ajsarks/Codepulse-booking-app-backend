import express from 'express';
import {
  createBooking,
  updateBooking,
  deleteBooking,
  confirmBooking,
  cancelBooking,
  getAllBookings,
  getBookingById,
  getBookingsByUserId 
} from '../controls/booking.js'; // Corrected import path
import { verifyAdmin, verifyUser, verifyBookingOwnerOrAdmin } from "../utils/verifytoken.js";

const router = express.Router();

// Route to create a booking
router.post('/', createBooking);

// Route to update a booking
router.put('/:id', verifyUser, updateBooking);

// Route to delete a booking
router.delete('/:id', verifyAdmin, deleteBooking);

// Route to confirm a booking by admin
router.put('/confirm/:id', verifyAdmin, confirmBooking);

// Route to cancel a booking
router.put('/cancel/:id', verifyBookingOwnerOrAdmin, cancelBooking);


// Route to get all bookings
router.get('/', getAllBookings);

// Route to get a booking by ID
router.get('/:id', getBookingById);

router.get('/user/:userId', getBookingsByUserId);

export default router;