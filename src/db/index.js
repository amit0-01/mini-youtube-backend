import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async function(){
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        

    } catch (error) {
        
        process.exit(1);
    }
}

export default connectDB;