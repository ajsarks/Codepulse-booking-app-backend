import express from "express";
import {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
} from "../controls/usercontro.js";
import { verifyAdmin, verifyToken, verifyUser, verifyUserOrAdmin } from "../utils/verifytoken.js";

const router = express.Router();
router.get("/checkauthentication", verifyToken, (req, res, next) => {
  res.send("Authenticated");
});

// UPDATE
router.put("/:id", verifyUserOrAdmin, updateUser);

// DELETE
router.delete("/:id", verifyUserOrAdmin, deleteUser);

// GET
router.get("/", getAllUsers);

// GET ALL
router.get("/:id", getUser);

export default router;
