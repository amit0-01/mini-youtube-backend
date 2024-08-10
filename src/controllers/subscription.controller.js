import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const  userId = req.user; // Assuming you have user authentication middleware that populates req.user with user details

    try {
        // Validate channelId
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({ success: false, message: "Invalid channel ID" });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Check if the channel exists
        const channel = await User.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        // Check if a subscription exists for the given channel by the current user
        const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

        if (existingSubscription) {
            // Remove the existing subscription
            await Subscription.findByIdAndDelete(existingSubscription._id);
            return res.status(200).json({ success: true, message: "Unsubscribed from channel successfully" });
        } 
        else {
            // Add a new subscription
            const newSubscription = await Subscription.create({
                subscriber: userId,
                channel: channelId
            });
            await newSubscription.save();
            return res.status(200).json({ success: true, message: "Subscribed to channel successfully", data: newSubscription });
        }
    } catch (error) {
        console.error("Error toggling subscription:", error);
        // Handle other errors
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId  = req.params.subscriberId;
    try {
        // Validate channelId
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({ success: false, message: "Invalid channel ID" });
        }

        // Find all subscriptions for the given channelId
        const subscriptions = await Subscription.find({ channel: channelId }).populate("subscriber");

        // Extract the subscribers from the subscriptions
        const subscribers = subscriptions.map(subscription => subscription.subscriber);

        // Return the list of channel subscribers
        res.status(200).json({ success: true, data: subscribers });
    } catch (error) {
        console.error("Error getting channel subscribers:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const  subscriberId  = req.params.channelId;

    try {
        // Validate subscriberId
        if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
            return res.status(400).json({ success: false, message: "Invalid subscriber ID" });
        }

        // Find all subscriptions for the given subscriberId
        const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate("channel");

        // Extract the channels from the subscriptions
        const channels = subscriptions.map(subscription => subscription.channel);

        // Return the list of subscribed channels
        res.status(200).json({ success: true, data: channels });
    } catch (error) {
        console.error("Error getting subscribed channels:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}