import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { checkOwner } from "../utils/checkOwner.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { tweetContent } = req.body;

    const tweet = await Tweet.create({
        content: tweetContent,
        owner: req.user._id
    })
    if (!tweet) {
        throw new ApiError(500, "Unable to create a tweet")
    }
    return res.status(201).json(new ApiResponse(true, tweet, "Tweet Created Successfully!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    let { userId } = req.params
    console.log(userId);
    if (userId.startsWith(':')) {
        userId = userId.slice(1);
    }
    if (!userId) {
        throw new ApiError("Please Provide tweet and your ID", 400);
    }
    // const allTweets = await Tweet.find({ owner: userId });
    const allTweets = await Tweet.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
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
                        avatar: 1
                    }
                }]
            }
        },
    ])
    if (!allTweets.length) {
        return res.json(new ApiResponse(200, {}, "No Tweets Found"));
    }
    return res.json(new ApiResponse(200, allTweets, "Fethed all tweets succesfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    let { tweetId } = req.params;
    let { tweetContent } = req.body;
    if (tweetId.startsWith(':')) {
        tweetId = tweetId.slice(1);
    }
    const tweet = await Tweet.findById(tweetId).select("owner");
    checkOwner(tweet, req)

    if (!tweetId || !tweetContent) {
        throw new ApiError(400, "Invalid data provided");
    }
    let updatedTweet
    try {
        updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
            $set: {
                content: tweetContent
            }
        }, { new: true });

        if (!updatedTweet) {
            throw new ApiError(404, 'The Tweet With The Given Id Could Not Be Found')
        }
    } catch (error) {
        throw new ApiError(500, "An error occured while updating tweet", error)
    }
    return res.status(200).json(new ApiResponse(200, updatedTweet, 'Updated Tweet Successfully'));

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet`
    let { tweetId } = req.params;
    if (tweetId.startsWith(':')) {
        tweetId = tweetId.slice(1);
    }
    if (!tweetId) {
        throw new ApiError(404, "tweet id not found")
    }
    const tweet = await Tweet.findById(tweetId).select("owner");
    checkOwner(tweet, req)

    try {
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
        if (!deletedTweet) {
            throw new ApiError(404, "The tweet with the given Id could not be found.")

        }
    } catch (error) {
        throw new ApiError(500, "Error occured while deleting tweet")
    }
    return res.json(new ApiResponse(200, null, 'Deleted The Tweet'));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}