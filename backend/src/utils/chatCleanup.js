import { Chat } from "../models/chat.models.js";
import { Message } from "../models/message.models.js";

export const startDirectChatCleanupJob = () => {
  const cleanup = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Find chats where last activity (updatedAt) is older than 7 days
      const chatsToDelete = await Chat.find({ updatedAt: { $lt: sevenDaysAgo } }).select("_id");
      
      if (chatsToDelete.length > 0) {
        const chatIds = chatsToDelete.map(c => c._id);
        
        // Delete messages of those chats
        await Message.deleteMany({ chat: { $in: chatIds } });
        
        // Delete the chats
        await Chat.deleteMany({ _id: { $in: chatIds } });
        
        console.log(`[Cleanup] Successfully cleared ${chatIds.length} direct chats older than 7 days.`);
      }
    } catch (error) {
      console.error("[Cleanup] Failed to clean up direct chats:", error);
    }
  };

  // Run on startup
  cleanup();

  // Run every 1 hour
  setInterval(cleanup, 60 * 60 * 1000);
};
