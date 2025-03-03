require("dotenv").config();
const config = require("./utils/config");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const cors = require("cors");
const jwtStrategy = require("./utils/jwt");
const middleware = require("./utils/middleware");
const healthRouter = require("./routes/health");
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");

const app = express();

// database setup
require("./utils/mongodb");

// jwt and passport setup
passport.use(jwtStrategy);

// cors setup
app.use(cors(config.CORS_OPTIONS));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routes
app.use("/api", healthRouter, usersRouter, postsRouter, commentsRouter);

// catch 404 endpoint
app.use(middleware.unknownEndpoint);

// error handler
app.use(middleware.errorHandler);

module.exports = app;
