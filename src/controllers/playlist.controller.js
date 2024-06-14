import mongoose, {isValidObjectId} from "mongoose"
import {playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
// import { playlist } from "../models/playlist.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    try {
        // Create a new playlist instance
        const newPlaylist = await playlist.create({
            name,
            description,
            owner: req.user._id // Assuming you have user authentication and req.user contains user details
        });

        // Save the playlist to the database
        await newPlaylist.save();

        // Return success response
        res.status(201).json({ success: true, data: newPlaylist });
    } catch (error) {
        console.error("Error creating playlist:", error);
        // Handle specific error cases, e.g., validation errors
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    try {
        // Find the playlist by its ID
        const Playlist = await playlist.findById(playlistId).populate('videos owner');

        // Check if the playlist exists
        if (!Playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Return the playlist data
        res.status(200).json({ success: true, data: Playlist });
    } catch (error) {
        console.error("Error fetching playlist:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    try {
        // Check if the playlistId and videoId are valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ success: false, message: "Invalid playlist ID or video ID" });
        }

        // Find the playlist by its ID
        const Playlist = await playlist.findById(playlistId);

        // Check if the playlist exists
        if (!Playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        if (Playlist.videos.includes(videoId)) {
            return res.status(400).json({ success: false, message: "Video already exists in the playlist" });
        }

        // Find the video by its ID
        const video = await Video.findById(videoId);
        // console.log(video);
        // Check if the video exists
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        // Add the video to the playlist
        Playlist.videos.push(video);
        console.log(Playlist.videos);
        await Playlist.save();

        // Return success message
        res.status(200).json({ success: true, message: "Video added to playlist successfully" });
    } catch (error) {
        console.error("Error adding video to playlist:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    try {
        // Check if the playlistId and videoId are valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ success: false, message: "Invalid playlist ID or video ID" });
        }

        // Find the playlist by its ID
        const Playlist = await playlist.findById(playlistId);

        // Check if the playlist exists
        if (!Playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Remove the video from the playlist's videos array
        const index = Playlist.videos.indexOf(videoId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: "Video not found in the playlist" });
        }
        Playlist.videos.splice(index, 1);

        // Save the updated playlist
        await Playlist.save();

        // Return success message
        res.status(200).json({ success: true, message: "Video removed from playlist successfully" });
    } catch (error) {
        console.error("Error removing video from playlist:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    try {
        // Validate if the playlistId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json({ success: false, message: "Invalid playlist ID" });
        }

        // Find and delete the playlist by its ID
        const deletedPlaylist = await playlist.findByIdAndDelete(playlistId);

        // Check if the playlist exists
        if (!deletedPlaylist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Return success message
        res.status(200).json({ success: true, message: "Playlist deleted successfully" });
    } catch (error) {
        console.error("Error deleting playlist:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    try {
        // Validate if the playlistId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json({ success: false, message: "Invalid playlist ID" });
        }

        // Find the playlist by its ID
        let Playlist = await playlist.findById(playlistId);

        // Check if the playlist exists
        if (!Playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Update playlist details
        if (name) Playlist.name = name;
        if (description) Playlist.description = description;

        // Save the updated playlist
        await Playlist.save();

        // Return success message
        res.status(200).json({ success: true, data: Playlist });
    } catch (error) {
        console.error("Error updating playlist:", error);
        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}