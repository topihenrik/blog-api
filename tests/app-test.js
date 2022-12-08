require("dotenv").config();
const express = require("express");

const cookieParser = require("cookie-parser");
const passport = require("passport");
const jwtStrategy = require("../utils/jwt");
const middleware = require("../utils/middleware");
const noAuthRouter = require("../routes/no-auth");
const authRouter = require("../routes/auth");

const app = express();

passport.use(jwtStrategy);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api", noAuthRouter);
app.use("/api/auth", passport.authenticate("jwt", { session: false }), middleware.tokenExtract, authRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
