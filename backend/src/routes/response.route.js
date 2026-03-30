import { Router } from "express";
import {
    createResponse,
    getResponsesForRequest,
    getMyResponses,
    acceptResponse,
    rejectResponse
} from "../controllers/response.controller.js";
import {verifyJWT, optionalAuth} from "../middlewares/auth.middleware.js";
import {upload, handleMulterError} from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/create-response",
    verifyJWT,
    upload.single("image"),
    handleMulterError,
    createResponse
);

router.get("/get-my-res", verifyJWT, getMyResponses);

// public-ish endpoint: allow optional auth so callers without tokens can still fetch responses
router.get("/get-req-for-res/:requestId", optionalAuth, getResponsesForRequest);

router.patch("/:id/accept", verifyJWT, acceptResponse);

router.patch("/:id/reject", verifyJWT, rejectResponse);

export default router;