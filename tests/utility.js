const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/post");

const initUser = {
    _id: "638d0222f877f4055be28ea3",
    first_name: "Anni",
    last_name: "Kääkkö",
    email: "anni.kaakko@gmail.com",
    dob: "1953-06-03T00:00:00.000+00:00",
    password: "$2a$10$5C8PWDwE8zaf/d2i.IfYYeodpmD6kRJP.3nd95etZAZqJaovTIgQK", // salis123
    avatar: {
        is_default: true,
        originalName: "default.png",
        url: "https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/test-blog-api/defaults/default-avatar-1.webp"
    },
    creation_date: "2022-11-20T12:43:55.467+00:00"
};

const initUsers = [
    {
        _id: "638e710e9e02cc9f183be004",
        first_name: "Jari",
        last_name: "Kuusi",
        email: "jari.kuusi@gmail.com",
        dob: "1980-10-08T00:00:00.000+00:00",
        password: "$2a$10$vt.ss4HvVJAFdPC2nuAwV.OcNKqQFsN1qKBsmytHfBJKx5iVjtwcW", // salis123
        avatar: {
            is_default: true,
            originalName: "default.png",
            url: "https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/test-blog-api/defaults/default-avatar-1.webp"
        },
        creation_date: "2022-12-05T22:30:38.657+00:00"
    },
    {
        _id: "638e71e89e02cc9f183be031",
        first_name: "Anne",
        last_name: "Järvi",
        email: "anne.jarvi@gmail.com",
        dob: "1986-09-10T00:00:00.000+00:00",
        password: "$2a$10$8ZD.SkH/1Sh.XecR8F5K9eUhl/aLHZRj62CLF1tChVx/d.A4a6tMy", // salis123
        avatar: {
            is_default: true,
            originalName: "default.png",
            url: "https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/test-blog-api/defaults/default-avatar-1.webp"
        },
        creation_date: "2022-12-05T22:34:16.351+00:00"
    }
];

const initPosts = [
    {
        _id: "638e71789e02cc9f183be011",
        title: "Hello World!",
        content: "<h1>Hello World!</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ipsum dui, placerat ut tellus ac, tincidunt fermentum est. Vivamus sed libero vel mauris vestibulum consectetur sit amet ac justo. Ut sed porta velit. Sed porttitor lacus sodales hendrerit cursus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper pulvinar justo id pretium. Proin at semper.</p>",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ipsum dui, placerat ut tellus ac, tincidunt fermentum est. Vivamus sed libero vel mauris vestibulum consectetur sit amet ac justo. Ut sed porta velit. Sed porttitor lacus sodales hendrerit cursus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse ullamcorper pulvinar justo id pretium. Proin at semper.",
        author: "638e710e9e02cc9f183be004",
        timestamp: "2022-12-05T22:32:24.598+00:00",
        photo: {
            is_default: true,
            originalName: "default.webp",
            url: "https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/dev-blog-api/defaults/default-photo-1.webp"
        },
        published: true
    },
    {
        _id: "638e718e9e02cc9f183be018",
        title: "Foo bar",
        content: "<h1>Foo bar</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse volutpat mauris nec turpis placerat, eu porta est eleifend. Nullam eleifend maximus augue non interdum. Sed justo sapien, dapibus vel ultricies vel, facilisis in nisl. Maecenas in condimentum velit. Aliquam et odio risus. Nam magna nisl, bibendum tincidunt hendrerit eget, facilisis in eros. Mauris interdum magna nec sagittis feugiat. Nullam aliquet.</p>",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse volutpat mauris nec turpis placerat, eu porta est eleifend. Nullam eleifend maximus augue non interdum. Sed justo sapien, dapibus vel ultricies vel, facilisis in nisl. Maecenas in condimentum velit. Aliquam et odio risus. Nam magna nisl, bibendum tincidunt hendrerit eget, facilisis in eros. Mauris interdum magna nec sagittis feugiat. Nullam aliquet.",
        author: "638e710e9e02cc9f183be004",
        timestamp: "2022-12-05T22:32:46.343+00:00",
        photo: {
            is_default: true,
            originalName: "default.webp",
            url: "https://res.cloudinary.com/dqcnxy51g/image/upload/v1664991126/dev-blog-api/defaults/default-photo-1.webp"
        },
        published: true
    }
];

const initComments = [
    {
        _id: "638e71a49e02cc9f183be028",
        content: "Excellent",
        author: "638e710e9e02cc9f183be004",
        post: "638e718e9e02cc9f183be018",
        timestamp: "2022-12-05T22:33:08.179+00:00"
    },
    {
        _id: "638e72069e02cc9f183be03f",
        content: "Amazing!",
        author: "638e71e89e02cc9f183be031",
        post: "638e718e9e02cc9f183be018",
        timestamp: "2022-12-05T22:34:46.917+00:00"
    }
];


const userEmailsInDb = async () => {
    const users = await User.find({});
    return users.map(user => user.email);
};

const postIdsInDb = async () => {
    const posts = await Post.find({});
    return posts.map(post => post._id);
};

const commentIdsInDb = async () => {
    const comments = await Comment.find({});
    return comments.map(comment => comment._id);
};

module.exports = {
    userEmailsInDb, postIdsInDb, commentIdsInDb, initUser, initUsers, initPosts, initComments
};
