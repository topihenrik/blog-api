const config = require("../utils/config");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        dob: { type: Date, required: true },
        password: { type: String, required: true },
        avatar: {
            is_default: { type: Boolean, default: true },
            public_id: { type: String, default: undefined },
            originalName: { type: String, default: "default.png" },
            url: {
                type: String,
                default: `${config.CLOUD_URL}/defaults/default-avatar-1.webp`
            }
        },
        creation_date: { type: Date, required: true, default: Date.now  }
    }
);

module.exports = mongoose.model("User", UserSchema);
