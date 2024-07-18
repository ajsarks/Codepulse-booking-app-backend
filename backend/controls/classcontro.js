import Class from '../models/classes.js';
import Teams from '../models/teams.js';
import { createError } from '../utils/error.js';

// Helper function to fetch team IDs from team names
const getTeamIds = async (teamNames) => {
  const teams = await Teams.find({ name: { $in: teamNames } });
  const teamIds = teams.map(team => team._id);
  return teamIds;
};

// CREATE a new class
export const createClass = async (req, res, next) => {
  try {
    // Convert team names to team IDs
    let teamIds = [];
    if (req.body.teams && Array.isArray(req.body.teams)) {
      teamIds = await getTeamIds(req.body.teams);
    }

    // Create and save a new class instance with linked team IDs
    const newClass = new Class({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      city: req.body.city,
      type: req.body.type,
      daysrequired: req.body.daysrequired,
      oneLiner: req.body.oneliner,
      supplies: req.body.supplies,
      photos: req.body.photos,
      teams: teamIds
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// UPDATE a class by ID
export const updateClass = async (req, res, next) => {
  try {
    // Convert team names to team IDs
    let teamIds = [];
    if (req.body.teams && Array.isArray(req.body.teams)) {
      teamIds = await getTeamIds(req.body.teams);
    }

    // Update the class with new data and linked team IDs
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, {
      ...req.body,
      teams: teamIds
    }, { new: true });

    if (!updatedClass) {
      return next(createError(404, "Class not found"));
    }
    res.status(200).json(updatedClass);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// DELETE a class by ID
export const deleteClass = async (req, res, next) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// GET a class by ID
export const getClass = async (req, res, next) => {
  try {
    const foundClass = await Class.findById(req.params.id);
    if (!foundClass) {
      return next(createError(404, "Class not found"));
    }
    res.status(200).json(foundClass);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// GET all classes
export const getAllClasses = async (req, res, next) => {
  try {
    const allClasses = await Class.find();
    res.status(200).json(allClasses);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// Count classes by city
export const countByCity = async (req, res, next) => {
  try {
    const city = req.query.city;
    const count = await Class.countDocuments({ city: new RegExp(`^${city}$`, 'i') });
    res.status(200).json({ count });
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// Search classes by city
export const searchByCity = async (req, res, next) => {
  try {
    const city = req.query.city;
    const classes = await Class.find({ city: new RegExp(`^${city}$`, 'i') });
    res.status(200).json(classes);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// Search classes by type
export const searchByType = async (req, res, next) => {
  try {
    const type = req.query.type;
    const classes = await Class.find({ type: new RegExp(`^${type}$`, 'i') });
    res.status(200).json(classes);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

export default {
  createClass,
  updateClass,
  deleteClass,
  getClass,
  getAllClasses,
  countByCity,
  searchByCity,
  searchByType,
};