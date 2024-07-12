import TeamMembers from '../models/TeamMembers.js';
import Teams from '../models/teams.js';
import { createError } from '../utils/error.js';

// CREATE a new team member and link to team by name
export const addTeamMember = async (req, res, next) => {
  try {
    // Find team by name
    const team = await Teams.findOne({ name: req.body.teamName });
    if (!team) {
      return next(createError(404, "Team not found"));
    }

    // Create a new team member and link to team
    const newMember = new TeamMembers(req.body);
    newMember.team = team._id;
    const savedMember = await newMember.save();

    // Link member to team
    team.teamMembers.push(savedMember._id);
    await team.save();

    res.status(201).json(savedMember);
  } catch (error) {
    next(error); // Passes the error to the global error handler
  }
};

// READ all team members
export const getAllTeamMembers = async (req, res, next) => {
  try {
    const members = await TeamMembers.find().populate('team');
    res.status(200).json(members);
  } catch (error) {
    next(error); // Passes the error to the global error handler
  }
};

// READ a single team member by ID
export const getTeamMemberById = async (req, res, next) => {
  try {
    const member = await TeamMembers.findById(req.params.id).populate('team');
    if (!member) {
      return next(createError(404, "Team member not found"));
    }
    res.status(200).json(member);
  } catch (error) {
    next(error); // Passes the error to the global error handler
  }
};

// UPDATE a team member by ID
export const updateTeamMember = async (req, res, next) => {
  try {
    const updatedMember = await TeamMembers.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMember) {
      return next(createError(404, "Team member not found"));
    }
    res.status(200).json(updatedMember);
  } catch (error) {
    next(error); // Passes the error to the global error handler
  }
};

// DELETE a team member by ID
export const deleteTeamMember = async (req, res, next) => {
  try {
    const deletedMember = await TeamMembers.findByIdAndDelete(req.params.id);
    if (!deletedMember) {
      return next(createError(404, "Team member not found"));
    }
    // Remove member from linked team
    const team = await Teams.findById(deletedMember.team);
    if (team) {
      team.teamMembers.pull(deletedMember._id);
      await team.save();
    }
    res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    next(error); // Passes the error to the global error handler
  }
};

export default {
  addTeamMember,
  getAllTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
};
