import express from "express";
import path from 'path';
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import ApiError from "./utils/ApiError.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [];

// Security and performance middlewares
app.use(helmet());
app.use(compression());

// Basic rate limiting - tune per-route as needed
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// Configure `trust proxy` carefully. A permissive `true` allows clients to spoof
// IPs (via X-Forwarded-For) and can trivially bypass IP-based rate limits.
// Default to 'loopback' for safety in local/dev environments and allow
// overriding via the TRUST_PROXY environment variable in production where you
// control the reverse proxy chain (e.g. '127.0.0.1' or 'loopback' or a CSV of IPs).
const trustProxySetting = process.env.TRUST_PROXY;
if (typeof trustProxySetting !== 'undefined' && trustProxySetting !== '') {
  app.set('trust proxy', trustProxySetting);
} else {
  app.set('trust proxy', 'loopback');
}

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Serve static assets with cache headers
app.use(express.static('public', {
  maxAge: '7d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.use(cookieParser());



// import routes
import authRoutes from "./routes/auth.route.js";
import reqRoutes from "./routes/request.route.js";
import resRouter from "./routes/response.route.js";
import chatRouter from "./routes/chat.route.js";
import notificationRouter from "./routes/notification.route.js";
import reportRouter from "./routes/report.route.js";
import userRouter from "./routes/user.route.js";
import campusResourceRouter from "./routes/campusResource.route.js";
import contactRouter from "./routes/contact.route.js";

//route decleration
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/req", reqRoutes);
app.use("/api/v1/res", resRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/report", reportRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/campus-resources", campusResourceRouter);
app.use("/api/v1/contact", contactRouter);

app.use((err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;
  const message = err?.message || "Internal server error";

  if (statusCode >= 500) {
    console.error("Unhandled application error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

// SPA fallback: serve index.html for non-API GET routes to support client-side routing
// Use `app.use` instead of a wildcard route string to avoid path-to-regexp parsing
// issues with newer versions of path-to-regexp and to prevent worker crash/restart loops.
app.use((req, res, next) => {
  // Only handle GET requests that are not API or static asset requests
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/socket.io')) return next();

  // If a file exists in the public folder that matches the path, let express.static handle it
  // Otherwise, serve the SPA entrypoint
  const indexPath = path.resolve(process.cwd(), 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) return next(err);
  });
});

export default app;
