import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (fileInput, options = {}) => {
    try {
        if(!fileInput) return null;

        if (Buffer.isBuffer(fileInput)) {
            const base64Payload = `data:image/png;base64,${fileInput.toString("base64")}`;
            return await cloudinary.uploader.upload(base64Payload, {
                resource_type: "auto",
                ...options,
            });
        }

        const response = await cloudinary.uploader.upload(fileInput,{
            resource_type: "auto",
            ...options,
        });

        if (typeof fileInput === "string" && fs.existsSync(fileInput)) {
            fs.unlinkSync(fileInput);
        }

        return response;
    } catch (error) {
       console.log("Cloudinary upload error:", error.message);
       if (typeof fileInput === "string" && fs.existsSync(fileInput)) {
       fs.unlinkSync(fileInput);
       }
         return null;
    }
};

const deleteFromCloudinary = async(imageUrl) => {
    try{
        if(!imageUrl) return;

        const publicId = imageUrl
        .split("/")
        .slice(imageUrl.split("/").indexOf("upload") + 2)
        .join("/")
        .split(".")[0];

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary delete:", result);
    }catch(error){
        console.log("Cloudinary upload error:",error.message);
    }
};

export {uploadOnCloudinary, deleteFromCloudinary};
