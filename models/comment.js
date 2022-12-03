const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
    {
        content: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        post: { type: Schema.Types.ObjectId, required: true, ref: "Post" },
        timestamp: { type: Date, required: true, default: Date.now },
        edit_timestamp: { type: Date, default: undefined }
    }
);

module.exports = mongoose.model("Comment", CommentSchema);
