import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
const getVideoComments = asyncHandler(async function(req, res) {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate if the videoId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    try {
        // Find the video by its ID
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        // Aggregate pipeline to paginate comments
        const pipeline = [
            { $match: { video: new mongoose.Types.ObjectId(videoId) } }, // Match comments for the specified video
            {
                $lookup: {
                    from: "users", // Assuming the User model is stored in the "users" collection
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" }, // Deconstruct the owner array
            {
                $sort: { createdAt: -1 } // Sort comments by createdAt field in descending order
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }, { $addFields: { page: parseInt(page), limit: parseInt(limit) } }],
                    data: [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }]
                }
            }
        ];

        const result = await Comment.aggregate(pipeline);

        // Check if the result has no comments
        const { metadata, data } = result[0];
        const totalComments = metadata.length > 0 ? metadata[0].total : 0;

        // Return paginated comments (even if no comments)
        res.status(200).json({ 
            success: true, 
            total: totalComments, 
            page: metadata.length > 0 ? metadata[0].page : parseInt(page), 
            limit: metadata.length > 0 ? metadata[0].limit : parseInt(limit), 
            data 
        });
    } catch (error) {
        console.error("Error fetching video comments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


const addComment = asyncHandler(async function(req,res){
    const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user ? req.user._id : null; // Ensure req.user is defined

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // Check if content is provided
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  const video = await Video.findById(videoId);

  // Check if the video ID is valid
  if (!video) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Create a new comment document
  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: userId
  });
  // Save the comment to the database
  await newComment.save();

  // Return a success response
  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    comment: newComment
  });

})

const updateComment = asyncHandler(async function(req,res){
    const { commentId } = req.params;
    const { content } = req.body;

    // Validate if the commentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ success: false, message: "Invalid comment ID" });
    }

    try {
        // Find the comment by its ID and update its content
        const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true });
        
        // Check if the comment exists
        if (!updatedComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        // Return the updated comment
        res.status(200).json({ success: true, data: updatedComment });
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const deleteComment = asyncHandler(async function(req,res){
    const { commentId } = req.params;

    // Validate if the commentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ success: false, message: "Invalid comment ID" });
    }

    try {
        // Find the comment by its ID and delete it
        const deletedComment = await Comment.findByIdAndDelete(commentId);
        
        // Check if the comment exists
        if (!deletedComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        // Return success message
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
})

export {getVideoComments, addComment, updateComment, deleteComment }