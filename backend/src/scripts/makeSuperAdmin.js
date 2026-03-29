import dotenv from "dotenv";
import mongoose from "mongoose";
import connectToDatabase from "../db/index.js";
import { User } from "../models/user.models.js";
import { USER_ROLE } from "../constants.js";

dotenv.config({ path: "./.env" });

const identifier = process.argv[2]?.trim()?.toLowerCase();

const printUsageAndExit = (message = "") => {
  if (message) {
    console.error(message);
  }

  console.log('Usage: npm run make-superadmin -- <email-or-username>');
  process.exit(1);
};

if (!identifier) {
  printUsageAndExit("Please provide an email or username.");
}

const promoteUserToSuperAdmin = async () => {
  try {
    await connectToDatabase();

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { userName: identifier },
      ],
    });

    if (!user) {
      printUsageAndExit(`No user found for "${identifier}".`);
    }

    if (user.role === USER_ROLE.SUPER_ADMIN) {
      console.log(`User "${user.email}" is already a super_admin.`);
      process.exit(0);
    }

    user.role = USER_ROLE.SUPER_ADMIN;
    await user.save({ validateBeforeSave: false });

    console.log(`User "${user.email}" has been promoted to super_admin successfully.`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to promote user to super_admin:", error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

promoteUserToSuperAdmin();
