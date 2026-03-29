import {Chat} from '../models/chat.models.js';
import {Message }from '../models/message.models.js';
import { GlobalMessage } from '../models/globalMessage.models.js';
import {User} from '../models/user.models.js';
import {Notification} from '../models/notification.models.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadOnCloudinary }from '../utils/cloudinary.js';
import {
  createAndEmitNotification,
  emitChatListRefresh,
  emitChatMessageCreated,
  emitChatMessageDeleted,
  emitGlobalChatMessageCreated,
  emitGlobalChatMessageDeleted,
} from '../utils/realtime.js';


const isParticipant = (chat, userId) => 
    chat.participants.some(p => (
        p._id?p._id.toString():p.toString()) === userId.toString()
    );

const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id })
    .populate('participants', 'fullName userName avatar')
    .populate('request', 'title status')
    .sort({ updatedAt: -1 })
    .lean();

  if(!chats.length){
    return res
    .status(200)
    .json(new ApiResponse(200, {chats:[]}, "No chats found"));
  }
  
  const chatIds = chats.map(chat => chat._id);
  const lastMessages = await Message.aggregate([
    { $match: { chat: { $in: chatIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$chat',
        lastMessage: { $first: '$$ROOT' }
      }
    }
  ]);

  const lastMessageMap = {};
  lastMessages.forEach(({ _id, lastMessage }) => {
    lastMessageMap[_id.toString()] = lastMessage;
  });

  const result = chats.map(chat => ({...chat,
    lastMessage: lastMessageMap[chat._id.toString()] || null
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { chats: result }, 'Chats retrieved successfully'));
});

const getChatById = asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id)
    .populate("participants", "fullName userName avatar")
    .populate("request", "title status");

    if(!chat)throw new ApiError("Chat not found", 404);
    if(!isParticipant(chat, req.user.id))
        throw new ApiError("Not authorized to access this chat", 403);

    return res
    .status(200)
    .json(new ApiResponse(200, { chat }, "Chat retrieved successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, replyTo } = req.body;
  const chatId = req.params.id;
  const trimmedContent = content?.trim();

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError('Chat not found', 404);
  if (!isParticipant(chat, req.user.id))
    throw new ApiError('Not authorized to send messages', 403);

  let replyMessage = null;
  if (replyTo) {
    replyMessage = await Message.findById(replyTo);
    if (!replyMessage || replyMessage.chat.toString() !== chatId) {
      throw new ApiError('Reply target not found', 404);
    }
  }

  let image = null;
  if (req.file) {
    const uploadedImage = await uploadOnCloudinary(req.file.path, {
      folder: 'hyb/messages',
      quality: 'auto:good',
      fetch_format: 'auto',
    });
    if (!uploadedImage?.secure_url) {
      throw new ApiError(500, 'Image upload failed');
    }
    image = uploadedImage.secure_url;
  }

  if (!trimmedContent && !image) {
    throw new ApiError(400, 'Message content or image is required');
  }

  const message = await Message.create({
    chat: chatId,
    sender: req.user.id,
    content: trimmedContent || '',
    image,
    replyTo: replyMessage?._id || null
  });

  await message.populate('sender', 'fullName userName avatar');
  if (replyMessage) {
    await message.populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'fullName userName avatar',
      },
    });
  }

  chat.updatedAt = Date.now();
  await chat.save();

 try {
    const receiverDoc = chat.participants.find(p => (p._id ? p._id.toString() : p.toString()) !== req.user.id);
    const receiverId = receiverDoc ? (receiverDoc._id ? receiverDoc._id : receiverDoc) : null;

    if (receiverId) {
      await createAndEmitNotification({
        user: receiverId,
        type: 'message',
        request: chat.request,
        title: `Message from ${req.user.fullName}`,
        message: `New message from ${req.user.fullName}`
      });
    }
 } catch (error) {
    console.log("Sendmessage error", error.message, error);
 }

  emitChatMessageCreated(chatId, message);
  emitChatListRefresh(chat.participants);

  return res
    .status(201)
    .json(new ApiResponse(201, { message }, 'Message sent successfully'));
});

const getMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const skip = (page - 1) * limit;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError('Chat not found', 404);
  if (!isParticipant(chat, req.user.id))
    throw new ApiError('Not authorized to view messages', 403);

  const [messages, total] = await Promise.all([
    Message.find({ chat: chatId })
      .populate('sender', 'fullName userName avatar')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'fullName userName avatar',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ chat: chatId })
  ]);

  try {
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { $set: { isRead: true } }
    );
  } catch (error) {
    console.log(error.message);
  }

  const sanitizedMessages = messages.map(msg => {
  if (msg.isDeleted) {
      return {
      _id: msg._id,
      chat: msg.chat,
      sender: msg.sender,
      replyTo: msg.replyTo,
      isDeleted: true,
      deletedAt: msg.deletedAt,
      createdAt: msg.createdAt
       };
    }

    return msg;
   });


  res.status(200).json(
    new ApiResponse(
      200,
      {
        messages:sanitizedMessages.reverse(),
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      },
      'Messages retrieved successfully'
    )
  );
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { id: chatId, messageId} = req.params;
    const message =await Message.findById(messageId);
    if(!message){
        throw new ApiError(404, "Message not found");
    }

    if (!req.user || message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own message");
    }

    if(message.isDeleted){
        throw new ApiError(400, "Message already deleted");
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = null;
    message.image = null;

    await message.save();
    emitChatMessageDeleted(chatId, message._id, message.deletedAt);

    const chat = await Chat.findById(chatId).select("participants");
    if (chat?.participants?.length) {
      emitChatListRefresh(chat.participants);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, { messageId }, "message deleted successfully"));
});

const getGlobalMessages = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    GlobalMessage.find({})
      .populate('sender', 'fullName userName avatar role')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'fullName userName avatar role',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    GlobalMessage.countDocuments({}),
  ]);

  const sanitizedMessages = messages.map((msg) => {
    if (msg.isDeleted) {
      return {
        _id: msg._id,
        sender: msg.sender,
        replyTo: msg.replyTo,
        isDeleted: true,
        deletedAt: msg.deletedAt,
        createdAt: msg.createdAt,
      };
    }

    return msg;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: sanitizedMessages.reverse(),
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      'Global messages retrieved successfully'
    )
  );
});

const getGlobalUnreadCount = asyncHandler(async (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : null;

  if (!since || Number.isNaN(since.getTime())) {
    return res.status(200).json(
      new ApiResponse(200, { unreadCount: 0 }, 'Global unread count retrieved successfully')
    );
  }

  const unreadCount = await GlobalMessage.countDocuments({
    sender: { $ne: req.user._id },
    isDeleted: false,
    createdAt: { $gt: since },
  });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, 'Global unread count retrieved successfully')
  );
});

const sendGlobalMessage = asyncHandler(async (req, res) => {
  const { content, replyTo } = req.body;
  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    throw new ApiError(400, 'Message content is required');
  }

  let replyMessage = null;
  if (replyTo) {
    replyMessage = await GlobalMessage.findById(replyTo)
      .populate('sender', 'fullName userName avatar role');

    if (!replyMessage) {
      throw new ApiError(404, 'Reply target not found');
    }
  }

  const message = await GlobalMessage.create({
    sender: req.user._id,
    content: trimmedContent,
    replyTo: replyMessage?._id || null,
  });

  await message.populate('sender', 'fullName userName avatar role');
  if (replyMessage) {
    await message.populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'fullName userName avatar role',
      },
    });
  }

  emitGlobalChatMessageCreated(message);

  return res.status(201).json(
    new ApiResponse(201, { message }, 'Global message sent successfully')
  );
});

const deleteGlobalMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await GlobalMessage.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own message');
  }

  if (message.isDeleted) {
    throw new ApiError(400, 'Message already deleted');
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.content = null;

  await message.save();
  emitGlobalChatMessageDeleted(message._id, message.deletedAt);

  return res.status(200).json(
    new ApiResponse(200, { messageId: message._id }, 'Global message deleted successfully')
  );
});

export {
    getMyChats,
    getChatById,
    sendMessage,
    getMessages,
    deleteMessage,
    getGlobalMessages,
    getGlobalUnreadCount,
    sendGlobalMessage,
    deleteGlobalMessage
}
