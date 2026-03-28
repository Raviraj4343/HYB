import dotenv from "dotenv"
dotenv.config({
    path: "./.env"
})
import app from "./app.js";
import http from "http";
import connectToDatabase from "./db/index.js";
import { DB_NAME } from "./constants.js";
import { initializeSocket } from "./socket/index.js";


connectToDatabase()
.then(() => {
    const server = http.createServer(app);
    initializeSocket(server);

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
