const express = require("express");
const router = express.Router();
const {
  getOne,
  authorizeUser,
  checkUser,
  deleteOne,
} = require("../controllers/handleFactory");

const { User, ProcessedReview } = require("../connectDB");

const { createReview, updateReview } = require("../controllers/review");

router.route("/").post(authorizeUser(User), createReview);

router
  .route("/:id")
  .get(getOne(ProcessedReview))
  .put(authorizeUser(User), checkUser(ProcessedReview), updateReview)
  .delete(
    authorizeUser(User),
    checkUser(ProcessedReview),
    deleteOne(ProcessedReview)
  );

module.exports = router;
