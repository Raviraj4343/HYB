import mongoose from "mongoose";
import { Response } from "../models/response.models.js";
import { Request } from "../models/request.models.js";
import { Chat } from "../models/chat.models.js";
import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createAndEmitNotification, emitChatListRefresh, emitRequestChanged } from "../utils/realtime.js";


const createResponse = asyncHandler(async (req, res) => {
    const {requestId, message} = req.body;

    const request = await Request.findById(requestId);
    if(!request){
        throw new ApiError(404, "Request not found");
    }

    if(request.requestedBy.toString() === req.user._id.toString()){
        throw new ApiError(400, "can't repond toyour own request");
    }
    if (request.status !== "open") {
      throw new ApiError(400, "Can't respond to this request");
  }

    const alreadyResponded = await Response.findOne({
        request: request._id,
        responder:req.user._id
    });

    if(alreadyResponded){
        throw new ApiError(400, "You already responded to this request");
    }

    let image = null;
    if(req.file){
        const uploaded = await uploadOnCloudinary(req.file.path);
        if(!uploaded?.secure_url){
            throw new ApiError(500, "Image upload failed");
        }
        image = uploaded.secure_url;
    }

    const response = await Response.create({
        request:request._id,
        responder:req.user._id,
        message,
        image
    });

    await response.populate("responder", "fullName userName avatar");
    
    try {
      await createAndEmitNotification({
        user: request.requestedBy,
        type: "new_response",
        request: request._id,
        title: `${req.user.fullName} wants to help`,
        message: `${req.user.fullName} want to help with your request`
      });
      emitRequestChanged("response_created", { _id: request._id });
    } catch (error) {
      console.log("Notification error", error.message);
    }

    return res
    .status(201)
    .json({
      success:true,
      message: "Response created succesfully",
      data: response
    });
});

const getResponsesForRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await Request.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  let responses;

  const viewerId = req.user?._id?.toString?.() || null;
  const ownerId = request.requestedBy.toString();

  if (viewerId && viewerId === ownerId) {
    // request owner: see all responses
    responses = await Response.find({ request: requestId });
  } else if (viewerId) {
    // authenticated non-owner: show their own response if any, otherwise show accepted/completed responses
    responses = await Response.find({ request: requestId, responder: viewerId });
    if (!responses.length) {
      responses = await Response.find({ request: requestId, status: { $in: ['accepted', 'completed'] } });
    }
  } else {
    // unauthenticated: only show accepted/completed responses
    responses = await Response.find({ request: requestId, status: { $in: ['accepted', 'completed'] } });
  }

  // ✅ populate responder info
  responses = await Response.populate(responses, {
    path: "responder",
    select: "fullName userName avatar branch year helpCount"
  });

  const responderIds = responses
    .map((response) => response.responder?._id?.toString?.() || response.responder?.toString?.())
    .filter(Boolean);

  const participantIds = Array.from(new Set([ownerId, ...responderIds]));
  const chats = await Chat.find({
    request: requestId,
    participants: { $in: participantIds }
  }).select("_id participants");

  const chatByParticipantId = new Map();
  chats.forEach((chat) => {
    // Map chat id for each participant so lookups work for both owner and responder views
    (chat.participants || []).forEach((participant) => {
      chatByParticipantId.set(participant.toString(), chat._id.toString());
    });
  });

  responses = responses.map((response) => ({
    ...response.toObject(),
    chatId:
      chatByParticipantId.get(
        response.responder?._id?.toString?.() || response.responder?.toString?.()
      ) || null,
  }));

  // Add phone number to responses conditionally:
  // - super_admin can see all phones
  // - responder can see own phone
  // - request owner can see helper phone only when response is accepted/completed
  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];
    try {
      const responderId = resp.responder?._id?.toString?.() || resp.responder;
      const canSeePhone = (
        req.user?.role === 'super_admin' ||
        viewerId === responderId ||
        (ownerId === viewerId && ['accepted', 'completed'].includes(resp.status))
      );

      if (canSeePhone && responderId) {
        const u = await User.findById(responderId).select('phone');
        if (u && u.phone) {
          // put phone on responder object for frontend convenience
          if (resp.responder && typeof resp.responder === 'object') {
            resp.responder.phone = u.phone;
          } else {
            resp.responder = { _id: responderId, phone: u.phone };
          }
        }
      }
    } catch (err) {
      console.error('phone attach error', err.message);
    }
  }
  // Ensure any responses that missed chatId get checked individually (covers type/race edge cases)
  for (let i = 0; i < responses.length; i++) {
    if (!responses[i].chatId) {
      try {
        const possibleChat = await Chat.findOne({
          request: request._id,
          participants: { $all: [request.requestedBy, responses[i].responder?._id || responses[i].responder] }
        }).select('_id');

        if (possibleChat) {
          responses[i].chatId = possibleChat._id.toString();
        }
      } catch (err) {
        // ignore lookup errors and continue
        console.error('chat lookup error', err.message);
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { responses }, "Responses retrieved successfully")
  );
 });

