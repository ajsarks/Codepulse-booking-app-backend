import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { createError } from '../utils/error.js';

const router = express.Router();

router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createError(400, 'Invalid token'));
    }

    user.isConfirmed = true;
    await user.save();

    // Redirect to front-end confirmation success page
    res.redirect(`${process.env.FRONTEND_URL}/confirmation-success`);
  } catch (err) {
    next(err);
  }
});

export default router;
