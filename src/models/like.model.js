import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    videos: {
        type: Schema.Types.ObjectId,  // Array of ObjectIds referencing the Video model
        ref: 'Video',               // The model to use for this array
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    comments: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
    },
    tweets: {
        type: Schema.Types.ObjectId,
        ref: 'Tweet',
    },
}, {
    timestamps: true
})

export const Like = mongoose.model("Like", likeSchema);