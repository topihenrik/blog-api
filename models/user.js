const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        first_name: {type: String, required: true},
        last_name: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        dob: {type: Date, required: true},
        password: {type: String, required: true},
        avatar: {
            is_default: {type: Boolean, default: true},
            public_id: {type: String, default: undefined},
            originalName: {type: String, default: "default.png"},
            url: {type: String, default: `https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/${process.env.NODE_ENV === "production"?"blog-api":"dev-blog-api"}/defaults/default-avatar-1.webp`}
        },
        creation_date: {type: Date, required: true, default: Date.now}
    }
)

UserSchema.virtual("full_name").get(() => {
    let full_name = "";
    if (this.first_name && this.last_name) {
        full_name = `${this.first_name} ${this.last_name}`;
    }

    if (!this.first_name || !this.last_name) {
        full_name = "";
    }

    return full_name;
})

module.exports = mongoose.model("User", UserSchema);