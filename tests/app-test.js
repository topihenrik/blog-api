require("dotenv").config();
const express = require("express");

const cookieParser = require("cookie-parser");
const passport = require("passport");
const jwtStrategy = require("../utils/jwt");
const middleware = require("../utils/middleware");
const healthRouter = require("../routes/health");
const usersRouter = require("../routes/users");
const postsRouter = require("../routes/posts");
const commentsRouter = require("../routes/comments");

const app = express();

passport.use(jwtStrategy);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api", healthRouter, usersRouter, postsRouter, commentsRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
