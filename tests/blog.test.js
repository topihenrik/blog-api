require("dotenv").config();
const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const jwtStrategy = require("../strategies/jwt");
const middleware = require("../utils/middleware");
const blogRouter = require("../routes/blog");
const authRouter = require("../routes/auth");

const app = express();
const db = require("./mongodb-test");

passport.use(jwtStrategy);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api", blogRouter);
app.use("/api/auth", passport.authenticate("jwt", { session: false }), authRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

describe("Basic tests", () => {
    beforeAll(async () => await db.connect());
    beforeEach(async () => await db.clear());
    afterAll(async () => await db.close());

    test("Uptime route works", async () => {
        await request(app)
            .head("/api/")
            .expect(200);
    });
});
