# Backend API for the Blog Project
This is the repository for the backend of the blog project. 

## Live preview
Backend can be seen in action by using the frontend client (link below) or by starting the server by yourself.

## What does it do?
Backend responds to clients API requests with corresponding information or with an error if it can't be completed for some reason. Backend has CRUD operations that can be used to manipulate User, Post and Comment data, but only if the user has the necessary authorization.

## What was used?
* Node.js - JavaScript Runtime
* Express.js - Backend Framework
* Mongoose - ODM for MongoDB
* MongoDB - NoSQL Database
* Cloudinary - Image File Management
* Passport Middleware - Authentication and Authorization
* Jest, SuperTest and mongodb-memory-server - Backend Testing

## Getting started
Install command
```bash
npm install
```
Run development server
```bash
npm start
```

## Other Project Related Repository
* Blog Front: https://github.com/topihenrik/blog-front
