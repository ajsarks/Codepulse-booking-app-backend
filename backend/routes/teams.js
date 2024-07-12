import express from 'express';
import { createTeam, updateTeam, deleteTeam, getTeam, getAllTeams } from '../controls/teamcontro.js'; // Ensure the correct import path to your controllers
import { verifyAdmin } from '../utils/verifyToken.js'; // Adjust the path as necessary

const router = express.Router();

// Route to create a new team
router.post('/', verifyAdmin, createTeam);

// Route to add a team to a class
router.post('/:classId', verifyAdmin, (req, res, next) => {
  // Implement your logic to add a team to a class here
  // Example: You may want to update the Class model with the new team ID
});

// Route to update an existing team by ID
router.put('/:id', verifyAdmin, updateTeam);

// Route to delete an existing team by ID
router.delete('/:id', verifyAdmin, deleteTeam);

// Route to get an existing team by ID
router.get('/:id', getTeam);

// Route to get all teams
router.get('/', getAllTeams);

export default router;
