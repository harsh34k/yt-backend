import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    videos: [{
        type: Schema.Types.ObjectId,  // Array of ObjectIds referencing the Video model
        ref: 'Video',               // The model to use for this array
        required: true,
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    description: {
        type: String,
    },
    playlistName: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

export const Playlist = mongoose.model("Playlist", playlistSchema);