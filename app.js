require("dotenv").config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require("mongoose");
const multer = require("multer");
const blogRouter = require("./routes/blog");
const authRouter = require("./routes/auth");

const app = express();


// jwt and passport setup
const passport = require("passport")
const jwtStrategy = require("./strategies/jwt")
passport.use(jwtStrategy)

// cors setup
const cors = require("cors")
const corsOptions = {
  origin: (process.env.NODE_ENV === "production"?["https://blog-front-pi.vercel.app", "https://blog-edit.vercel.app"]:"*")
}
app.use(cors(corsOptions));

// database setup
const mongoDB = (process.env.NODE_ENV === 'production'?process.env.DB_URL:process.env.DB_DEV_URL);
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use("/", blogRouter);
app.use("/auth", passport.authenticate("jwt", {session: false}), authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // handling multer error
  if (err instanceof multer.MulterError) {
    err.status = 413;
    err.message = "File too large, max size is 2MB";
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({status: err.status, message: err.message});
});

module.exports = app;
