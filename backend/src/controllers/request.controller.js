import { Request } from "../models/request.models.js";
import { User } from "../models/user.models.js";
import { Response } from "../models/response.models.js";
import {Chat} from "../models/chat.models.js";
import {Message} from "../models/message.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { DEFAULT_PAGE_SIZE, DELETE_WINDOW_MINUTES } from "../constants.js";
import { createAndEmitNotification, emitChatListRefresh, emitRequestChanged } from "../utils/realtime.js";


const createRequest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    urgency,
    locationHint,
    contact,
    expiryDuration
  } = req.body;

  let imageUrl = null;

  if (req.file?.path) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult?.secure_url) {
      throw new ApiError(500, "Image upload failed");
    }
    imageUrl = uploadResult.secure_url;
  }

  const expiresAt = new Date();
  expiresAt.setHours(
    expiresAt.getHours() + (Number(expiryDuration) || 24)
  );

  const request = await Request.create({
    title,
    description,
    category,
    urgency,
    image: imageUrl,
    locationHint,
    contact,
    expiresAt,
    requestedBy: req.user._id
  });

  await request.populate("requestedBy", "fullName userName avatar");
  emitRequestChanged("created", request.toObject());

  res.status(201).json(
    new ApiResponse(201, { request }, "Request created successfully")
  );
});

const getAllRequests = asyncHandler(async (req, res) => {
  const {
    category,
    urgency,
    status,
    page = 1,
    limit = DEFAULT_PAGE_SIZE
  } = req.query;

  const query = {};

  if (category) query.category = category;
  if (urgency) query.urgency = urgency;

  query.status = status
    ? status
    : { $in: ["open", "in-progress"] };

  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    Request.find(query)
      .populate("requestedBy", "fullName userName avatar branch year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),

    Request.countDocuments(query)
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        requests,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      },
      "Requests retrieved successfully"
    )
  );
});

const getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate("requestedBy", "fullName userName avatar branch year hostel")
    .populate("acceptedHelper", "fullName userName avatar");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  res.status(200).json(
    new ApiResponse(200, { request }, "Request retrieved successfully")
  );
});

const acceptRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await Request.findById(id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.requestedBy.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot accept your own request");
  }

  if (request.status !== "open") {
    throw new ApiError(400, "Request is not open for acceptance");
  }

  request.status = "in-progress";
  request.acceptedHelper = req.user._id;

  await request.save();

  let chat = await Chat.findOne({ request: request._id });

 if (!chat) {
  chat = await Chat.create({
    request: request._id,
    participants: [
      request.requestedBy,
      req.user._id
    ]
  });
 }

  emitRequestChanged("accepted", request.toObject());
  emitChatListRefresh([request.requestedBy, req.user._id]);


  res.status(200).json(
    new ApiResponse(200, { request, chat }, "Request accepted successfully")
  );
});


const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({
    requestedBy: req.user._id
  })
    .populate("acceptedHelper", "fullName userName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { requests }, "Your requests retrieved successfully")
  );
});

const updateRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.requestedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this request");
  }

  if (["fulfilled", "cancelled"].includes(request.status)) {
    throw new ApiError(
      400,
      "Cannot update fulfilled or cancelled requests"
    );
  }

  const {
    title,
    description,
    category,
    urgency,
    locationHint
  } = req.body;

  const updatedRequest = await Request.findByIdAndUpdate(
    req.params.id,
    { title, description, category, urgency, locationHint },
    { new: true, runValidators: true }
  ).populate("requestedBy", "fullName userName avatar");
  emitRequestChanged("updated", updatedRequest.toObject());

  res.status(200).json(
    new ApiResponse(
      200,
      { request: updatedRequest },
      "Request updated successfully"
    )
  );
});

const cancelRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.requestedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to cancel this request");
  }

  if (request.status === "fulfilled") {
    throw new ApiError(400, "Cannot cancel fulfilled request");
  }

  request.status = "cancelled";
  await request.save();
  emitRequestChanged("cancelled", request.toObject());

  res.status(200).json(
    new ApiResponse(200, { request }, "Request cancelled successfully")
  );
});

