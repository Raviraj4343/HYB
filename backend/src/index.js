import dotenv from "dotenv"
dotenv.config({
    path: "./.env"
})
import app from "./app.js";
import http from "http";
import connectToDatabase from "./db/index.js";
import { DB_NAME } from "./constants.js";
import { initializeSocket } from "./socket/index.js";
import { getActiveMailProvider, getMailConfigurationStatus } from "./utils/mailer.js";


connectToDatabase()
.then(() => {
    const server = http.createServer(app);
    initializeSocket(server);

    const mailStatus = getMailConfigurationStatus();
    if (mailStatus.configured) {
        console.log(`Email provider ready: ${getActiveMailProvider()}`);
    } else {
        console.warn(
            `Email provider "${mailStatus.provider}" is not fully configured. Missing: ${mailStatus.missing.join(", ")}`
        );
    }

    if (mailStatus.warnings?.length) {
        mailStatus.warnings.forEach((warning) => {
            console.warn(`Email configuration warning: ${warning}`);
        });
    }

    server.listen(process.env.PORT || 8000, () => {
        console.log(`${DB_NAME} server is running on port ${process.env.PORT}`);
    });
    server.on("error", (err) => {
        console.error("MongoDB connection error:", err);
    });
})
.catch((err) => {
    console.error("Failed to connect to MongoDB !!!", err);
});
