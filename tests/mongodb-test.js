// Provides utilities for MongoDB Memory Server. Used in testing.
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

async function connect() {
    mongoServer = await MongoMemoryServer.create();
    const mongoURL = mongoServer.getUri();
    mongoose.connect(mongoURL);

    mongoose.connection.on("error", err => {
        if (err.message.code === "ETIMEDOUT") {
            console.log(err);
            mongoose.connect(mongoURL);
        }
        console.log(err);
    });

    mongoose.connection.once("open", () => {
        console.log(`MongoDB successfully connected to ${mongoURL}`);
    });
}

async function close() {
    await mongoose.disconnect();
    await mongoServer.stop();
}

async function clear() {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        await collections[key].deleteMany();
    }
}

module.exports = {
    connect, close, clear
};
