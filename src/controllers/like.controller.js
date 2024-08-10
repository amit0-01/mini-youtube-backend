import mongoose from "mongoose";
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";

const getLikedVideos = asyncHandler(async function(req, res) {
    const userId = req.user ? req.user._id : null; // Ensure req.user is defined
    const { videoId } = req.params; // Extract videoId from req.params

    // Ensure the user is authenticated
    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    try {
        // Find likes for the specific video by the authenticated user
        const likedVideos = await Like.find({ video: videoId, likedBy: userId }).populate('video');

        // Check if the user has liked the specific video
        if (!likedVideos || likedVideos.length === 0) {
            return res.status(200).json({ success: true, message: "No liked videos found" });
        }

        // Return the list of liked videos
        return res.status(200).json({ success: true, likedVideos });
    } catch (error) {
        console.error("Error fetching liked videos:", error);
        // Handle errors properly
        return res.status(500).json({ success: false, message: "Error fetching liked videos" });
    }
});



const toogleCommentLike = asyncHandler(async function(req, res) {
    const { commentId } = req.params;
    const userId = req.user ? req.user._id : null; // Assuming req.user contains the authenticated user's ID

    try {
        // Check if a like exists for the given comment by the current user
        const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

        // If a like exists, remove it
        if (existingLike) {
            await Like.deleteOne({ comment: commentId, likedBy: userId });
            return res.status(200).json({ success: true, message: "Comment like removed successfully" });
        } 

        // If no like exists, add a new like
        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId
        });

        await newLike.save();

        return res.status(200).json({ success: true, message: "Comment liked successfully", newLike });

    } catch (error) {
        console.error("Error toggling comment like:", error);
        res.status(500).json({ success: false, message: "Server error", error });
    }
});

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
            await Like.deleteOne({_id:existingLike._id});
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