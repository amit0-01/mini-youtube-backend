import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: 'i' };
    }
    if (userId) {
        filter.owner = userId;
    }

    const sort = {};
    sort[sortBy] = sortType === 'desc' ? -1 : 1;

    const aggregate = Video.aggregate([
        { $match: filter },
        { $sort: sort }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    res.status(200).json({
        success: true,
        count: videos.docs.length,
        page: videos.page,
        totalPages: videos.totalPages,
        data: videos.docs,
    });
});

const getVideoById = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id).populate('owner');
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.status(200).json({ success: true, data: video });
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration, owner } = req.body;
    const videoFile = req.files?.videoFile?.[0];
    const thumbnail = req.files?.thumbnail?.[0];

    if (!videoFile) {
        return res.status(400).json({ success: false, message: 'Video file is required' });
    }

    let uploadVideo;
    try {
        uploadVideo = await uploadOnCloudinary(videoFile.path);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to upload video to Cloudinary', error });
    }

    const video = await Video.create({
        videoFile: uploadVideo.url, // assuming `uploadOnCloudinary` returns an object with a `url` property
        thumbnail: thumbnail ? thumbnail.path : '', // handle thumbnail similarly if needed
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
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.status(200).json({ success: true, data: {} });
});

export { getAllVideos, getVideoById,  publishAVideo, updateVideo, deleteVideo };
