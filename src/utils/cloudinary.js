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



const uploadOnCloudinary = async function(localFilePath){
    console.log('this is working ')
 try {
    if(!localFilePath) return null;

    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type: "auto"
    })
    //fila has been uploaded succesfully
    console.log("file is uploaded on cloudianry", response.url);
    return response;
    
 } catch (error) {
    console.log('error',error)
    await fs.unlink(localFilePath)
    return null;

    
 }
}

export {uploadOnCloudinary}