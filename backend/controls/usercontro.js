import User from '../models/user.js';


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
        res.status(200).json({ message: 'Class deleted successfully' });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedClass);
    } catch (err) {
        next(err);
    }
};
