import { Response } from "../models/response.models.js";
import { Request } from "../models/request.models.js";
import { Chat } from "../models/chat.models.js";
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

  // ✅ Case 1: request owner → see all responses
  if (request.requestedBy.toString() === req.user._id.toString()) {
    responses = await Response.find({ request: requestId });
  } 
  // ✅ Case 2: responder → see only own response
  else {
    responses = await Response.find({
      request: requestId,
      responder: req.user._id
    });

    if (!responses.length) {
      throw new ApiError(403, "Not authorized to view responses");
    }
  }

  // ✅ populate responder info
  responses = await Response.populate(responses, {
    path: "responder",
    select: "fullName userName avatar branch year helpCount"
  });

  const responderIds = responses
    .map((response) => response.responder?._id?.toString?.() || response.responder?.toString?.())
    .filter(Boolean);

  const participantIds = Array.from(new Set([req.user._id.toString(), ...responderIds]));
  const chats = await Chat.find({
    request: requestId,
    participants: { $in: participantIds }
  }).select("_id participants");

  const chatByResponderId = new Map();
  chats.forEach((chat) => {
    const otherParticipant = chat.participants.find(
      (participant) => participant.toString() !== req.user._id.toString()
    );

    if (otherParticipant) {
      chatByResponderId.set(otherParticipant.toString(), chat._id.toString());
    }
  });

  responses = responses.map((response) => ({
    ...response.toObject(),
    chatId: chatByResponderId.get(response.responder?._id?.toString?.() || response.responder?.toString?.()) || null,
  }));

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

  let chat = await Chat.findOne({
    request: request._id,
    participants: { $all: [ownerId, response.responder] }
  });

  if (!chat) {
    chat = await Chat.create({
      request: request._id,
      participants: [ownerId, response.responder]
    });
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
