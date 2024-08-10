import dotenv from "dotenv";
import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; 
dotenv.config();
const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String,  // cludinary url
        required: true,
    },
    coverImage:{
        type: String,  // cludinary url
    },
    watchhistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken:{
        type: String
    }

},{timestamps: true});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10); // Corrected typo in 'this.password'
        next();
    } catch (error) {
        return next(error); // Handle error
    }
});

userSchema.methods.isPasswordCorrect = async function (passwordInput) {
    try {
        const passwordComparison = await bcrypt.compare(passwordInput, this.password);
        return passwordComparison;
    } catch (error) {
       return false; 
    }
};



userSchema.methods.generateAccessToken = function() {
    const refreshToken = jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
      },
      process.env.ACCESS_TOKEN_SECRET, // Ensure correct secret key is used
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Ensure correct expiry time is used
      }
    );
    // console.log("Refresh Token:", refreshToken); // Log the refresh token

    return refreshToken;
  }
 
  
  userSchema.methods.generateRefreshToken = function() {
    const refreshToken= jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
      },
      process.env.REFRESH_TOKEN_SECRET, 
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRTY 
      }
    );
    return refreshToken;
  }
export const User = mongoose.model('User', userSchema);