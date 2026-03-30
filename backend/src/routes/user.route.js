import { Router } from "express";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";
import {
  getUserProfile,
  searchUsers,
  uploadAvatar,
  getCurrentUser,
  getBlockedUsers,
  getAtRiskUsers,
  getUserWarningHistory,
  resetUserWarnings
} from "../controllers/user.controller.js";

const router = Router();

router.get("/search", searchUsers);
router.get("/profile/:userName", optionalAuth, getUserProfile);
router.get("/me", verifyJWT, getCurrentUser);
router.put("/avatar", verifyJWT, upload.single("avatar"), handleMulterError, uploadAvatar);


router.get("/blocked", verifyJWT, isAdmin, getBlockedUsers);
router.get("/at-risk", verifyJWT, isAdmin, getAtRiskUsers);
router.get("/:userId/warnings", verifyJWT, isAdmin, getUserWarningHistory);
router.post("/:userId/reset-warnings", verifyJWT, isAdmin, resetUserWarnings);

export default router;

