const request = require("supertest");
const app = require("./app-test");
const db = require("./mongodb-test.js");

const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const utility = require("./utility");

beforeAll(async () => await db.connect());
afterAll(async () => await db.close());

test("HEAD server is running", async () => {
    await request(app)
        .head("/api/")
        .expect(200);
});

describe("POST '/api/comments' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUsers);
    });

    beforeEach(async () => {
        await Post.insertMany(utility.initPosts);
    });

    beforeEach(async () => {
        await Comment.insertMany(utility.initComments);
    });

    test("success: new comment is created", async () => {
        const user = {
            email: "anne.jarvi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const newComment = {
            content: "Wonderful!",
            postId: utility.initPosts[1]._id
        };

        await request(app)
            .post("/api/comments")
            .send(newComment)
            .set("Authorization", "Bearer " + token)
            .expect(201);

    });

    test("failure: invalid content", async () => {
        const user = {
            email: "anne.jarvi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const newComment = {
            content: "",
            postId: utility.initPosts[1]._id
        };

        await request(app)
            .post("/api/comments")
            .send(newComment)
            .set("Authorization", "Bearer " + token)
            .expect(400);

    });
});

describe("GET '/api/comments/post/:postid' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUsers);
    });

    beforeEach(async () => {
        await Post.insertMany(utility.initPosts);
    });

    beforeEach(async () => {
        await Comment.insertMany(utility.initComments);
    });

    test("success: get all comments for specific post", async () => {
        const result = await request(app)
            .get(`/api/comments/post/${utility.initPosts[1]._id}`)
            .expect(200);

        expect(result.body).toHaveLength(2);
    });

    test("success: no comments in db for specific post", async () => {
        const result = await request(app)
            .get(`/api/comments/post/${utility.initPosts[0]._id}`)
            .expect(200);

        expect(result.body).toHaveLength(0);
    });
});

describe("PUT '/api/comments/:commentid' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUsers);
    });

    beforeEach(async () => {
        await Post.insertMany(utility.initPosts);
    });

    beforeEach(async () => {
        await Comment.insertMany(utility.initComments);
    });

    test("success: comment updated", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123",
            postId: utility.initPosts[1]._id
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const editComment = {
            content: "Eccellente!!"
        };

        await request(app)
            .put(`/api/comments/${utility.initComments[0]._id}`)
            .send(editComment)
            .set("Authorization", "Bearer " + token)
            .expect(200);
    });

    test("failure: invalid content", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const editComment = {
            content: "",
            postId: utility.initPosts[1]._id
        };

        await request(app)
            .put(`/api/comments/${utility.initComments[0]._id}`)
            .send(editComment)
            .set("Authorization", "Bearer " + token)
            .expect(400);
    });

    test("failure: no authorization", async () => {
        const user = {
            email: "anne.jarvi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const editComment = {
            content: "Fantastico!!!",
            postId: utility.initPosts[1]._id
        };

        await request(app)
            .put(`/api/comments/${utility.initComments[0]._id}`)
            .send(editComment)
            .set("Authorization", "Bearer " + token)
            .expect(401);
    });
});

describe("DELETE '/api/comments/:commentid' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUsers);
    });

    beforeEach(async () => {
        await Post.insertMany(utility.initPosts);
    });

    beforeEach(async () => {
        await Comment.insertMany(utility.initComments);
    });

    test("success: comment is deleted", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const body = {
            postId: utility.initPosts[1]._id,
        };

        await request(app)
            .delete(`/api/comments/${utility.initComments[0]._id}`)
            .send(body)
            .set("Authorization", "Bearer " + token)
            .expect(200);
    });

    test("failure: no authorization", async () => {
        const user = {
            email: "anne.jarvi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const body = {
            postId: utility.initPosts[1]._id,
        };

        await request(app)
            .delete(`/api/comments/${utility.initComments[0]._id}`)
            .send(body)
            .set("Authorization", "Bearer " + token)
            .expect(401);
    });
});
