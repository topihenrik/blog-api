const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        description: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, required: true, default: Date.now },
        edit_timestamp: { type: Date, default: undefined },
        photo: {
            is_default: { type: Boolean, default: true },
            public_id: { type: String, default: undefined },
            originalName: { type: String, default: "default.webp" },
            url: {
                type: String,
                default: () => {
                    return `https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/${process.env.NODE_ENV === "production"?"blog-api":"dev-blog-api"}/defaults/default-photo-${+Math.ceil(Math.random() * 3).toString()}.webp`;
                }
            }
        },
        published: { type: Boolean, default: false }
    }
);

module.exports = mongoose.model("Post", PostSchema);
