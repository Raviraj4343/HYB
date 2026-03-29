import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isSuperAdmin } from "../middlewares/admin.middleware.js";
import { uploadCampusResource, handleMulterError } from "../middlewares/multer.middleware.js";
import {
  getCampusResources,
  createCampusResource,
  updateCampusResource,
  deleteCampusResource,
} from "../controllers/campusResource.controller.js";

const router = Router();

router.get("/", getCampusResources);

router.post("/", verifyJWT, isSuperAdmin, uploadCampusResource.single("image"), handleMulterError, createCampusResource);
router.put("/:id", verifyJWT, isSuperAdmin, uploadCampusResource.single("image"), handleMulterError, updateCampusResource);
router.delete("/:id", verifyJWT, isSuperAdmin, deleteCampusResource);

export default router;
