import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/ApiError.js";

import {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  TEMP_UPLOAD_DIR
} from "../constants.js";

const ALLOWED_CAMPUS_RESOURCE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
];

if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}




const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});




const fileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        "Invalid file type. Only jpeg, jpg, png, gif, and webp are allowed."
      )
    );
  }
  cb(null, true);
};




export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

const campusResourceFileFilter = (req, file, cb) => {
  if (!ALLOWED_CAMPUS_RESOURCE_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        "Invalid file type. Only jpeg, jpg, png, webp, and pdf are allowed."
      )
    );
  }
  cb(null, true);
};

export const uploadCampusResource = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: campusResourceFileFilter
});


export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new ApiError(
          400,
          `File size too large. Maximum allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        )
      );
    }
    return next(new ApiError(400, err.message));
  }

  next(err);
};
