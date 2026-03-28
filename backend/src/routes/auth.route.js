import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
} from "../controllers/auth.controller.js";
import {verifyJWT} from '../middlewares/auth.middleware.js';
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/register",
  upload.single("avatar"),   
  handleMulterError,         
  registerUser
);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-code", resendVerificationCode);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);

router.get("/me", verifyJWT, getCurrentUser);

router.put(
  "/update-profile",
  verifyJWT,
  upload.single("avatar"),
  handleMulterError,
  updateUserProfile
);

router.put("/change-password", verifyJWT, changeUserPassword);

// Password reset flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
