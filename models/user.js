const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        first_name: {type: String, required: true},
        last_name: {type: String, required: true},
        email: {type: String, required: true},
        password: {type: String, required: true},
        avatar: {
            contentType: {type: String, default: "image/png"},
            path: {type: String, default: "images/users/default.png"}
        }
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