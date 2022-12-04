require("dotenv").config();

const PORT = process.env.PORT || "3010";

const MONGODB_URL = process.env.NODE_ENV === "production"
    ? process.env.DB_URL
    : process.env.NODE_ENV === "development"
        ? process.env.DEV_DB_URL
        : undefined; // NODE_ENV=test utilizes mongodb-memory-server


const CORS_OPTIONS = {
    origin: process.env.NODE_ENV === "production" ? "https://blog-front-pi.vercel.app" : "*"
};

const CLOUD_URL = process.env.NODE_ENV === "production"
    ? process.env.CLOUD_URL
    : process.env.NODE_ENV === "development"
        ? process.env.DEV_CLOUD_URL
        : process.env.TEST_CLOUD_URL;


const CLOUD_FOLDER = process.env.NODE_ENV === "production"
    ? process.env.CLOUD_FOLDER
    : process.env.NODE_ENV === "development"
        ? process.env.DEV_CLOUD_FOLDER
        : process.env.TEST_CLOUD_FOLDER;

module.exports = {
    PORT, MONGODB_URL, CORS_OPTIONS, CLOUD_URL, CLOUD_FOLDER
};
