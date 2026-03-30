import { Router } from "express";   

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getMyNotifications, markAllAsRead, markAsRead, deleteNotification, deleteAllNotifications } from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getMyNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/all", deleteAllNotifications);
router.delete("/:id", deleteNotification);

export default router;