const getMyResponses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const responses = await Response.find({ responder: req.user._id })
    .populate({
      path: "request",
      populate: {
        path: "requestedBy",
        select: "fullName userName avatar"
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalResponses = await Response.countDocuments({
    responder: req.user._id
  });

   res.status(200).json(
    new ApiResponse(
      200,
      {
        responses,
        pagination: {
          total: totalResponses,
          page,
          limit,
          totalPages: Math.ceil(totalResponses / limit)
        }
      },
      "Your responses retrieved successfully"
    )
  );
});

const acceptResponse = asyncHandler(async (req, res) => {
  const response = await Response.findById(req.params.id);
  if (!response) {
    throw new ApiError(404, "Response not found");
  }

  const request = await Request.findById(response.request);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.requestedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to accept this response");
  }

  if (["fulfilled", "cancelled", "expired"].includes(request.status)) {
    throw new ApiError(400, "This request is no longer open for new helpers");
  }

  if (response.status === "completed") {
    throw new ApiError(400, "This response is already marked as completed");
  }

  if (response.status === "accepted") {
    return res.status(200).json(
      new ApiResponse(200, { response }, "Response already accepted")
    );
  }

  response.status = "accepted";
  await response.save();

  const ownerId = request.requestedBy.toString();
  const helperId = response.responder.toString();

  if (ownerId === helperId) {
    throw new ApiError(400, "Invalid chat participants");
  }

  const ownerObj = new mongoose.Types.ObjectId(ownerId);
  const helperObj = new mongoose.Types.ObjectId(helperId);

  // Find all chats for this request & participant pair and dedupe if necessary
  let chats = await Chat.find({ request: request._id, participants: { $all: [ownerObj, helperObj] } }).sort({ updatedAt: -1 });
  if (chats.length > 1) {
    const [keep, ...others] = chats;
    const otherIds = others.map((c) => c._id);
    await Chat.deleteMany({ _id: { $in: otherIds } });
    chat = keep;
  } else if (chats.length === 1) {
    chat = chats[0];
  } else {
    try {
      chat = await Chat.create({ request: request._id, participants: [ownerObj, helperObj] });
    } catch (err) {
      if (err && err.code === 11000) {
        chats = await Chat.find({ request: request._id, participants: { $all: [ownerObj, helperObj] } }).sort({ updatedAt: -1 });
        if (chats.length > 0) {
          const [keep, ...others] = chats;
          const otherIds = others.map((c) => c._id);
          if (otherIds.length) await Chat.deleteMany({ _id: { $in: otherIds } });
          chat = keep;
        }
      } else {
        throw err;
      }
    }
  }

  try {
    await createAndEmitNotification({
      user: response.responder,
      type: "response_accepted",
      request: request._id,
      title: `Help accepted by ${req.user.fullName}`,
      message: `Your help offer was accepted by ${req.user.fullName}`
    });
  } catch (error) {
    console.error("Notification error:", error.message);
  }

  emitRequestChanged("response_accepted", { _id: request._id });
  emitChatListRefresh([ownerId, response.responder]);

  res.status(200).json(
    new ApiResponse(200, { response, chat }, "Response accepted successfully")
  );
});

const rejectResponse = asyncHandler(async (req, res) => {
  const response = await Response.findById(req.params.id);
  if (!response) {
    throw new ApiError(404, "Response not found");
  }

  const request = await Request.findById(response.request);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.requestedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to reject this response");
  }


  if (response.status === "completed") {
    throw new ApiError(400, "Cannot reject a completed response");
  }

  if (response.status === "rejected") {
    return res.status(200).json(
      new ApiResponse(200, { response }, "Response already rejected")
    );
  } 
  response.status = "rejected";
  await response.save();

  try {
    await createAndEmitNotification({
      user: response.responder,
      type: "response_rejected",
      request: request._id,
      title: "Help offer declined",
      message: "Your help offer was declined"
    });
  } catch (error) {
     console.log("Notification error:", error.message);
  }

  emitRequestChanged("response_rejected", { _id: request._id });

  res.status(200).json(
    new ApiResponse(200, { response }, "Response rejected successfully")
  );
});


export {
  createResponse,
  getResponsesForRequest,
  getMyResponses,
  acceptResponse,
  rejectResponse
};
