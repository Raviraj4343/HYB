import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectToDatabase = async () => {
    try{
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI,{
            dbName: DB_NAME,
            // Connection pool and timeouts tuned for higher concurrency
            maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("\n Connected to MongoDB", `${connectionInstance.connection.host}`);

        // mongoose.connection.on("error", (err) => {
        //     console.error("MongoDB connection error : ", err);
        // });

        // mongoose.connection.on("disconnected", () => {
        //     console.log("MongoDb disconnected");
        // });

        // process.on("SIGINT", async () => {
        //     await mongoose.connection.close();
        //     console.log("MongoDB connection closed through app termination");
        //     process.exit(0);
        // });
    }catch(error){
        console.error("Failed to connect to MongoDB",);  
        process.exit(1);
    }
};

export default connectToDatabase;