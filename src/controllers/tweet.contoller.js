import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user; // Assuming you have user authentication middleware that populates req.user with user details
    try {
        // Validate content
        if (!content) {
            return res.status(400).json({ success: false, message: "Content is required" });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Create a new tweet instance
        const newTweet = await Tweet.create({
            content,
            owner: userId
        });

        // Save the tweet to the database
        await newTweet.save();

        // Return success response
        res.status(201).json({ success: true, data: newTweet });
    } catch (error) {
        console.error("Error creating tweet:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Retrieve tweets by user
        const tweets = await Tweet.find({ owner: userId });

        // Return tweets
        res.status(200).json({ success: true, data: tweets });
    } catch (error) {
        console.error("Error fetching user tweets:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const  userId  = req.user; // Assuming you have user authentication middleware that populates req.user with user details
   console.log(userId)
    try {
        // Validate tweetId
        if (!mongoose.Types.ObjectId.isValid(tweetId)) {
            return res.status(400).json({ success: false, message: "Invalid tweet ID" });
        }

        // Find the tweet by ID and ensure the user is the owner
        const tweet = await Tweet.findOne({ _id: tweetId, owner: userId });
        if (!tweet) {
            return res.status(404).json({ success: false, message: "Tweet not found or not authorized" });
        }

        // Update the tweet's content
        tweet.content = content;
        await tweet.save();

        // Return success response
        res.status(200).json({ success: true, data: tweet });
    } catch (error) {
        console.error("Error updating tweet:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId  = req.user; // Assuming you have user authentication middleware that populates req.user with user details

    try {
        // Validate tweetId
        if (!mongoose.Types.ObjectId.isValid(tweetId)) {
            return res.status(400).json({ success: false, message: "Invalid tweet ID" });
        }

        // Find the tweet by ID and ensure the user is the owner
        const tweet = await Tweet.findOne({ _id: tweetId, owner: userId });
        if (!tweet) {
            return res.status(404).json({ success: false, message: "Tweet not found or not authorized" });
        }

        // Delete the tweet
       const deleteTweet = await Tweet.findByIdAndDelete(tweetId);

        // Return success response
        res.status(200).json({ success: true, message: "Tweet deleted successfully" });
    } catch (error) {
        console.error("Error deleting tweet:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}