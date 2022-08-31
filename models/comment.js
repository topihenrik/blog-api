const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const CommentSchema = new Schema(
    {
        content: {type: String, required: true},
        author: {type: Schema.Types.ObjectId, required: true, ref: "User"},
        post: {type: Schema.Types.ObjectId, required: true, ref: "Post"},
        timestamp: {type: Date, required: true, default: Date.now}
    }
)

CommentSchema.virtual("timestamp_formatted").get(() => {
    return DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_SHORT);
})

module.exports = mongoose.model("Comment", CommentSchema);