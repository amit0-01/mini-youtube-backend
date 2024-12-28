import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import mongoose from 'mongoose'
import fs from 'fs';

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, query = '', sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filter = {};
    if (query) {
        filter.title = { $regex: query.replace(/ /g, '\\s+'), $options: 'i' };
    }
    if (userId) {
        filter.owner = new mongoose.Types.ObjectId(userId);
    }

    const sort = {};
    sort[sortBy] = sortType === 'desc' ? -1 : 1;

    const aggregate = Video.aggregate([
        { $match: filter },
        { $sort: sort },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerInfo'
            }
        },
        { $unwind: '$ownerInfo' },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                'ownerInfo._id': 1,
                'ownerInfo.username': 1 
            }
        }
    ]);

    // const options = {
    //     page: parseInt(page, 10),
    //     limit: parseInt(limit, 10),
    // };

    // const videos = await Video.aggregatePaginate(aggregate, options);
    const videos = await aggregate.exec(); 
    // const videos = await Video.find(filter).sort(sort).exec();

    res.status(200).json({
        // success: true,
        // count: videos.docs.length,
        // page: videos.page,
        // totalPages: videos.totalPages,
        // data: videos.docs,
        success: true,
        count: videos.length,
        data: videos,
    });
});


const getVideoById = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;

    // Validate the video ID
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }


    const video = await Video.findById(videoId).populate('owner');
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }


    res.status(200).json({ success: true, data: video });
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration, owner } = req.body;
    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
        return res.status(400).json({ success: false, message: 'Video file is required' });
    }

    let uploadVideo;
    console.log('this is working')
    try {
        // Upload video to Cloudinary
        uploadVideo = await uploadOnCloudinary(videoFile.path);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to upload video to Cloudinary', error });
    }

    let uploadThumbnail;
    if (thumbnailFile) {
        try {
            // Upload thumbnail to Cloudinary
            uploadThumbnail = await uploadOnCloudinary(thumbnailFile.path);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to upload thumbnail to Cloudinary', error });
        }
    }

    const video = await Video.create({
        videoFile: uploadVideo.url, 
        thumbnail: uploadThumbnail ? uploadThumbnail.url : '', 
        title,
        description,
        duration,
        owner
    });

    try {
        await video.save();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to save video in database', error });
    }

    fs.unlink(videoFile.path, (err)=>{
        if(err){
            console.log('Error deleting video File', err);            
        }
    });

    if(thumbnailFile){
        fs.unlink(thumbnailFile.path,(err)=>{
            if(err){
                console.error('Error deleting thumbnail file: ', err);
            }
        })
    }

    res.status(201).json({ success: true, data: video });
});



const updateVideo = asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.status(200).json({ success: true, data: video });
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    try {
        const deletedVideo = await Video.findByIdAndDelete(videoId);

        if (!deletedVideo) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        const userVideos = await Video.find({ owner: userId });

        if (userVideos.length === 0) {
            return res.status(404).json({ success: false, message: 'No videos found for this user' });
        }

        res.status(200).json({ success: true, data: userVideos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});


// get users videos

const getUsersVideos = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    try {
        const userVideos = await Video.find({ owner: userId }).populate('owner');

        if (!userVideos || userVideos.length === 0) {
            return res.status(404).json({ success: false, message: 'No videos found for this user' });
        }

        const formattedVideos = userVideos.map(video => {
            const { owner, ...videoData } = video.toObject(); 
            return {
                ...videoData,
                ownerInfo: owner 
            };
        });

        res.status(200).json({ success: true, data: formattedVideos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

export { getAllVideos, getVideoById,  publishAVideo, updateVideo, deleteVideo, getUsersVideos };
