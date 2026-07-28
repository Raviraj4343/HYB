import mongoose from "mongoose";
import { Chat } from "../models/chat.models.js";
import { MarketplaceListing } from "../models/marketplaceListing.models.js";
import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { DEFAULT_PAGE_SIZE } from "../constants.js";
import { createAndEmitNotification, emitChatListRefresh, emitChatMessageCreated } from "../utils/realtime.js";
import { validateMarketplaceListing } from "../utils/ValidatorAI.js";

const parsePositiveNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const escapeRegex = (value = "") => (
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);

const uploadListingImages = async (files = []) => {
  if (!files.length) return [];

  const uploads = await Promise.all(files.map(async (file) => {
    const result = await uploadOnCloudinary(file.path, {
      folder: "hyb/marketplace",
      quality: "auto:good",
      fetch_format: "auto"
    });
    if (!result?.secure_url) {
      throw new ApiError(500, `Image upload failed for ${file.originalname}`);
    }
    return result.secure_url;
  }));

  return uploads;
};

const populateListing = (query) => (
  query.populate("owner", "fullName userName avatar branch year hostel")
);

const buildListingPayload = (body, images) => {
  const payload = {
    title: body.title?.trim(),
    description: body.description?.trim(),
    category: body.category,
    listingType: body.listingType,
    price: parsePositiveNumber(body.price, undefined),
    condition: body.condition,
    contactPhone: body.contactPhone?.trim() || null,
    images
  };

  if (body.listingType === "borrow") {
    payload.securityDeposit = parsePositiveNumber(body.securityDeposit);
    payload.maxBorrowDuration = body.maxBorrowDuration?.trim() || null;
  } else {
    payload.securityDeposit = null;
    payload.maxBorrowDuration = null;
  }

  return payload;
};

const createListing = asyncHandler(async (req, res) => {
  const payload = buildListingPayload(req.body, []);

  if (!payload.title || !payload.description || !payload.category || !payload.listingType || payload.price === undefined || !payload.condition) {
    throw new ApiError(400, "Title, description, category, listing type, price, and condition are required");
  }

  const moderationResult = await validateMarketplaceListing(payload);
  if (moderationResult.isSpamOrIrrelevant) {
    throw new ApiError(400, `AI Marketplace Moderation Warning: ${moderationResult.reasoning || "This listing appears to be spam, irrelevant, unsafe, or inappropriate."}`);
  }

  const uploadedImages = await uploadListingImages(req.files || []);
  payload.images = uploadedImages;

  const listing = await MarketplaceListing.create({
    ...payload,
    owner: req.user._id
  });

  await listing.populate("owner", "fullName userName avatar branch year hostel");

  return res.status(201).json(
    new ApiResponse(201, { listing }, "Marketplace listing created successfully")
  );
});

const getListings = asyncHandler(async (req, res) => {
  const {
    search,
    listingType,
    category,
    condition,
    availability = "available",
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    includeTotal = "false"
  } = req.query;

  const query = {};

  if (availability && availability !== "all") {
    query.availability = availability;
  } else {
    query.availability = "available";
  }

  if (listingType && listingType !== "all") query.listingType = listingType;
  if (category && category !== "all") query.category = category;
  if (condition && condition !== "all") query.condition = condition;

  const priceQuery = {};
  const min = parsePositiveNumber(minPrice);
  const max = parsePositiveNumber(maxPrice);
  if (min !== null) priceQuery.$gte = min;
  if (max !== null) priceQuery.$lte = max;
  if (Object.keys(priceQuery).length) query.price = priceQuery;

  if (search?.trim()) {
    const term = search.trim().slice(0, 80);
    const searchRegex = new RegExp(escapeRegex(term), "i");
    const matchingUsers = await User.find({
      $or: [
        { fullName: searchRegex },
        { userName: searchRegex }
      ]
    }).select("_id").limit(50).lean();

    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { owner: { $in: matchingUsers.map((user) => user._id) } }
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1, createdAt: -1 },
    price_desc: { price: -1, createdAt: -1 }
  };

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), 24);
  const skip = (pageNumber - 1) * pageSize;

  const shouldIncludeTotal = includeTotal === "true";
  const [listingsResult, total] = await Promise.all([
    populateListing(MarketplaceListing.find(query))
      .select("title description category listingType price condition images owner availability securityDeposit maxBorrowDuration contactPhone createdAt updatedAt")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(pageSize + 1)
      .lean(),
    shouldIncludeTotal ? MarketplaceListing.countDocuments(query) : Promise.resolve(null)
  ]);

  const hasNextPage = listingsResult.length > pageSize;
  const listings = hasNextPage ? listingsResult.slice(0, pageSize) : listingsResult;

  return res.status(200).json(
    new ApiResponse(200, {
      listings,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        hasNextPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        pages: total === null ? null : Math.ceil(total / pageSize)
      }
    }, "Marketplace listings retrieved successfully")
  );
});

