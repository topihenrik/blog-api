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

describe("POST '/api/signup' route", () => {
    beforeEach(async () => await db.clear());

    const newUser = {
        first_name: "Anne",
        last_name: "Lähde",
        email: "anne.lahde@gmail.com",
        dob: "1987-10-21",
        password: "salis123",
        password_confirm: "salis123",
        avatar: undefined
    };

    test("success: user is able to signup", async () => {
        await request(app)
            .post("/api/signup")
            .send(newUser)
            .expect(201);

        const users = await utility.userEmailsInDb();
        expect(users).toContain(newUser.email);
    });

    test("failure: invalid text fields", async () => {
        const invalidFirstName = { ...newUser };
        invalidFirstName.first_name = "&/Ugga";
        await request(app)
            .post("/api/signup")
            .send(invalidFirstName)
            .expect(400);


        const invalidLastName = { ...newUser };
        invalidLastName.last_name = "Karju!";
        await request(app)
            .post("/api/signup")
            .send(invalidLastName)
            .expect(400);

        const invalidEmail = { ...newUser };
        invalidEmail.email = "ajkdsahjsd@mail";
        await request(app)
            .post("/api/signup")
            .send(invalidEmail)
            .expect(400);

        const invalidDob = { ...newUser };
        invalidDob.dob = "1991-15-15";
        await request(app)
            .post("/api/signup")
            .send(invalidDob)
            .expect(400);

        const invalidDob2 = { ...newUser };
        invalidDob2.dob = "12-12-1991";
        await request(app)
            .post("/api/signup")
            .send(invalidDob2)
            .expect(400);
    });

    test("failure: password and password_confirm don't match", async () => {
        const invalidPassword = { ...newUser };
        invalidPassword.password_confirm = "kaali321";
        await request(app)
            .post("/api/signup")
            .send(invalidPassword)
            .expect(400);
    });
});

describe("POST '/api/login' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUser);
    });

    test("success: login to existing account", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);
    });

    test("failure: incorrect creditentials", async () => {
        const invalidPassword = {
            email: "anni.kaakko@gmail.com",
            password: "salis123x"
        };

        await request(app)
            .post("/api/login")
            .send(invalidPassword)
            .expect(401);

        const invalidEmail = {
            email: "stefan.smith@mail.com",
            password: "salis123"
        };

        await request(app)
            .post("/api/login")
            .send(invalidEmail)
            .expect(401);
    });
});

describe("GET 'api/user' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUser);
    });

    test("success: user gets personal information", async () => {
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
            .get("/api/user")
            .set("Authorization", "Bearer " + token)
            .expect(200);
    });

    test("failure: incorrect jwt", async () => {
        await request(app)
            .get("/api/user")
            .set("Authorization", "Bearer " + "IncorrectToken")
            .expect(401);
    });
});

