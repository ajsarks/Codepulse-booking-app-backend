import Teams from '../models/teams.js';
import { createError } from '../utils/error.js';

// CREATE a new team
export const createTeam = async (req, res, next) => {
  try {
    const newTeam = new Teams(req.body);
    const savedTeam = await newTeam.save();
    res.status(201).json(savedTeam);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// GET all teams
export const getAllTeams = async (req, res, next) => {
  try {
    const teams = await Teams.find();
    res.status(200).json(teams);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// GET a team by ID
export const getTeam = async (req, res, next) => {
  try {
    const team = await Teams.findById(req.params.id);
    if (!team) {
      return next(createError(404, "Team not found"));
    }
    res.status(200).json(team);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// UPDATE a team by ID
export const updateTeam = async (req, res, next) => {
  try {
    const updatedTeam = await Teams.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTeam) {
      return next(createError(404, "Team not found"));
    }
    res.status(200).json(updatedTeam);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// DELETE a team by ID
export const deleteTeam = async (req, res, next) => {
  try {
    const deletedTeam = await Teams.findByIdAndDelete(req.params.id);
    if (!deletedTeam) {
      return next(createError(404, "Team not found"));
    }
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

export default {
  createTeam,
  getAllTeams,
  getTeam,
  updateTeam,
  deleteTeam,
};