const fulfillRequest = asyncHandler(async (req, res) => {
  const { helperId } = req.body;
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.requestedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to fulfill this request");
  }

  if (request.status !== "in-progress") {
    throw new ApiError(
      400,
      "Only in-progress requests can be fulfilled"
    );
  }

  const responses = await Response.find({ request: request._id }).select("responder status");
  const responderIds = responses.map((response) => response.responder.toString());
  const currentHelperId = request.acceptedHelper?.toString() || null;

  let selectedHelperId = helperId?.toString().trim() || currentHelperId;

  if (!selectedHelperId) {
    throw new ApiError(400, "Please select the user who helped you");
  }

  const isValidSelectedHelper =
    responderIds.includes(selectedHelperId) || currentHelperId === selectedHelperId;

  if (!isValidSelectedHelper) {
    throw new ApiError(400, "Selected helper did not respond to this request");
  }

  if (request.acceptedHelper?.toString() !== selectedHelperId) {
    request.acceptedHelper = selectedHelperId;
  }

  await Response.updateMany(
    { request: request._id },
    {
      $set: {
        status: "rejected",
      },
    }
  );

  await Response.updateMany(
    { request: request._id, responder: selectedHelperId },
    {
      $set: {
        status: "accepted",
      },
    }
  );

  request.status = "fulfilled";
  request.fulfilledAt = new Date();
  await request.save();

  if (request.acceptedHelper) {
    await User.findByIdAndUpdate(
      request.acceptedHelper,
      { $inc: { helpCount: 1 } }
    );
  }

  emitRequestChanged("fulfilled", request.toObject());

  res.status(200).json(
    new ApiResponse(200, { request }, "Request marked as fulfilled")
  );
});

const deleteRequest = asyncHandler(async(req, res) => {
  const request = await Request.findById(req.params.id);
  if(!request){
    throw new ApiError(404,"Request not found");
    }

    if(request.requestedBy.toString() !== req.user._id.toString()){
      throw new ApiError(403, "Not authorized to update this request");
    }

    if(request.status !== "open"){
      throw new ApiError(400, "Only open request can be deleted");
    }

    const createdAt = new Date(request.createdAt);
    const now = new Date();
    const diffMinutes = (now-createdAt)/(1000*60);
    if(diffMinutes > DELETE_WINDOW_MINUTES){
      throw new ApiError(400, "request can only be deleted within 5 min of creation");
    }

    const chatExists = await Chat.exists({request:request._id});

    if(chatExists){
      throw new ApiError(400, "you can't delete chat has been created");
    }

    await Request.deleteOne({_id:request._id});
    emitRequestChanged("deleted", { _id: request._id });
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Request deleted successfully"));
});

const getRequestStats = async (req, res) => {
 const activeRequests = await Request.countDocuments({
  status: { $in: ["open"] }
});

  res.status(200).json({
    success: true,
    data: {
      activeRequests,
    },
  });
};

const adminDeleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id).populate("requestedBy", "fullName userName");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  const moderationReason = req.body?.reason?.trim() || "Removed by super admin";
  const chat = await Chat.findOne({ request: request._id });

  if (chat) {
    await Message.deleteMany({ chat: chat._id });
    await Chat.deleteOne({ _id: chat._id });
    emitChatListRefresh(chat.participants);
  }

  await Request.deleteOne({ _id: request._id });
  emitRequestChanged("deleted", { _id: request._id });

  await createAndEmitNotification({
    user: request.requestedBy._id,
    type: "system",
    title: "Request removed by moderation",
    message: `Your request "${request.title}" was removed. Reason: ${moderationReason}`,
    data: {
      requestId: request._id,
      reason: moderationReason,
    },
    isRead: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { deletedRequestId: request._id }, "Request deleted by super admin")
  );
});

export {
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
};
