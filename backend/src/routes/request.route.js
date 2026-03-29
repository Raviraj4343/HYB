import {Router} from "express";
import {
  createRequest,
  getAllRequests,
  getRequestById,
  acceptRequest,
  getMyRequests,
  updateRequest,
  cancelRequest,
  fulfillRequest,
  deleteRequest,
  getRequestStats,
  adminDeleteRequest
} from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isSuperAdmin } from "../middlewares/admin.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/create-req", verifyJWT, upload.single("image"), handleMulterError, createRequest);

router.get("/get-all-req", getAllRequests);
router.get("/get-req-ById/:id", getRequestById);


router.get("/get-my-req", verifyJWT, getMyRequests);
router.put("/accept-req/:id", verifyJWT, acceptRequest);
router.put("/update-req/:id", verifyJWT, updateRequest);
router.put("/cancle-req/:id", verifyJWT, cancelRequest);
router.put("/full-fill-req/:id", verifyJWT, fulfillRequest);
router.delete("/admin/:id", verifyJWT, isSuperAdmin, adminDeleteRequest);
router.delete("/:id", verifyJWT, deleteRequest);
router.get("/stats", verifyJWT, getRequestStats);

export default router;
