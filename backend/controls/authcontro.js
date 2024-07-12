import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import emailValidator from 'email-validator';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createError } from '../utils/error.js';
import User from '../models/user.js'; // Ensure consistent casing

dotenv.config();

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Function to send confirmation email
const sendConfirmationEmail = (user) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.EMAIL_SECRET,
    { expiresIn: '1d' } // Token expiration time
  );

  const url = `${process.env.BASE_URL}/api/confirmation/${token}`;

  transporter.sendMail({
    to: user.email,
    subject: 'Confirm your Email',
    html: `Please click this link to confirm your email: <a href="${url}">${url}</a>`,
  });
};

// Function to resend confirmation email
const resendConfirmationEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw createError(404, 'User not found');
  }
  if (user.isConfirmed) {
    throw createError(400, 'Email is already confirmed');
  }
  sendConfirmationEmail(user);
};

// Registration function
export const register = async (req, res, next) => {
  try {
    const { name, email, password, isConfirmed } = req.body;

    if (!name) {
      return next(createError(400, 'Name is required'));
    }
    if (!email || !emailValidator.validate(email)) {
      return next(createError(400, 'Valid email is required'));
    }
    if (!password) {
      return next(createError(400, 'Password is required'));
    }
    if (password.length < 8 || !/[^a-zA-Z]/.test(password)) {
      return next(createError(400, 'Password must be at least 8 characters long and contain at least one non-alphabetical character'));
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isConfirmed: isConfirmed, // Set isConfirmed based on the request body
    });

    await newUser.save();

    if (!isConfirmed) {
      sendConfirmationEmail(newUser);
      res.status(200).send('User has been created. Please confirm your email.');
    } else {
      res.status(200).send('User has been created and confirmed.');
    }
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate key error
      return next(createError(400, 'Email already exists'));
    }
    next(err);
  }
};

// Login function
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !emailValidator.validate(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isConfirmed) {
      await resendConfirmationEmail(email);
      return res.status(400).json({ error: 'Please confirm your email first. A new confirmation link has been sent to your email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT,
      { expiresIn: '1h' }
    );

    const { password: _, isAdmin, ...otherDetails } = user._doc;
    res
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin });
  } catch (err) {
    next(err);
  }
};

// Forgot Password function
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret = process.env.JWT;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });

    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 3600000, // 1 hour
      }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      subject: 'Password Reset Request',
      html: `You are receiving this email because you (or someone else) have requested to reset the password for your account. 
             Please click on the following link, or paste this into your browser to complete the process:
             <a href="${resetUrl}">${resetUrl}</a><br><br>
             If you did not request this, please ignore this email and your password will remain unchanged.<br>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'Password reset link sent' });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Reset Password function
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const secret = process.env.JWT;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the user with the new password and invalidate the reset token
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        }
      }
    );

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: error.message });
  }
};
// Email confirmation route
export const confirmEmailHandler = async (req, res, next) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createError(400, 'Invalid token'));
    }

    user.isConfirmed = true;
    await user.save();

    res.status(200).send('Email confirmed, you can now log in.');
  } catch (err) {
    next(err);
  }
};
