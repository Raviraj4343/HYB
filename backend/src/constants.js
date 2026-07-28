export const DB_NAME = "HelpYourBuddy"

export const TEMP_UPLOAD_DIR = "public/temp";

export const DELETE_WINDOW_MINUTES = 5;

export const BLOCK_THRESHOLD = 11;

export const REQUEST_DELETE_TIME = 30;

export const EDIT_WINDOW_MINUTES = 5;

// request categories
export const REQUEST_CATEGORIES = [
    "medicine",
    "notes",
    "sports",
    "stationary",
    "electronics",
    "books",
    "food",
    "transport",
    "other"
];

export const MARKETPLACE_CATEGORIES = [
    "books",
    "electronics",
    "stationery",
    "room",
    "cycle",
    "lab",
    "sports",
    "clothing",
    "other"
];

export const MARKETPLACE_LISTING_TYPES = [
    "sell",
    "borrow"
];

export const MARKETPLACE_CONDITIONS = [
    "new",
    "like_new",
    "good",
    "fair",
    "used"
];

export const MARKETPLACE_AVAILABILITY = [
    "available",
    "sold",
    "lent"
];

export const MAX_IMAGE_IN_LISTING = 6;




export const REPORT_STATUS = [
    "pending",
    "reviewed",
    "resolved",
    "dismissed"
]

export const REQUEST_STATUS = [
    'open',
    'in-progress',
    'fulfilled',
    'expired',
    'cancelled'
];

// request status
export const RESPONSE_STATUS = [
    "pending",
    "accepted",
    "rejected",
    "completed"
];



export const NOTIFICATION_TYPES = [
    "new_response",
    "response_accepted",
    "response_rejected",
    "request_fullfilled",
    "message",
    "system",
    "report",
    "marketplace_request",
    "warning",
    "account_blocked",
    "account_unblocked",
    "report_review"     // super-admin manual review request (AI could not validate)
];

export const REPORT_REASON = [
    "spam",
    "harassment",
    "inappropriate_content",
    "fraud",
    "fake_request",
    "abuse",
    "other"
];

export const USER_ROLE = {
    USER: "user",
    ADMIN: "admin",
    MODERATOR: "moderator",
    SUPER_ADMIN: "super_admin"
};

export const CONTACT_OPTION = [
    "chat",
    "call"
];

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp"
];

export const MAX_CHAT_LENGTH = 1000;

export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
