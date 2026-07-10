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

        // Drop unique index on Chat to allow multiple chats per request (multikey uniqueness conflict fix)
        try {
          const db = connectionInstance.connection.db;
          const collections = await db.listCollections({ name: 'chats' }).toArray();
          if (collections.length > 0) {
            const chatCollection = db.collection('chats');
            const indexes = await chatCollection.indexes();
            const hasUniqueIndex = indexes.some(idx => idx.name === 'request_1_participants_1' && idx.unique);
            if (hasUniqueIndex) {
              console.log("Dropping unique index request_1_participants_1 from chats collection...");
              await chatCollection.dropIndex('request_1_participants_1');
              console.log("Successfully dropped unique index request_1_participants_1");
            }
          }
        } catch (idxErr) {
          console.warn("Failed to drop unique chat index:", idxErr.message);
        }

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