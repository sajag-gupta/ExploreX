const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating must not exceed 5"],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
});

module.exports = mongoose.model("Review", reviewSchema);
