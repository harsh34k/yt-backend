import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js"
import { ParamsUtility } from "../utils/ParamsUtility.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    videoId = ParamsUtility(videoId)
    if (!videoId) {
        throw new ApiError(400, "No Video ID provided")
    }
    const video = await Video.findById(videoId).select("_id")
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }
    let like = await Like.findOne({ likedBy: req.user?._id, videos: videoId })
    // If the current user already liked this video, remove their like
    if (like) {
        await Like.deleteOne({ likedBy: req.user?._id, videos: videoId })
        return res.status(201).json(new ApiResponse(201, {}, "Unliked the video"))
    }
    else {
        await Like.create({ likedBy: req.user?._id, videos: videoId })
        return res.status(201).json(new ApiResponse(201, {}, "Liked the video"))
    }

    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    let { commentId } = req.params
    commentId = ParamsUtility(commentId)
    if (!commentId) {
        throw new ApiError(400, "No Comment ID provided")
    }
    const comment = await Comment.findById(commentId).select("_id")
    if (!comment) {
        throw new ApiError(404, 'Comment not found')
    }
    let like = await Like.findOne({ likedBy: req.user?._id, comments: commentId })
    // If the current user already liked this Comment, remove their like
    if (like) {
        await Like.deleteOne({ likedBy: req.user?._id, comments: commentId })
        return res.status(201).json(new ApiResponse(201, {}, 'Unliked the Comment',))
    }
    else {
        await Like.create({ likedBy: req.user?._id, comments: commentId })
        return res.status(201).json(new ApiResponse(201, {}, "Liked the Comment"))
    }
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    let { tweetId } = req.params
    tweetId = ParamsUtility(tweetId)
    if (!tweetId) {
        throw new ApiError(400, "No Comment ID provided")
    }
    const tweet = await Tweet.findById(tweetId).select("_id")
    if (!tweet) {
        throw new ApiError(404, 'tweet not found')
    }
    let like = await Like.findOne({ likedBy: req.user?._id, tweets: tweetId })
    // If the current user already liked this Comment, remove their like
    if (like) {
        await Like.deleteOne({ likedBy: req.user?._id, tweets: tweetId })
        return res.status(201).json(new ApiResponse(201, {}, 'Unliked the tweet',))
    }
    else {
        await Like.create({ likedBy: req.user?._id, tweets: tweetId })
        return res.status(201).json(new ApiResponse(201, {}, "Liked the tweet"))
    }
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // const videos = await Like.find({ likedBy: req.user?._id }).select("videos");
    // console.log(videos);
    const videos = await Like.aggregate([
        {
            $match: { likedBy: req.user?._id },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [{
                    $project: {
                        videoFile: 1,
                        thumbnail: 1,
                        title: 1,
                        duration: 1,
                        views: 1,
                        createdAt: 1,
                    }
                }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, videos?.map(x => x.videos), "Successfully fetched Liked Videos"));

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}