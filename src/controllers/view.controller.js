import { asyncHandler } from "../utils/asyncHandler.js";
import { View } from "../models/view.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const incrementView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id.toString();

    // Validate videoId length before converting to ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid video ID format'
        });
    }

    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    // Check if the user has already viewed this video
    const existingView = await View.findOne({ video: videoObjectId, user: userId });

    if (existingView) {
        return res.status(200).json({
            success: true,
            message: 'View already recorded'
        });
    }

    // Increment the view count
    await Video.findByIdAndUpdate(videoObjectId, { $inc: { views: 1 } });

    // Record the new view
    const newView = new View({
        video: videoObjectId,
        user: userId
    });
    await newView.save();

    res.status(200).json({
        success: true,
        view : newView
    });
});

export { incrementView };