const getListingById = asyncHandler(async (req, res) => {
  const listing = await populateListing(MarketplaceListing.findById(req.params.id)).lean();
  if (!listing) throw new ApiError(404, "Marketplace listing not found");

  const viewerId = req.user?._id?.toString();
  const ownerId = listing.owner?._id?.toString();
  const canViewInactive = viewerId && (viewerId === ownerId || req.user?.role === "super_admin");

  if (listing.availability !== "available" && !canViewInactive) {
    throw new ApiError(404, "Marketplace listing not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { listing }, "Marketplace listing retrieved successfully")
  );
});

const getMyListings = asyncHandler(async (req, res) => {
  const pageNumber = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.limit) || DEFAULT_PAGE_SIZE, 1), 24);
  const skip = (pageNumber - 1) * pageSize;

  const listingsResult = await populateListing(
    MarketplaceListing.find({ owner: req.user._id })
      .select("title description category listingType price condition images owner availability securityDeposit maxBorrowDuration contactPhone completedAt createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize + 1)
  ).lean();

  const hasNextPage = listingsResult.length > pageSize;
  const listings = hasNextPage ? listingsResult.slice(0, pageSize) : listingsResult;

  return res.status(200).json(
    new ApiResponse(200, {
      listings,
      pagination: {
        total: null,
        page: pageNumber,
        limit: pageSize,
        hasNextPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        pages: null
      }
    }, "Your marketplace listings retrieved successfully")
  );
});

const updateListing = asyncHandler(async (req, res) => {
  const listing = await MarketplaceListing.findById(req.params.id);
  if (!listing) throw new ApiError(404, "Marketplace listing not found");
  if (listing.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this listing");
  }

  let existingImages = listing.images;
  if (req.body.existingImages) {
    try {
      const parsed = JSON.parse(req.body.existingImages);
      if (Array.isArray(parsed)) existingImages = parsed.slice(0, 6);
    } catch {
      existingImages = String(req.body.existingImages).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6);
    }
  }

  const moderationPayload = buildListingPayload(req.body, existingImages);

  const moderationResult = await validateMarketplaceListing(moderationPayload);
  if (moderationResult.isSpamOrIrrelevant) {
    throw new ApiError(400, `AI Marketplace Moderation Warning: ${moderationResult.reasoning || "This listing appears to be spam, irrelevant, unsafe, or inappropriate."}`);
  }

  const uploadedImages = await uploadListingImages(req.files || []);
  const images = [...existingImages, ...uploadedImages].slice(0, 6);
  const payload = buildListingPayload(req.body, images);

  Object.assign(listing, payload);
  await listing.save();
  await listing.populate("owner", "fullName userName avatar branch year hostel");

  return res.status(200).json(
    new ApiResponse(200, { listing }, "Marketplace listing updated successfully")
  );
});

const updateAvailability = asyncHandler(async (req, res) => {
  const listing = await MarketplaceListing.findById(req.params.id);
  if (!listing) throw new ApiError(404, "Marketplace listing not found");
  if (listing.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this listing");
  }

  const { availability } = req.body;
  if (!["available", "sold", "lent"].includes(availability)) {
    throw new ApiError(400, "Invalid listing availability");
  }
  if (listing.listingType === "sell" && availability === "lent") {
    throw new ApiError(400, "Sell listings can only be marked as sold or available");
  }
  if (listing.listingType === "borrow" && availability === "sold") {
    throw new ApiError(400, "Borrow listings can only be marked as lent or available");
  }

  listing.availability = availability;
  listing.completedAt = availability === "available" ? null : new Date();
  await listing.save();
  await listing.populate("owner", "fullName userName avatar branch year hostel");

  return res.status(200).json(
    new ApiResponse(200, { listing }, "Marketplace listing availability updated")
  );
});

const requestListing = asyncHandler(async (req, res) => {
  const listing = await MarketplaceListing.findById(req.params.id).populate("owner", "fullName userName avatar");
  if (!listing) throw new ApiError(404, "Marketplace listing not found");
  if (listing.availability !== "available") {
    throw new ApiError(400, "This listing is not available");
  }
  if (listing.owner._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot request your own listing");
  }

  const ownerObj = new mongoose.Types.ObjectId(listing.owner._id);
  const requesterObj = new mongoose.Types.ObjectId(req.user._id);

  let chat = await Chat.findOne({
    marketplaceListing: listing._id,
    participants: { $all: [ownerObj, requesterObj] }
  }).sort({ updatedAt: -1 });

  if (!chat) {
    chat = await Chat.create({
      marketplaceListing: listing._id,
      participants: [ownerObj, requesterObj]
    });
  }

  const existingStarter = await Message.exists({
    chat: chat._id,
    sender: req.user._id,
    content: { $regex: listing.listingType === "sell" ? "interested in buying" : "interested in borrowing", $options: "i" }
  });

  if (!existingStarter) {
    const starterMessage = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content: listing.listingType === "sell"
        ? `Hi, I am interested in buying "${listing.title}".`
        : `Hi, I am interested in borrowing "${listing.title}".`
    });
    await starterMessage.populate("sender", "fullName userName avatar");
    emitChatMessageCreated(chat._id, starterMessage);
  }

  chat.updatedAt = Date.now();
  await chat.save();
  await chat.populate("participants", "fullName userName avatar");
  await chat.populate("marketplaceListing", "title listingType price availability");

  await createAndEmitNotification({
    user: listing.owner._id,
    type: "marketplace_request",
    title: listing.listingType === "sell" ? "New buy request" : "New borrow request",
    message: `${req.user.fullName} is interested in "${listing.title}".`,
    data: {
      listingId: listing._id,
      chatId: chat._id,
      requesterId: req.user._id,
      listingType: listing.listingType
    }
  });

  emitChatListRefresh([listing.owner._id, req.user._id]);

  return res.status(200).json(
    new ApiResponse(200, { chat, listing }, "Marketplace request sent and chat opened")
  );
});

export {
  createListing,
  getListings,
  getListingById,
  getMyListings,
  requestListing,
  updateAvailability,
  updateListing
};
