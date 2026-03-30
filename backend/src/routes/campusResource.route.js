import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isSuperAdmin } from "../middlewares/admin.middleware.js";
import { uploadCampusResource, handleMulterError } from "../middlewares/multer.middleware.js";
import {
  getCampusResources,
  getCampusResource,
  createCampusResource,
  updateCampusResource,
  deleteCampusResource,
} from "../controllers/campusResource.controller.js";

const router = Router();

router.get("/", getCampusResources);

router.get("/:id", getCampusResource);

// accept multiple named fields: image (single), images (multiple for news), messMenu (single for hostel)
router.post(
  "/",
  verifyJWT,
  isSuperAdmin,
  uploadCampusResource.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 },
    { name: 'messMenu', maxCount: 1 },
  ]),
  handleMulterError,
  createCampusResource
);
router.put(
  "/:id",
  verifyJWT,
  isSuperAdmin,
  uploadCampusResource.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 },
    { name: 'messMenu', maxCount: 1 },
  ]),
  handleMulterError,
  updateCampusResource
);
router.delete("/:id", verifyJWT, isSuperAdmin, deleteCampusResource);

export default router;
