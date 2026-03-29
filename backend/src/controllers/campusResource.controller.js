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
  faculty_contacts: "Professor Detail",
  hostel_updates: "Hostel Detail",
  bus_timing: "Bus Timing Notice",
  holiday_notice: "Holiday Notice",
  campus_news: "Campus News",
};

const normalizeOptionalString = (value) => (typeof value === "string" ? value.trim() : "");
const isPdfUpload = (file) => file?.mimetype === "application/pdf";
const normalizeEmail = (value) => normalizeOptionalString(value).toLowerCase();

const buildCategoryFields = (category, payload = {}) => {
  if (category === "faculty_contacts") {
    return {
      professorName: normalizeOptionalString(payload.professorName),
      designation: normalizeOptionalString(payload.designation),
      department: normalizeOptionalString(payload.department),
      email: normalizeEmail(payload.email),
      phone: normalizeOptionalString(payload.phone),
      hostelName: "",
      wardenName: "",
      wardenPhone: "",
      messMenuNote: "",
      contactName: "",
      phoneNumber: "",
      location: "",
      externalLink: "",
    };
  }

  if (category === "hostel_updates") {
    return {
      hostelName: normalizeOptionalString(payload.hostelName),
      wardenName: normalizeOptionalString(payload.wardenName),
      wardenPhone: normalizeOptionalString(payload.wardenPhone),
      messMenuNote: normalizeOptionalString(payload.messMenuNote),
      professorName: "",
      designation: "",
      department: "",
      email: "",
      phone: "",
      contactName: "",
      phoneNumber: "",
    };
  }

  return {
    professorName: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    hostelName: "",
    wardenName: "",
    wardenPhone: "",
    messMenuNote: "",
    contactName: normalizeOptionalString(payload.contactName),
    phoneNumber: normalizeOptionalString(payload.phoneNumber),
    location: normalizeOptionalString(payload.location),
    externalLink: normalizeOptionalString(payload.externalLink),
  };
};

const buildDisplayFields = (category, payload = {}) => {
  const categoryFields = buildCategoryFields(category, payload);

  if (category === "faculty_contacts") {
    const professorName = categoryFields.professorName;
    const designation = categoryFields.designation;
    const department = categoryFields.department;

    return {
      ...categoryFields,
      title:
        normalizeOptionalString(payload.title) ||
        professorName ||
        CATEGORY_DEFAULT_TITLES[category],
      description:
        normalizeOptionalString(payload.description) ||
        [designation, department].filter(Boolean).join(" • ") ||
        `${CATEGORY_DEFAULT_TITLES[category]} uploaded for students.`,
      location: normalizeOptionalString(payload.location),
      effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : null,
    };
  }

  if (category === "hostel_updates") {
    const hostelName = categoryFields.hostelName;
    const messMenuNote = categoryFields.messMenuNote;

    return {
      ...categoryFields,
      title:
        normalizeOptionalString(payload.title) ||
        hostelName ||
        CATEGORY_DEFAULT_TITLES[category],
      description:
        normalizeOptionalString(payload.description) ||
        messMenuNote ||
        `${CATEGORY_DEFAULT_TITLES[category]} uploaded for students.`,
      location: normalizeOptionalString(payload.location),
      externalLink: normalizeOptionalString(payload.externalLink),
      effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : null,
    };
  }

  return {
    ...categoryFields,
    title: normalizeOptionalString(payload.title) || CATEGORY_DEFAULT_TITLES[category],
    description:
      normalizeOptionalString(payload.description) ||
      `${CATEGORY_DEFAULT_TITLES[category]} uploaded for students.`,
    effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : null,
  };
};

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
    professorName,
    designation,
    department,
    email,
    phone,
    hostelName,
    wardenName,
    wardenPhone,
    messMenuNote,
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

  const displayFields = buildDisplayFields(category, {
    title,
    description,
    contactName,
    phoneNumber,
    location,
    externalLink,
    effectiveDate,
    professorName,
    designation,
    department,
    email,
    phone,
    hostelName,
    wardenName,
    wardenPhone,
    messMenuNote,
  });

  const resource = await CampusResource.create({
    category,
    title: displayFields.title,
    description: displayFields.description,
    contactName: displayFields.contactName,
    phoneNumber: displayFields.phoneNumber,
    location: displayFields.location,
    externalLink: displayFields.externalLink,
    effectiveDate: displayFields.effectiveDate,
    image: imageUrl,
    attachmentType,
    attachmentName,
    professorName: displayFields.professorName,
    designation: displayFields.designation,
    department: displayFields.department,
    email: displayFields.email,
    phone: displayFields.phone,
    hostelName: displayFields.hostelName,
    wardenName: displayFields.wardenName,
    wardenPhone: displayFields.wardenPhone,
    messMenuNote: displayFields.messMenuNote,
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
    professorName,
    designation,
    department,
    email,
    phone,
    hostelName,
    wardenName,
    wardenPhone,
    messMenuNote,
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

  const nextCategory = category || resource.category;
  const displayFields = buildDisplayFields(nextCategory, {
    title,
    description,
    contactName,
    phoneNumber,
    location,
    externalLink,
    effectiveDate,
    professorName,
    designation,
    department,
    email,
    phone,
    hostelName,
    wardenName,
    wardenPhone,
    messMenuNote,
  });

  resource.title = displayFields.title;
  resource.description = displayFields.description;
  resource.contactName = displayFields.contactName;
  resource.phoneNumber = displayFields.phoneNumber;
  resource.location = displayFields.location;
  resource.externalLink = displayFields.externalLink;
  resource.effectiveDate = displayFields.effectiveDate;
  resource.professorName = displayFields.professorName;
  resource.designation = displayFields.designation;
  resource.department = displayFields.department;
  resource.email = displayFields.email;
  resource.phone = displayFields.phone;
  resource.hostelName = displayFields.hostelName;
  resource.wardenName = displayFields.wardenName;
  resource.wardenPhone = displayFields.wardenPhone;
  resource.messMenuNote = displayFields.messMenuNote;
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
