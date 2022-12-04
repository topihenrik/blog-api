const multer = require("multer");
const createError = require("http-errors");

// error handler
const errorHandler = (err, req, res, _next) => {
    // handling multer error
    if (err instanceof multer.MulterError) {
        err.status = 413;
        err.message = "File too large, max size is 2MB";
    }
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // return the error response
    res.status(err.status || 500);
    res.json({ status: err.status, message: err.message });
};

// catch 404 and forward to error handler
const unknownEndpoint = (req, res, next) => {
    next(createError(404));
};

module.exports = {
    errorHandler, unknownEndpoint
};
