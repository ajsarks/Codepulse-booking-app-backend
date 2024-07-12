import express from "express";
import {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
} from "../controls/usercontro.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifytoken.js";

const router = express.Router();
router.get("/checkauthentication", verifyToken, (req,res,next)=>{
  res.send("Authenticated");
})


//UPDATE
router.put("/:id", verifyUser, updateUser);

//DELETE
router.delete("/:id", verifyUser, deleteUser);

//GET
router.get("/",getAllUsers);

//GET ALL
router.get("/:id",getUser);

export default router;
