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

describe("POST '/api/auth/posts' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUser);
    });

    const newPost = {
        title: "Hello World!",
        content: "<h1>Hello World!</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ipsum dui, placerat ut tellus ac, tincidunt fermentum est. Vivamus sed libero vel mauris vestibulum consectetur sit amet ac justo. Ut sed porta velit. Sed porttitor lacus sodales hendrerit cursus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper pulvinar justo id pretium. Proin at semper.</p>",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ipsum dui, placerat ut tellus ac, tincidunt fermentum est. Vivamus sed libero vel mauris vestibulum consectetur sit amet ac justo. Ut sed porta velit. Sed porttitor lacus sodales hendrerit cursus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper pulvinar justo id pretium. Proin at semper.",
        photo: undefined,
        published: true
    };

    test("success: new post is created", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        await request(app)
            .post("/api/auth/posts")
            .send(newPost)
            .set("Authorization", "Bearer " + token)
            .expect(201);

        const postIdsInDb = await utility.postIdsInDb();
        expect(postIdsInDb).toHaveLength(1);
    });

    test("failure: invalid text fields", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const invalidTitle = { ...newPost };
        invalidTitle.title = "Woah";
        await request(app)
            .post("/api/auth/posts")
            .send(invalidTitle)
            .set("Authorization", "Bearer " + token)
            .expect(400);

        const invalidContent = { ...newPost };
        invalidContent.content = "<h1></h1><p></p>";
        await request(app)
            .post("/api/auth/posts")
            .send(invalidContent)
            .set("Authorization", "Bearer " + token)
            .expect(400);

        const invalidDescription = { ...newPost };
        invalidDescription.description = "Jou!";
        await request(app)
            .post("/api/auth/posts")
            .send(invalidDescription)
            .set("Authorization", "Bearer " + token)
            .expect(400);

        const invalidPublished = { ...newPost };
        invalidPublished.published = "yes";
        await request(app)
            .post("/api/auth/posts")
            .send(invalidPublished)
            .set("Authorization", "Bearer " + token)
            .expect(400);
    });
});


describe("GET '/api/posts' route", () => {
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

    test("success: get all posts", async () => {
        const result = await request(app)
            .get("/api/posts")
            .expect(200);

        expect(result.body).toHaveLength(2);
    });

    test("success: no posts in db", async () => {
        await db.clear();
        const result = await request(app)
            .get("/api/posts")
            .expect(200);

        expect(result.body).toHaveLength(0);
    });
});

describe("GET '/api/posts/:postid' route", () => {
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

    test("success: get a post", async () => {
        await request(app)
            .get(`/api/posts/${utility.initPosts[0]._id}`)
            .expect(200);
    });

    test("failure: invalid postid", async () => {
        await request(app)
            .get("/api/posts/638e710e9e02cc9f183be004")
            .expect(404);
    });
});

describe("GET '/api/auth/posts/author' route", () => {
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

    test("success: get posts from specific author", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        await request(app)
            .get("/api/auth/posts/author")
            .set("Authorization", "Bearer " + token)
            .expect(200);
    });

    test("failure: invalid jwt", async () => {
        await request(app)
            .get("/api/auth/posts/author")
            .set("Authorization", "Bearer " + "Kabum77!")
            .expect([404, 401]);
    });
});


describe("PUT '/api/auth/posts' route", () => {
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

    const editPost = {
        postID: utility.initPosts[0]._id,
        title: "Hello World!!!",
        content: "<h1>Hello World!!!</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ipsum dui, placerat ut tellus ac, tincidunt fermentum est. Vivamus sed libero vel mauris vestibulum consectetur sit amet ac justo. Ut sed porta velit. Sed porttitor lacus sodales hendrerit cursus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper pulvinar justo id pretium. Proin at semper.</p>",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ipsum dui, placerat ut tellus ac, tincidunt fermentum est. Vivamus sed libero vel mauris vestibulum consectetur sit amet ac justo. Ut sed porta velit. Sed porttitor lacus sodales hendrerit cursus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper pulvinar justo id pretium. Proin at semper.",
        photo: undefined,
        published: true
    };

    test("success: post updated", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        await request(app)
            .put("/api/auth/posts")
            .set("Authorization", "Bearer " + token)
            .send(editPost)
            .expect(201);
    });

    test("failure: invalid text fields", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const invalidTitle = { ...editPost };
        invalidTitle.title = "Woah";
        await request(app)
            .put("/api/auth/posts")
            .send(invalidTitle)
            .set("Authorization", "Bearer " + token)
            .expect(400);

        const invalidContent = { ...editPost };
        invalidContent.content = "<h1></h1><p></p>";
        await request(app)
            .put("/api/auth/posts")
            .send(invalidContent)
            .set("Authorization", "Bearer " + token)
            .expect(400);

        const invalidDescription = { ...editPost };
        invalidDescription.description = "Jou!";
        await request(app)
            .put("/api/auth/posts")
            .send(invalidDescription)
            .set("Authorization", "Bearer " + token)
            .expect(400);

        const invalidPublished = { ...editPost };
        invalidPublished.published = "yes";
        await request(app)
            .put("/api/auth/posts")
            .send(invalidPublished)
            .set("Authorization", "Bearer " + token)
            .expect(400);
    });

    test("failure: published post can't be unpublished", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const invalidPublished = { ...editPost };
        invalidPublished.published = false;

        await request(app)
            .put("/api/auth/posts")
            .send(invalidPublished)
            .set("Authorization", "Bearer " + token)
            .expect(400);
    });
});

describe("DELETE '/api/auth/posts/:postid' route", () => {
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

    test("success: post is deleted", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        await request(app)
            .delete(`/api/auth/posts/${utility.initPosts[0]._id}`)
            .send({ confirmation: utility.initPosts[0].title })
            .set("Authorization", "Bearer " + token)
            .expect(200);
    });

    test("failure: incorrect title", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        await request(app)
            .delete(`/api/auth/posts/${utility.initPosts[0]._id}`)
            .send({ confirmation: "Happy Bear, Big Adventure!" })
            .set("Authorization", "Bearer " + token)
            .expect(400);
    });
});
