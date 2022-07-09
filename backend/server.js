const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/.env` });
const mongoose = require("mongoose");

// global synchronous error handler
process.on("uncaughtException", (err) => {
  //!REMOVE THIS LATER
  console.log(err);
  console.log(err.name, err.message);
  console.log("unhandled EXCEPTION 💥 shutting down");
  process.exit(1);
});

//running the connectDB.js file once
const {
  Institution,
  UnProcessedReview,
  ProcessedReview,
} = require("./connectDB");

//getting the app

const app = require("./app");

const port = process.env.PORT;

const server = app.listen(port, () => {
  console.log(`running at port ${port}`);
});

// global unhandledRejection catcher (async code exception handler)
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("unhandled REJECTION 💥 shutting down");
  server.close(() => {
    process.exit(1);
  });
});
