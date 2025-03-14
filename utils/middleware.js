const multer = require("multer");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");

// extract valid jwt to req.token without errors if not valid
const tokenExtract = (req, res, next) => {
    try {
        if (jwt.verify(req.headers.authorization?.split(" ")?.[1], process.env.AUTH_SECRET)) {
            req.token = jwt.decode(req.headers.authorization.split(" ")[1]);
        }
    } catch {
        next();
        return;
    }

    next();
};

// error handler
const errorHandler = (err, req, res, _next) => {
    // handling multer error
    if (err instanceof multer.MulterError) {
        err.status = 413;
        err.message = "File too large, max size is 2MB";
    }

    // only console.log 500 http errors if in development mode
    if ((process.env.NODE_ENV === "development" || "test") && !err.status) console.error(err);

    // return the error response
    res.status(err.status || 500).json({ status: err.status, message: err.message });
};

// catch 404 and forward to error handler
const unknownEndpoint = (req, res, next) => {
    next(createError(404));
};

module.exports = {
    errorHandler, unknownEndpoint, tokenExtract
};
