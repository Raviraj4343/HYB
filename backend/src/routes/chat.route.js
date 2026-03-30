import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkBlockedUser } from "../middlewares/blockUser.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";
import { deleteGlobalMessage, deleteMessage, getChatById, getGlobalMessages, getGlobalUnreadCount, getMessages, getMyChats, sendGlobalMessage, sendMessage, ensureChat } from "../controllers/chat.controller.js";

const router = Router();
router.use(verifyJWT);

router.get("/", getMyChats);
router.post("/ensure", ensureChat);
router.get("/global/messages", getGlobalMessages);
router.get("/global/unread-count", getGlobalUnreadCount);
router.post("/global/messages", checkBlockedUser, sendGlobalMessage);
router.delete("/global/messages/:messageId", deleteGlobalMessage);
router.get("/:id", getChatById);

router.post("/:id/messages",
    checkBlockedUser,
    upload.single("image"),
    handleMulterError,
    sendMessage
);

router.get("/:id/messages", getMessages);

router.delete(
  "/:id/messages/:messageId",
  verifyJWT,
  deleteMessage
);

export default router;
