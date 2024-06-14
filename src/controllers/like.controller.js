import mongoose from "mongoose";
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";

const getLikedVideos = asyncHandler(async function(req,res){
    const { videoId } = req.params;
    const userId = req.user ? req.user._id : null; // Ensure req.user is defined
    console.log("videoId:", videoId);
    console.log("userId:", userId);
    const video = await Video.findById(videoId);
   
    // Check if the video ID is valid
    if (!video) {
        throw new ApiError(400, "Invalid video ID");
    }

    try {
        // Check if a like document exists for the user and the video
        const existingLike = await Like.findOne({ user: userId, video: videoId });

        if (existingLike) {
            // If a like document exists, delete it (unlike the video)
            await existingLike.remove();
            return res.status(200).json({ success: true, message: "Video unliked" });
        } else {
            // If not, create a new like document (like the video)
            const newLike = new Like({ user: userId, video: videoId });
            await newLike.save();
            return res.status(200).json({ success: true, message: "Video liked" });
        }
    } catch (error) {
        throw new ApiError(500, "Error toggling video like", error);
    }})

const toogleCommentLike = asyncHandler(async function(req,res){
    const { commentId } = req.params;
    const { userId } = req.user; // Assuming you have user authentication middleware that populates req.user with user details

    try {
        // Check if a like exists for the given comment by the current user
        const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

        // If a like exists, remove it; if not, add a new like
        if (existingLike) {
            // Remove the existing like
            // await Like.deleteOne({ comment: commentId, likedBy: userId });
            // res.status(200).json({ success: true, message: "Comment like removed successfully" });
            // Add a new like
            const newLike = await Like.create(
                {
                likedBy: userId,
                }
                );

                try {
                    await newLike.save();
                } catch (error) {
                    console.log(error)
                    return res.status(500).json({ success: false, message: 'something error', error });
                }


            res.status(200).json({ success: true, message: "Comment liked successfully", newLike });
        }
    } catch (error) {
        console.error("Error toggling comment like:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const toogleTweetLike = asyncHandler(async function(req,res){
    const { tweetId } = req.params;
    const  userId  = req.user; // Assuming you have user authentication middleware that populates req.user with user details

    try {
        // Validate tweetId
        if (!mongoose.Types.ObjectId.isValid(tweetId)) {
            return res.status(400).json({ success: false, message: "Invalid tweet ID" });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Check if the tweet exists
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            return res.status(404).json({ success: false, message: "Tweet not found" });
        }

        // Check if a like exists for the given tweet by the current user
        const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

        if (existingLike) {
            // Remove the existing like
            await Tweet.findByIdAndDelete(tweetId);
            return res.status(200).json({ success: true, message: "Tweet unliked successfully" });
        } else {
            // Add a new like
            const newLike = await Like.create({
                tweet: tweetId,
                likedBy: userId
            });
            await newLike.save();
            return res.status(200).json({ success: true, message: "Tweet liked successfully", data: newLike });
        }
    } catch (error) {
        console.error("Error toggling tweet like:", error);
        // Handle other errors
        return res.status(500).json({ success: false, message: "Server error" });
    }
})

const toogleVideoLike = asyncHandler(async function(req,res){
    const { videoId } = req.params;
    const  userId  = req.user; // Assuming you have user authentication middleware that populates req.user with user details

    try {
        // Validate videoId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ success: false, message: "Invalid video ID" });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Check if the video exists
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        // Check if a like exists for the given video by the current user
        const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

        if (existingLike) {
            // Remove the existing like
            await existingLike.remove();
            return res.status(200).json({ success: true, message: "Video unliked successfully" });
        } else {
            // Add a new like
            const newLike = new Like({
                video: videoId,
                likedBy: userId
            });
            await newLike.save();
            return res.status(200).json({ success: true, message: "Video liked successfully", data: newLike });
        }
    } catch (error) {
        console.error("Error toggling video like:", error);
        // Handle other errors
        return res.status(500).json({ success: false, message: "Server error" });
    }
})

export {
    getLikedVideos,
    toogleCommentLike,
    toogleTweetLike,
    toogleVideoLike
}