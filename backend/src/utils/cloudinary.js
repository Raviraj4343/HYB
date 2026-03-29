import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath, options = {}) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
            ...options,
        })
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
       console.log("Cloudinary upload error:", error.message);
       if (fs.existsSync(localFilePath)) {
       fs.unlinkSync(localFilePath);
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
