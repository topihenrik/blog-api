require("dotenv").config();
const config = require("./utils/config");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const cors = require("cors");
const jwtStrategy = require("./strategies/jwt");
const middleware = require("./utils/middleware");
const blogRouter = require("./routes/blog");
const authRouter = require("./routes/auth");

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
app.use("/api", blogRouter);
app.use("/api/auth", passport.authenticate("jwt", { session: false }), authRouter);

// catch 404 endpoint
app.use(middleware.unknownEndpoint);

// error handler
app.use(middleware.errorHandler);

module.exports = app;
