import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
// import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { uploadOnCloudinary, extractPublicId, deleteFromCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const allVideos = await Video.find({})
    if (Array.isArray(allVideos) && allVideos.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, 'No videos found'))
    }
    return res.status(200).json(new ApiResponse(200, allVideos, "Success on finding all videos"))
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // console.log(req.files);
    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    if (!title || !description || !videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Please provide all details of the Video")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    // console.log("videofile cloudnary file", videoFile)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    // console.log("thumbnail cloudnary file", thumbnail)

    if (!videoFile || !thumbnail) {
        throw new ApiError(500, "Failed to Upload Videos and Thumbnails");

    }
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id
    })
    if (!video) {
        throw new ApiError(500, "Unable To Publish Video")
    }
    return res.status(200).json(new ApiResponse(200, video, 'Video Published Successfully'))

    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    if (videoId.startsWith(':')) {
        videoId = videoId.slice(1);
    }
    console.log(videoId);
    if (!videoId.trim()) {
        throw new ApiError(400, "Invalid Video ID ")
    }
    // const video = await Video.findById(videoId)
    //     .populate('owner', ['name', 'profilePicture'])
    //     .exec();
    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    }
                }]
            }
        }
    ])
    if (!video) {
        throw new ApiError(404, 'No Video Found With This Id')
    }
    return res.status(200).json(new ApiResponse(200, video, 'Video Details Retrieved Successfully'));
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    if (videoId.startsWith(':')) {
        videoId = videoId.slice(1);
    }
    // console.log(req.files);
    const { title, description } = req.body;
    console.log(description);
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || null;

    console.log(thumbnailLocalPath);

    const videoBeforeUpdate = await Video.findById(videoId).select('thumbnail title description');
    console.log(videoBeforeUpdate);

    if (!title && !description) {
        if (!thumbnailLocalPath) {
            console.log("eror")
            throw new ApiError(400, "Invalid Data, please provide title, description or thumbnail",)
        }

        const oldThumbnailPublicId = extractPublicId(videoBeforeUpdate.thumbnail);

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail.url) {
            throw new ApiError(500, "Server Error while uploading the thumbnail to Cloudinary")
        }

        const video = await Video.findByIdAndUpdate(videoId, {
            $set: {
                thumbnail: thumbnail.url
            }
        }, { new: true });
        await deleteFromCloudinary(oldThumbnailPublicId);
        return res.status(200).json(new ApiResponse(200, video, 'Image uploaded Successfully'));

    }
    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title: title ? title : videoBeforeUpdate.title,
            description: description ? description : videoBeforeUpdate.description
        }
    }, { new: true })
    return res.status(200).json(new ApiResponse(200, video, 'Video Updated Successfully'))
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    if (videoId.startsWith(':')) {
        videoId = videoId.slice(1);
    }
    const videoFileBeforeDeleting = await Video.findById(videoId);
    if (!videoFileBeforeDeleting) {
        throw new ApiError(404, "No such video exists");
    }
    const oldVideoPublicId = extractPublicId(videoFileBeforeDeleting.videoFile);
    console.log("oldVideoPublicId", oldVideoPublicId)

    const oldThumbnailPublicId = extractPublicId(videoFileBeforeDeleting.thumbnail);
    console.log(oldThumbnailPublicId);
    let deleteVideo
    try {
        deleteVideo = await Video.findByIdAndDelete(videoId);
        await deleteVideoFromCloudinary(oldVideoPublicId);
        await deleteFromCloudinary(oldThumbnailPublicId);
    } catch (error) {
        throw new ApiError(400, error.message)
    }
    return res.status(200).json(new ApiResponse(200, deleteVideo, 'Video Deleted Successfully'))

    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    if (videoId.startsWith(':')) {
        videoId = videoId.slice(1);
    }
    const video = await Video.updateOne(
        { _id: videoId },
        [
            {
                $set: {
                    isPublished: { $not: ["$isPublished"] }
                }
            }
        ],
        { new: true }
    );

    res.status(200).json(new ApiResponse(200, video, "Publish Status Updated Successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}