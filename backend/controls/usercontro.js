import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import emailValidator from 'email-validator';
import { createError } from '../utils/error.js';


export const getUser = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.params.id);
        res.status(200).json(foundUser);
    } catch (err) {
        next(err);
    }
};

export const getAllUsers= async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { name, email, password, isConfirmed, isAdmin } = req.body;

        if (!name) {
            return next(createError(400, 'Name is required'));
        }
        if (!email || !emailValidator.validate(email)) {
            return next(createError(400, 'Valid email is required'));
        }

        let updateFields = {
            name,
            email,
            isConfirmed: isConfirmed || false,
            isAdmin: isAdmin || false
        };

        if (password) {
            if (password.length < 8 || !/[^a-zA-Z]/.test(password)) {
                return next(createError(400, 'Password must be at least 8 characters long and contain at least one non-alphabetical character'));
            }
            updateFields.password = bcrypt.hashSync(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return next(createError(404, 'User not found'));
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        if (err.code === 11000) {
            return next(createError(400, 'Email already exists'));
        }
        next(err);
    }
};