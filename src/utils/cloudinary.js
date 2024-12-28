import dotenv from 'dotenv';

import {v2 as cloudinary} from "cloudinary";
import { response } from "express";
import fs from 'fs/promises';

dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY , 
    api_secret: process.env.CLOUDINARY_API_SECPRET 
    
});



// const uploadOnCloudinary = async function(localFilePath){
//  try {
//     if(!localFilePath) return null;

//     //upload file on cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath,{
//         resource_type: "auto"
//     })
//     //fila has been uploaded succesfully
//     console.log("file is uploaded on cloudianry", response.url);
//     return response;
    
//  } catch (error) {
//     await fs.unlink(localFilePath)
//     return null;

    
//  }
// }
const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) throw new Error("No file path provided");

        // File size and path info
        const stats = await fs.stat(localFilePath);
        const fileSize = stats.size;
        const fileName = path.basename(localFilePath);

        // Create a readable stream from the file
        const fileStream = createReadStream(localFilePath);

        // Cloudinary upload stream options
        const options = {
            resource_type: "auto", // Automatically determine the file type (image, video, etc.)
            chunk_size: 5 * 1024 * 1024, // Set the chunk size to 5MB
            eager_async: true, // Enable asynchronous processing
        };

        // Upload file stream to Cloudinary
        return new Promise((resolve, reject) => {
            const cloudinaryStream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    console.error("Error uploading to Cloudinary:", error);
                    reject(error);
                } else {
                    console.log("File uploaded to Cloudinary:", result.url);
                    resolve(result);
                }
            });

            // Pipe the file stream to Cloudinary
            fileStream.pipe(cloudinaryStream);
        });

    } catch (error) {
        console.error("Error in uploadOnCloudinary:", error);
        // Cleanup file after error
        await fs.unlink(localFilePath);
        return null;
    }
};

export {uploadOnCloudinary}