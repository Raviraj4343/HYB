# 🚀 HYB — Help Your Buddy

![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![Build Tool](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)
![Language](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Framework](https://img.shields.io/badge/Framework-Express-000000?logo=express&logoColor=white)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)
![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![UI](https://img.shields.io/badge/UI-shadcn/ui-000000?logo=shadcnui&logoColor=white)
![Authentication](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens&logoColor=white)
![Media](https://img.shields.io/badge/Media-Cloudinary-3448C5?logo=cloudinary&logoColor=white)
![AI](https://img.shields.io/badge/AI-Groq-FF6B35?logoColor=white)
![Deployment](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Backend Hosting](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-orange)

> **HYB (Help Your Buddy)** is a campus-focused platform that enables students to quickly request and offer help for academic, personal, or logistical needs within a trusted peer network. With real-time chat, notifications, AI-powered report moderation, and role-based admin tools, it ensures safe, fast, and meaningful peer support.

---

## 🌐 Live Links

- 🔗 **Frontend:** https://hyb-theta.vercel.app/
- 🔗 **Backend:** https://hyb-nlut.onrender.com

---

## ✨ Features

### 👤 Authentication & Users
- Register / Login with JWT-based access & refresh tokens
- Forgot password via email (OTP/link)
- User profile management with avatar upload (Cloudinary)
- Role-based access: `user`, `moderator`, `admin`, `super_admin`
- Account blocking / unblocking by admins

### 🆘 Help Requests
- Create requests with **category** (medicine, notes, sports, food, transport, etc.) and **urgency** (normal, urgent, critical)
- Browse, filter, and respond to open requests
- Request lifecycle: `open → in-progress → fulfilled / cancelled / expired`
- Automated expiry cleanup via scheduled scripts
- Request deletion window (within 5 min of creation, if no chat has started)
- Cancel window (within 30 min of posting)

### 💬 Real-time Chat
- One-to-one chat auto-created on request acceptance
- Socket.IO powered messaging with read receipts
- Image sharing via Cloudinary
- Message deletion
- Global public chat room
- Automatic chat cleanup on request completion

### 🔔 Notifications
- Real-time in-app notifications for: new responses, acceptance/rejection, fulfillment, reports, warnings, account status changes
- Socket-powered live delivery

### 🚨 Report System
- Report users/messages with typed reasons: spam, harassment, inappropriate content, fraud, fake request, abuse
- **AI-powered validation** using Groq API — analyzes the last 15 chat messages as context
- Rule-based fallback validation if AI is unavailable
- Report status workflow: `pending → reviewed → resolved / dismissed`
- Auto-block user if report count exceeds threshold (configurable)
- Super-admin manual review queue for ambiguous cases

### 🛡️ Admin Panel
- View all users, block/unblock accounts
- Review and moderate reported content
- Manage request and response data
- Role-based protected routes

---

## 🛠️ Tech Stack

### 🔹 Backend (`/backend`)
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Realtime | Socket.IO |
| Auth | JWT (access + refresh tokens) |
| Media | Cloudinary |
| AI Moderation | Groq API (`llama-3.3-70b-versatile`) |
| Email | Nodemailer (SMTP) |
| Security | Helmet, express-rate-limit, CORS |
| Performance | Compression, cluster mode |
| File Uploads | Multer |

### 🔹 Frontend (`/frontend_new`)
| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui + Radix UI |
| Animations | Framer Motion |
| State / Data | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Realtime | Socket.IO Client |
| Icons | Lucide React |
| Toasts | Sonner |
| HTTP Client | Axios |

---

## 📁 Project Structure

```
HYB/
├── backend/
│   └── src/
│       ├── app.js                  # Express app setup, middlewares, routes
│       ├── index.js                # Server entry point
│       ├── cluster.js              # Cluster mode for production
│       ├── constants.js            # App-wide constants (categories, roles, limits)
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── chat.controller.js
│       │   ├── notification.controller.js
│       │   ├── report.controller.js
│       │   ├── request.controller.js
│       │   ├── response.controller.js
│       │   ├── user.controller.js
│       │   └── contact.controller.js
│       ├── models/
│       │   ├── user.models.js
│       │   ├── request.models.js
│       │   ├── response.models.js
│       │   ├── chat.models.js
│       │   ├── message.models.js
│       │   ├── notification.models.js
│       │   ├── report.models.js
│       │   └── globalMessage.models.js
│       ├── routes/
│       │   ├── auth.route.js       # /api/v1/auth
│       │   ├── request.route.js    # /api/v1/req
│       │   ├── response.route.js   # /api/v1/res
│       │   ├── chat.route.js       # /api/v1/chat
│       │   ├── notification.route.js # /api/v1/notification
│       │   ├── report.route.js     # /api/v1/report
│       │   ├── user.route.js       # /api/v1/user
│       │   └── contact.route.js    # /api/v1/contact
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   ├── admin.middleware.js
│       │   ├── blockUser.middleware.js
│       │   └── multer.middleware.js
│       ├── socket/
│       │   └── index.js            # Socket.IO event handlers
│       ├── utils/
│       │   ├── reportValidatorAI.js # Groq AI report validation
│       │   ├── realtime.js         # Helper emit functions
│       │   ├── mailer.js           # Email templates & sender
│       │   ├── cloudinary.js       # Upload / delete helpers
│       │   ├── chatCleanup.js      # Chat cleanup logic
│       │   ├── requestCleanup.js   # Request expiry logic
│       │   ├── asyncHandler.js
│       │   ├── ApiError.js
│       │   └── ApiResponse.js
│       ├── db/                     # Database connection
│       └── scripts/                # Scheduled/maintenance scripts
│
└── frontend_new/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx                # App entry point
        ├── App.jsx                 # Root component & router setup
        ├── context/
        │   ├── AuthContext.jsx     # Auth state & user session
        │   └── SocketContext.jsx   # Socket.IO connection context
        ├── hooks/
        │   ├── useChat.js          # Chat logic & socket hooks
        │   └── useNotifications.js # Notification socket hooks
        ├── routes/
        │   ├── ProtectedRoute.jsx  # Auth guard
        │   └── PublicRoute.jsx     # Redirect logged-in users
        ├── pages/
        │   ├── Landing.jsx
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   ├── Register.jsx
        │   │   └── ForgotPassword.jsx
        │   └── dashboard/
        │       ├── Dashboard.jsx
        │       ├── CreateRequest.jsx
        │       ├── RequestsList.jsx
        │       ├── RequestDetail.jsx
        │       ├── MyRequests.jsx
        │       ├── Chats.jsx
        │       ├── ChatRoom.jsx
        │       ├── GlobalChat.jsx
        │       ├── Notifications.jsx
        │       ├── UserProfile.jsx
        │       ├── UserSearch.jsx
        │       ├── Settings.jsx
        │       └── AdminPanel.jsx
        ├── components/
        │   ├── layout/             # Sidebar, navbar, shell layouts
        │   └── ui/                 # shadcn/ui components
        ├── api/                    # Axios API call modules
        ├── lib/                    # Utility functions (cn, etc.)
        └── utils/                  # Frontend helpers
```

---

## ⚙️ Environment Variables

### Backend `.env`

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string

# JWT
ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Report Validation (Groq)
HYB_REPORT_API_KEY=your_groq_api_key

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# CORS (comma-separated allowed origins)
CORS_ORIGIN=https://hyb-theta.vercel.app

# Trust Proxy (set for production behind reverse proxy)
TRUST_PROXY=loopback
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB instance (local or Atlas)
- Groq API key (optional — falls back to rule-based validation)

### 🔹 Backend

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:8000`

### 🔹 Frontend

```bash
cd frontend_new
npm install
npm run dev
```

App starts on `http://localhost:5173`

---

## 🔌 API Routes Overview

| Prefix | Description |
|---|---|
| `POST /api/v1/auth/*` | Register, login, logout, refresh token, password reset |
| `GET/POST /api/v1/req/*` | Create, list, update, cancel, delete, fulfill requests |
| `GET/POST /api/v1/res/*` | Submit, accept, reject, complete responses |
| `GET/POST /api/v1/chat/*` | List chats, get messages, send messages, delete messages |
| `GET /api/v1/notification/*` | List & mark notifications read |
| `POST /api/v1/report/*` | Submit reports, admin review & actions |
| `GET/PATCH /api/v1/user/*` | User profiles, search, admin block/unblock |
| `POST /api/v1/contact` | Contact form |

---

## 🤖 AI Report Moderation

Reports are validated automatically using the **Groq API** (`llama-3.3-70b-versatile` model):

1. The last 15 chat messages between the involved users are fetched as context.
2. The AI analyzes the report `reason` + `description` against the chat transcript.
3. Returns `{ valid: boolean, confidence: number, explanation: string }`.
4. If the AI is unavailable or the API key is missing, a **rule-based fallback** is used.
5. Reports flagged as needing manual review are queued for super-admin inspection.

---

## 🧠 Key Highlights

- 🔐 **Role-based auth** — `user`, `moderator`, `admin`, `super_admin` with middleware-enforced access
- ⚡ **Real-time everything** — chat, notifications, request status changes all via Socket.IO
- 🤖 **AI-powered moderation** — Groq LLM validates reports with conversation context
- 🛡️ **Production-ready security** — Helmet, rate limiting, CORS, trust proxy configuration
- 🗜️ **Performance** — Gzip compression, cluster mode, Cloudinary CDN for media
- 📧 **Rich email** — styled HTML emails for verification, password reset, and system alerts
- ♻️ **Automated cleanup** — scheduled scripts expire old requests and clean up orphaned chats

---

## 📄 License

ISC License

---

## 👨‍💻 Author

**Ravi Raj**  
BTech CSE @ BIT Mesra  
Backend + Full Stack Developer

---

⭐ If you find this project useful, give it a star on GitHub!
