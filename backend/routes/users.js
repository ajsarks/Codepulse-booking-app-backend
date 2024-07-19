import express from "express";
import {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
} from "../controls/usercontro.js";
import { verifyAdmin, verifyToken, verifyUser, verifyUserOrAdmin } from "../utils/verifytoken.js";

const router = express.Router();

// Route to check authentication
router.get("/checkauthentication", verifyToken, (req, res, next) => {
  res.send("Authenticated");
});

// UPDATE user - accessible by the user themselves or an admin
router.put("/:id", verifyUserOrAdmin, updateUser);

// DELETE user - accessible by the user themselves or an admin
router.delete("/:id", verifyUserOrAdmin, deleteUser);

// GET all users - no authentication required
router.get("/", getAllUsers);

// GET a specific user by ID - no authentication required
router.get("/:id", getUser);

export default router;