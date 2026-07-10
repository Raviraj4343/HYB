import { Server } from "socket.io";
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { Chat } from "../models/chat.models.js";
import { Message } from "../models/message.models.js";

let ioInstance = null;

const getAllowedOrigins = () =>
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

const extractToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const headerToken = socket.handshake.headers?.authorization;
  if (headerToken?.startsWith("Bearer ")) {
    return headerToken.replace("Bearer ", "").trim();
  }

  return null;
};

export const initializeSocket = async (server) => {
  const allowedOrigins = getAllowedOrigins();

  ioInstance = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true,
    },
  });

  // If REDIS_URL is provided, configure the Redis adapter for horizontal scaling
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      ioInstance.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.io Redis adapter configured');
    } catch (err) {
      console.warn('Failed to configure Redis adapter for socket.io:', err.message || err);
    }
  }

  ioInstance.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select("-password -refreshToken");

      if (!user || !user.isActive) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    socket.join(`user:${userId}`);
    socket.join("requests:feed");
    socket.join("chat:global");

    if (socket.user.role === "admin" || socket.user.role === "moderator") {
      socket.join("role:admin");
    }

    // 1. Mark pending messages to this user as delivered
    const markPendingAsDelivered = async () => {
      const myChats = await Chat.find({ participants: userId }).select("_id");
      const chatIds = myChats.map((c) => c._id);
      
      if (chatIds.length > 0) {
        await Message.updateMany(
          { chat: { $in: chatIds }, sender: { $ne: userId }, isDelivered: false },
          { $set: { isDelivered: true } }
        );
        chatIds.forEach((cId) => {
          ioInstance.to(`chat:${cId.toString()}`).emit("chat:messages:delivered", { chatId: cId.toString() });
        });
      }
    };
    markPendingAsDelivered().catch((err) => console.error("Delivered batch error:", err));

    socket.on("chat:join", async (chatId) => {
      if (chatId) {
        socket.join(`chat:${chatId}`);

        // 2. Mark messages in this room sent by other participant as read
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, isRead: false },
          { $set: { isRead: true, isDelivered: true } }
        );
        ioInstance.to(`chat:${chatId}`).emit("chat:messages:read", { chatId });
      }
    });

    socket.on("chat:leave", (chatId) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId.toString()}`).emit(event, payload);
};

export const emitToUsers = (userIds, event, payload) => {
  if (!Array.isArray(userIds)) return;
  [...new Set(userIds.filter(Boolean).map((id) => id.toString()))].forEach((userId) => {
    emitToUser(userId, event, payload);
  });
};

export const emitToChat = (chatId, event, payload) => {
  if (!ioInstance || !chatId) return;
  ioInstance.to(`chat:${chatId.toString()}`).emit(event, payload);
};

export const emitToGlobalChat = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.to("chat:global").emit(event, payload);
};

export const emitRequestEvent = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.to("requests:feed").emit(event, payload);
};

export const emitToAdmins = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.to("role:admin").emit(event, payload);
};
