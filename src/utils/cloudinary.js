import dotenv from 'dotenv';
import {v2 as cloudinary} from "cloudinary";
import { response } from "express";
import fs from 'fs/promises';
import { createReadStream } from 'fs';


dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY , 
    api_secret: process.env.CLOUDINARY_API_SECPRET 
    
});


/**
 * Upload a file to Cloudinary using streams.
 * @param {string} localFilePath - Path to the local file to be uploaded.
 * @returns {Promise<Object>} - Cloudinary response object.
 */


// const uploadOnCloudinary = async function (localFilePath) {
//     try {
//         if (!localFilePath) throw new Error("No file path provided");

//         // Upload file to Cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto",
//         });
//         console.log("File uploaded to Cloudinary:", response.url);
//         return response;
//     } catch (error) {
//         console.error("Cloudinary Upload Error:", error);
//         if (localFilePath) {
//             try {
//                 await fs.promises.unlink(localFilePath); // Use fs.promises for better error handling
//                 console.log("Temporary file deleted:", localFilePath);
//             } catch (unlinkError) {
//                 console.error("Failed to delete file:", unlinkError);
//             }
//         }
//         throw error; // Let the caller handle the error
//     }
// };

const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) throw new Error("No file path provided");

        // Stream file to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            const readStream = createReadStream(localFilePath);
            readStream.on('error', (error) => {
                console.error("Read stream error:", error);
                reject(error);
            });

            readStream.pipe(uploadStream);
        });

        console.log("File uploaded to Cloudinary:", uploadResponse.url);
        return uploadResponse;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        if (localFilePath) {
            try {
                await fs.unlink(localFilePath); // Delete temporary file
                console.log("Temporary file deleted:", localFilePath);
            } catch (unlinkError) {
                console.error("Failed to delete file:", unlinkError);
            }
        }

        throw error; // Let the caller handle the error
    }
};


export {uploadOnCloudinary}