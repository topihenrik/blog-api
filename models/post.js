const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");


const PostSchema = new Schema(
    {
        title: {type: String, required: true},
        content: {type: String, required: true},
        author: {type: Schema.Types.ObjectId, ref: "User"},
        timestamp: {type: Date, required: true, default: Date.now},
        photo: {
            contentType: {type: String, default: "image/jpeg"},
            path: {type: String, default: () => {return "images/posts/default-"+Math.ceil(Math.random() * 3).toString()+".jpg";}}
        },
        published: {type: Boolean, default: false}
    }
)

PostSchema.virtual("timestamp_formatted").get(() => {
    return DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_SHORT);
})

module.exports = mongoose.model("Post", PostSchema);