import express from 'express';
import {
  addTeamMember,
  getTeamMemberById,
  getAllTeamMembers,
  updateTeamMember,
  deleteTeamMember
} from '../controls/teammembercontro.js'; // Ensure the correct import path to your controllers
import { verifyAdmin } from '../utils/verifytoken.js'; // Adjust the path as necessary

const router = express.Router();

// Route to create a new team member
router.post('/', verifyAdmin, addTeamMember);

// Route to get all team members
router.get('/', getAllTeamMembers);

// Route to get a specific team member by ID
router.get('/:id', getTeamMemberById);

// Route to update a specific team member by ID
router.put('/:id', verifyAdmin, updateTeamMember);

// Route to delete a specific team member by ID
router.delete('/:id', verifyAdmin, deleteTeamMember);

export default router;
