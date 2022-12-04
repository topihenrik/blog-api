const mongoose = require("mongoose");
const config = require("../utils/config");

// database setup
mongoose.connect(config.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

