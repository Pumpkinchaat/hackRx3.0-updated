const { Schema, model } = require("mongoose");

const ProcessedReviewSchema = new Schema({
  reviewerName: String,
  reviewText: String,
  domain: String,
  rating: Number,
  institutionID: String,
});

module.exports = model("ProcessedReview", ProcessedReviewSchema);
