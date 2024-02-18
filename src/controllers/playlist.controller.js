import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ParamsUtility } from "../utils/ParamsUtility.js"
import { checkOwner } from "../utils/checkOwner.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name || !description) {
        throw new ApiError(400, 'Please provide all fields')
    }
    const playlst = await Playlist.create({
        playlistName: name,
        description,
        owner: req.user?._id,
        videos: [],

    })
    if (!playlst) {
        throw new ApiError(500, 'Server error while creating the playlist')
    }
    const createdPlaylist = await Playlist.findById(playlst._id).select("playlistName description")
    return res.status(200).json(new ApiResponse(200, createdPlaylist, "Created New Playlist"))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    let { userId } = req.params
    userId = ParamsUtility(userId)
    if (!userId) {
        throw new ApiError(400, 'Invalid User ID')
    }
    const userPlaylist = await Playlist.find({ owner: userId }).select("playlistName owner isPublic description ").sort('-createdAt');
    console.log(userPlaylist);
    if (!userPlaylist || userPlaylist.length == 0) {
        throw new ApiError(404, 'No playlist found for this user')
    }
    const isOwner = checkOwner(userPlaylist[0], req)
    if (!isOwner) {
        const playlist = userPlaylist.filter(item => item.isPublic === true)
        return res.status(200).json(new ApiResponse(200, playlist, "Successfully fetched playlists of the user"))
    }
    return res.status(200).json(new ApiResponse(200, userPlaylist, "Successfully fetched playlists of the user"))



    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    let { playlistId } = req.params
    playlistId = ParamsUtility(playlistId)
    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist Id")
    }
    console.log(playlistId);
    const playlist = await Playlist.aggregate([
        {
            $match: {
                $and: [
                    { _id: new mongoose.Types.ObjectId(playlistId) }, // Match playlist by ID
                    { isPublic: true } // Check if the playlist is public
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: ([
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            views: 1,
                            createdAt: 1,
                        }
                    }
                ])
            }
        }

    ])
    console.log("playlist", playlist);
    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, 'Playlist not found or is not public!')
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Succesfully  fetched the playlist"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    let { playlistId, videoId } = req.params
    videoId = ParamsUtility(videoId)
    playlistId = ParamsUtility(playlistId)
    if (!playlistId || !videoId) {
        throw new ApiError(400, 'Please provide a valid playlist and video ID')
    }
    const playlist = await Playlist.findById(playlistId).select("videos owner").exec()
    if (!playlist) {
        throw new ApiError(404, 'Playlist does not exist')
    }
    console.log("playlist", playlist);
    const isOwner = checkOwner(playlist, req);
    if (!isOwner) {
        throw new ApiError(403, "You don't have permission to perform this action")
    }
    const video = await Video.findById(videoId).exec()
    if (!video) {
        throw new ApiError(404, "The specified video does not exist.")
    }
    //check if already exists
    for (let v of playlist.videos) {
        if (String(v._id) == String(videoId)) {
            throw new ApiError(409, `This video is already in the playlist`)
        }
    }

    const updatedPlaylist = await Playlist.updateOne({ _id: playlistId }, { $push: { videos: videoId } }).exec()
    if (!updatedPlaylist) {
        throw new ApiError(404, 'Playlist Not Found')
    }
    return res.status(201).json(new ApiResponse(201, "Video added to playlist successfully!"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    let { playlistId, videoId } = req.params
    videoId = ParamsUtility(videoId)
    playlistId = ParamsUtility(playlistId)
    if (!playlistId || !videoId) {
        throw new ApiError(400, 'Please provide a valid playlist and video ID')
    }
    const playlist = await Playlist.findOne({ _id: playlistId }).select("owner videos")
    if (!playlist) {
        throw new ApiError(404, "Playlist Doesn't Exist")
    }
    const isOwner = checkOwner(playlist, req)
    if (!isOwner) {
        throw new ApiError(403, "Only the owner can perform this action")
    }
    const videoInPlaylist = playlist.videos.find(v => String(v._id) === String(videoId));

    if (!videoInPlaylist) {
        throw new ApiError(400, "Video does not exists");
    }
    const updatedPlaylist = await Playlist.updateOne(
        { _id: playlistId },
        { $pull: { videos: videoId } }
    );

    console.log("updatedPlaylist", updatedPlaylist);
    const axplaylist = await Playlist.findOne({ _id: playlistId })
    console.log("axplaylist", axplaylist.videos);
    if (!updatedPlaylist) {
        throw new ApiError(500, "Server Error while removing Video from playlist.")
    }
    return res.status(200).json(new ApiResponse(200, "Removed the video from playlist"))
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    let { playlistId } = req.params
    playlistId = ParamsUtility(playlistId)
    const playlist = await Playlist.findById(playlistId).select("owner")
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found!")
    }
    const isOwner = checkOwner(playlist, req)
    if (!isOwner) {
        throw new ApiError(401, "You are not authorized to delete this playlist.")
    }
    const deletedPlaylist = await Playlist.findOneAndDelete({ _id: playlistId })
    return res.status(200).json(new ApiResponse(200, "Deleted the playlist", deletedPlaylist))

    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    let { playlistId } = req.params
    let { name, description } = req.body
    playlistId = ParamsUtility(playlistId)
    name = name?.trim()
    description = description?.trim()
    if (!playlistId || (!name && !description)) {
        throw new ApiError(400, "Invalid request please provide a valid playlist id with either name or description")
    }
    const playlistOwner = await Playlist.findById(playlistId).select("owner")
    if (!playlistOwner) {
        throw new ApiError(404, "Playlist does not exist.")
    }
    const isOwner = checkOwner(playlistOwner, req)
    if (!isOwner) {
        throw new ApiError(403, "User is not owner of the playlist.")
    }
    let updatedPlaylist;
    if (name && description) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, { playlistName: name, description }, { new: true })
    }
    else if (name) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, { playlistName: name }, { new: true })
    } else if (description) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, { description }, { new: true })
    }
    return res.status(200).json(new ApiResponse(201, updatedPlaylist, "Updated the playlist."))
    //TODO: update playlist
})
const togglePublishStatus = asyncHandler(async (req, res) => {
    let { playlistId } = req.params
    playlistId = ParamsUtility(playlistId)
    const playlist = await Playlist.updateOne(
        { _id: playlistId },
        [
            {
                $set: {
                    isPublic: { $not: ["$isPublic"] }
                }
            }
        ],
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, playlist, "isPublic status toggeled succesfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePublishStatus
}