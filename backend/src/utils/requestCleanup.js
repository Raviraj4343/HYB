import { Request } from "../models/request.models.js";
import { emitRequestChanged } from "./realtime.js";

export const startRequestExpiryCleanupJob = () => {
  const checkExpiry = async () => {
    try {
      const now = new Date();
      // Find all requests that are open or in-progress and have expired
      const expiredRequests = await Request.find({
        status: { $in: ["open", "in-progress"] },
        expiresAt: { $lt: now }
      });

      for (const request of expiredRequests) {
        request.status = "cancelled";
        await request.save();
        emitRequestChanged("cancelled", request.toObject());
        console.log(`[Expiry Cleanup] Request "${request.title}" (${request._id}) was automatically cancelled due to expiration.`);
      }
    } catch (error) {
      console.error("[Expiry Cleanup] Failed to check request expirations:", error);
    }
  };

  // Run on startup
  checkExpiry();

  // Run every 1 minute
  setInterval(checkExpiry, 60 * 1000);
};
