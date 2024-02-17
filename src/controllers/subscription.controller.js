import mongoose, { Schema, isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ParamsUtility } from "../utils/ParamsUtility.js"
import { checkOwner } from "../utils/checkOwner.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    let { channelId } = req.params
    console.log(channelId);
    channelId = ParamsUtility(channelId);
    if (!channelId) {
        throw new ApiError(400, 'Bad Request: No Channel ID Provided')
    }
    if (channelId == req.user?._id) {
        throw new ApiError(403, 'Forbidden: Cannot Subscribe Yourself');
    }
    const isSubscribed = await Subscription.findOne({ subscriber: req.user?._id, channel: channelId })
    if (isSubscribed) {
        // If user already subscribed to the channel then remove subscription  
        await Subscription.deleteOne({ subscriber: req.user?._id, channel: channelId }).exec()
        return res.status(200).json(new ApiResponse(200, "Channel Unsubscribed"))
    }
    await Subscription.create({ subscriber: req.user?._id, channel: channelId })
    return res.status(201).json(new ApiResponse(201, {}, "Channel Subsribed"))

    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    let { channelId } = req.params
    if (!channelId) {
        throw new ApiError(400, 'Bad Request: No Channel ID Provided')
    }
    channelId = ParamsUtility(channelId);
    const isOwner = await User.find({ _id: channelId }).select("_id")
    if (!isOwner) {
        throw new ApiError(403, "Forbidden : You are not authorized to access this data")
    }

    const channels = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscriber",
                pipeline: [{
                    $project: {
                        username: 1,
                        avatar: 1
                    }
                }]
            }
        }
    ])
    if (!channels) {
        throw new ApiError(404, "Resource Not Found")
    }
    return res.status(200).json(new ApiResponse(200, channels, "Found All Subscribers of the channel"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    let { subscriberId } = req.params
    console.log(subscriberId);
    if (!subscriberId) {
        throw new ApiError(400, "Bad Request: No User ID Provided")
    }
    subscriberId = ParamsUtility(subscriberId);
    const subscribers = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "channel",
                pipeline: [{
                    $project: {
                        username: 1,
                        avatar: 1
                    }
                }]

            }
        }
    ]);
    if (!subscribers) {
        throw new ApiError(404, "Resource Not Found")
    }
    console.log(subscribers);
    return res.status(200).json(new ApiResponse(200, subscribers.map(x => x.channel), "User's Subscribed Channels List"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}