describe("PUT 'api/user/basic' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUser);
    });

    test("success: user is able to update information", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const infoResult = await request(app)
            .get("/api/user")
            .set("Authorization", "Bearer " + token)
            .expect(200);

        const editUser = {
            _id: infoResult.body.user._id,
            first_name: infoResult.body.user.first_name,
            last_name: infoResult.body.user.last_name,
            email: "anne.lahde@outlook.com", // Changed
            dob: "1973-06-03", // Changed
            avatar: infoResult.body.user.avatar,
        };

        await request(app)
            .put("/api/user/basic")
            .set("Authorization", "Bearer " + token)
            .send(editUser)
            .expect(201);
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

        const infoResult = await request(app)
            .get("/api/user")
            .set("Authorization", "Bearer " + token)
            .expect(200);

        const editDob = `${new Date(infoResult.body.dob).getFullYear()}-${(new Date(infoResult.body.dob).getMonth()+1).toString().padStart(2, "0")}-${(new Date(infoResult.body.dob).getDate()).toString().padStart(2, "0")}`;

        const editUser = {
            _id: infoResult.body.user._id,
            first_name: infoResult.body.user.first_name,
            last_name: infoResult.body.user.last_name,
            email: infoResult.body.user.email,
            dob: editDob,
            avatar: infoResult.body.user.avatar,
        };

        const invalidFirstName = { ...editUser };
        invalidFirstName.first_name = "&/Lkn/";
        await request(app)
            .put("/api/user/basic")
            .set("Authorization", "Bearer " + token)
            .send(invalidFirstName)
            .expect(400);

        const invalidLastName = { ...editUser };
        invalidLastName.last_name = "78Tarzan";
        await request(app)
            .put("/api/user/basic")
            .set("Authorization", "Bearer " + token)
            .send(invalidLastName)
            .expect(400);

        const invalidEmail = { ...editUser };
        invalidEmail.email = "@annukka@gmail.com";
        await request(app)
            .put("/api/user/basic")
            .set("Authorization", "Bearer " + token)
            .send(invalidEmail)
            .expect(400);

        const invalidDob = { ...editUser };
        invalidDob.dob = "1991-15-15";
        await request(app)
            .put("/api/user/basic")
            .set("Authorization", "Bearer " + token)
            .send(invalidDob)
            .expect(400);

        const invalidDob2 = { ...editUser };
        invalidDob2.dob = "12-12-1991";
        await request(app)
            .put("/api/user/basic")
            .set("Authorization", "Bearer " + token)
            .send(invalidDob2)
            .expect(400);
    });
});

describe("PUT '/user/password' route", () => {
    beforeEach(async () => await db.clear());

    beforeEach(async () => {
        await User.insertMany(utility.initUser);
    });

    test("success: user is able to update password", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const editPassword = {
            old_password: "salis123",
            password: "bush99",
            password_confirm: "bush99"
        };

        await request(app)
            .put("/api/user/password")
            .set("Authorization", "Bearer " + token)
            .send(editPassword)
            .expect(201);
    });

    test("failure: incorrect old_password", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const invalidOldPassword = {
            old_password: "kalis123",
            password: "bush99",
            password_confirm: "bush99"
        };

        await request(app)
            .put("/api/user/password")
            .set("Authorization", "Bearer " + token)
            .send(invalidOldPassword)
            .expect(401);
    });

    test("failure: password and password_confirm don't match", async () => {
        const user = {
            email: "anni.kaakko@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const invalidNewPassword = {
            old_password: "salis123",
            password: "bush99",
            password_confirm: "rush98"
        };

        await request(app)
            .put("/api/user/password")
            .set("Authorization", "Bearer " + token)
            .send(invalidNewPassword)
            .expect(400);
    });
});

describe("DELETE '/api/user' route", () => {
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

    test("success: user is able to delete own account", async () => {
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
            .delete("/api/user")
            .send(user)
            .set("Authorization", "Bearer " + token)
            .expect(200);

        const userEmailsInDb = await utility.userEmailsInDb();
        const postIdsInDb = await utility.postIdsInDb();
        const commentIdsInDb = await utility.commentIdsInDb();

        expect(userEmailsInDb).toHaveLength(1);
        expect(postIdsInDb).toHaveLength(0);
        expect(commentIdsInDb).toHaveLength(0);
    });

    test("failure: wrong creditentials", async () => {
        const user = {
            email: "jari.kuusi@gmail.com",
            password: "salis123"
        };

        const loginResult = await request(app)
            .post("/api/login")
            .send(user)
            .expect(200);

        const token = loginResult.body.token;

        const invalidPassword = { ...user };
        invalidPassword.password = "kalis123";
        await request(app)
            .delete("/api/user")
            .send(invalidPassword)
            .set("Authorization", "Bearer " + token)
            .expect(401);

        const invalidEmail = { ...user };
        invalidEmail.email = "kari.kuusi@gmail.com";
        await request(app)
            .delete("/api/user")
            .send(invalidEmail)
            .set("Authorization", "Bearer " + token)
            .expect(401);
    });
});
