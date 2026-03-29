import { CampusResource } from "../models/campusResource.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { CAMPUS_RESOURCE_CATEGORIES } from "../constants.js";

const resourceUploadOptions = {
  folder: "hyb/campus-resources",
  quality: "auto:good",
  fetch_format: "auto",
};

const SINGLE_IMAGE_CATEGORIES = ["bus_timing", "holiday_notice"];
const CATEGORY_DEFAULT_TITLES = {
  faculty_contacts: "Faculty Contact",
  hostel_updates: "Hostel Update",
  bus_timing: "Bus Timing Notice",
  holiday_notice: "Holiday Notice",
  campus_news: "Campus News",
};

const normalizeOptionalString = (value) => (typeof value === "string" ? value.trim() : "");
const isPdfUpload = (file) => file?.mimetype === "application/pdf";

const buildGroupedResources = (resources) =>
  CAMPUS_RESOURCE_CATEGORIES.reduce((acc, category) => {
    acc[category] = resources.filter((resource) => resource.category === category);
    return acc;
  }, {});

const getCampusResources = asyncHandler(async (req, res) => {
  const category = normalizeOptionalString(req.query.category);

  const query = {};
  if (category) {
    if (!CAMPUS_RESOURCE_CATEGORIES.includes(category)) {
      throw new ApiError(400, "Invalid campus resource category");
    }
    query.category = category;
  }

  const resources = await CampusResource.find(query)
    .populate("createdBy", "fullName userName")
    .populate("updatedBy", "fullName userName")
    .sort({ category: 1, sortOrder: 1, effectiveDate: -1, updatedAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resources,
        groupedResources: buildGroupedResources(resources),
      },
      "Campus resources fetched successfully"
    )
  );
});

const createCampusResource = asyncHandler(async (req, res) => {
  const {
    category,
    title,
    description,
    contactName,
    phoneNumber,
    location,
    externalLink,
    effectiveDate,
    sortOrder,
  } = req.body;

  if (!CAMPUS_RESOURCE_CATEGORIES.includes(category)) {
    throw new ApiError(400, "Invalid campus resource category");
  }

  if (SINGLE_IMAGE_CATEGORIES.includes(category)) {
    const existingResource = await CampusResource.findOne({ category });
    if (existingResource) {
      throw new ApiError(400, "This section supports only one uploaded notice. Please edit the existing entry instead.");
    }
  }

  let imageUrl = null;
  let attachmentType = null;
  let attachmentName = "";
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path, resourceUploadOptions);
    imageUrl = uploaded?.secure_url || null;
    attachmentType = isPdfUpload(req.file) ? "pdf" : "image";
    attachmentName = req.file.originalname || "";
  }

  const normalizedTitle = normalizeOptionalString(title) || CATEGORY_DEFAULT_TITLES[category];
  const normalizedDescription = normalizeOptionalString(description) || `${CATEGORY_DEFAULT_TITLES[category]} uploaded for students.`;

  const resource = await CampusResource.create({
    category,
    title: normalizedTitle,
    description: normalizedDescription,
    contactName: normalizeOptionalString(contactName),
    phoneNumber: normalizeOptionalString(phoneNumber),
    location: normalizeOptionalString(location),
    externalLink: normalizeOptionalString(externalLink),
    effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
    image: imageUrl,
    attachmentType,
    attachmentName,
    sortOrder: Number(sortOrder) || 0,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await resource.populate("createdBy", "fullName userName");
  await resource.populate("updatedBy", "fullName userName");

  return res.status(201).json(
    new ApiResponse(201, { resource }, "Campus resource created successfully")
  );
});

const updateCampusResource = asyncHandler(async (req, res) => {
  const resource = await CampusResource.findById(req.params.id);

  if (!resource) {
    throw new ApiError(404, "Campus resource not found");
  }

  const {
    category,
    title,
    description,
    contactName,
    phoneNumber,
    location,
    externalLink,
    effectiveDate,
    sortOrder,
    removeImage,
  } = req.body;

  if (category !== undefined) {
    if (!CAMPUS_RESOURCE_CATEGORIES.includes(category)) {
      throw new ApiError(400, "Invalid campus resource category");
    }

    if (SINGLE_IMAGE_CATEGORIES.includes(category) && category !== resource.category) {
      const existingResource = await CampusResource.findOne({
        category,
        _id: { $ne: resource._id },
      });

      if (existingResource) {
        throw new ApiError(400, "This section supports only one uploaded notice. Please edit the existing entry instead.");
      }
    }

    resource.category = category;
  }

  if (title !== undefined) resource.title = title;
  if (description !== undefined) resource.description = description;
  if (contactName !== undefined) resource.contactName = normalizeOptionalString(contactName);
  if (phoneNumber !== undefined) resource.phoneNumber = normalizeOptionalString(phoneNumber);
  if (location !== undefined) resource.location = normalizeOptionalString(location);
  if (externalLink !== undefined) resource.externalLink = normalizeOptionalString(externalLink);
  if (effectiveDate !== undefined) {
    resource.effectiveDate = effectiveDate ? new Date(effectiveDate) : null;
  }
  if (sortOrder !== undefined) {
    resource.sortOrder = Number(sortOrder) || 0;
  }

  if (removeImage === "true" && resource.image) {
    await deleteFromCloudinary(resource.image);
    resource.image = null;
    resource.attachmentType = null;
    resource.attachmentName = "";
  }

  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path, resourceUploadOptions);
    if (uploaded?.secure_url) {
      if (resource.image) {
        await deleteFromCloudinary(resource.image);
      }
      resource.image = uploaded.secure_url;
      resource.attachmentType = isPdfUpload(req.file) ? "pdf" : "image";
      resource.attachmentName = req.file.originalname || "";
    }
  }

  if (SINGLE_IMAGE_CATEGORIES.includes(resource.category)) {
    resource.title = normalizeOptionalString(resource.title) || CATEGORY_DEFAULT_TITLES[resource.category];
    resource.description = normalizeOptionalString(resource.description) || `${CATEGORY_DEFAULT_TITLES[resource.category]} uploaded for students.`;
  }

  resource.updatedBy = req.user._id;
  await resource.save();
  await resource.populate("createdBy", "fullName userName");
  await resource.populate("updatedBy", "fullName userName");

  return res.status(200).json(
    new ApiResponse(200, { resource }, "Campus resource updated successfully")
  );
});

const deleteCampusResource = asyncHandler(async (req, res) => {
  const resource = await CampusResource.findById(req.params.id);

  if (!resource) {
    throw new ApiError(404, "Campus resource not found");
  }

  if (resource.image) {
    await deleteFromCloudinary(resource.image);
  }

  await CampusResource.deleteOne({ _id: resource._id });

  return res.status(200).json(
    new ApiResponse(200, { deletedResourceId: resource._id }, "Campus resource deleted successfully")
  );
});

export {
  getCampusResources,
  createCampusResource,
  updateCampusResource,
  deleteCampusResource,
};
