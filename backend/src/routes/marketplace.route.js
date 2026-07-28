import { Router } from "express";
import {
  createListing,
  getListingById,
  getListings,
  getMyListings,
  requestListing,
  updateAvailability,
  updateListing
} from "../controllers/marketplace.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { checkBlockedUser } from "../middlewares/blockUser.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/", getListings);
router.get("/mine", verifyJWT, getMyListings);
router.get("/:id", optionalAuth, getListingById);
router.post("/", verifyJWT, checkBlockedUser, upload.array("images", 6), handleMulterError, createListing);
router.put("/:id", verifyJWT, checkBlockedUser, upload.array("images", 6), handleMulterError, updateListing);
router.patch("/:id/availability", verifyJWT, updateAvailability);
router.post("/:id/request", verifyJWT, checkBlockedUser, requestListing);

export default router;
