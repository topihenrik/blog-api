var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require("mongoose");
var cors = require("cors")
var multer = require("multer");
require("dotenv").config();
var blogRouter = require("./routes/blog");
var authRouter = require("./routes/auth");

var app = express();


// jwt and passport setup
var jwt = require("jsonwebtoken")
var passport = require("passport")
var jwtStrategy = require("./strategies/jwt")
passport.use(jwtStrategy)


app.use(cors());

// database setup
const mongoDB = process.env.DB_URL;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* app.use((req, res, next) => {
  console.log(req.body);
  next();
}) */

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
