import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { checkOwner } from "../utils/checkOwner.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    let { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (videoId.startsWith(':')) {
        videoId = videoId.slice(1);
    }
    if (!videoId) {
        throw new ApiError(404, "Video id not provided")
    }
    let checkVideo;
    let comments;
    try {
        checkVideo = await Video.findById(videoId)?.select("comments");

        if (!checkVideo) {
            throw new ApiError(404, "Video Not Found!")
        }
        comments = await Comment.find({ video: videoId })
    } catch (error) {
        throw new ApiError(500, "Unexpected error occured while geting comments of video", error)
    }
    return res.status(200).json(new ApiResponse(200, comments, "Successfully fetched the comments"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    let { videoId } = req.params
    if (videoId.startsWith(':')) {
        videoId = videoId.slice(1);
    }
    let { content } = req.body;
    if (!videoId || !content) {
        throw new ApiError(404, "Video id or comment not provided")
    }
    let comment;
    try {
        const video = await Video.findById(videoId).exec()
        if (!video) {
            throw new ApiError(404, 'Video not found')
        }
        comment = await Comment.create({
            content,
            owner: req.user?._id,
            video: videoId
        })
        if (!comment) {
            throw new ApiError(500, "Server error while creating the comment")
        }
    } catch (error) {
        throw new ApiError(500, "Unexpected error while creating comment", error)
    }
    return res.status(200).json(new ApiResponse(200, comment, 'Comment created successfully!'));

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    let { commentId } = req.params
    let { updatedComment } = req.body
    if (commentId.startsWith(':')) {
        commentId = commentId.slice(1);
    }
    if (!commentId || !updatedComment) {
        throw new ApiError(400, "No valid comment ID and updated comment provided");
    }
    const comment = await Comment.findById(commentId).select("owner")
    checkOwner(comment, req)
    let newComment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content: updatedComment
        }
    }, { new: true })
    if (!newComment) {
        throw new ApiError(500, "Failed to update the comment in database.");
    }
    return res.status(200).json(new ApiResponse(200, newComment, "Succesfully updated comment"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    let { commentId } = req.params
    if (commentId.startsWith(':')) {
        commentId = commentId.slice(1);
    }
    if (!commentId) {
        throw new ApiError(400, "No valid comment ID and updated comment provided");
    }
    const comment = await Comment.findById(commentId).select("owner")
    if (!comment) {
        throw new ApiError(404, "The comment does not exist.")
    }
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to delete this comment');
    }
    try {
        await Comment.findByIdAndDelete(commentId);
    } catch (error) {
        throw new ApiError(500, "Server error when deleting the comment");
    }
    return res.status(200).json(new ApiResponse(200, null, "Succesfully deleted Comment"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}