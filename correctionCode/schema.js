const { Schema, model } = require("mongoose");

module.exports.institutionSchema = new Schema({
  name: String,
  address: String,
  cityName: String,
  type: String,
  review: [
    {
      type: Schema.Types.ObjectId,
      ref: "ProcessedReview",
    },
  ],
});

module.exports.unProcessedReviewSchema = new Schema({
  reviewerName: String,
  reviewText: String,
  domain: String,
  institutionID: String,
});

module.exports.processedReviewSchema = new Schema({
  reviewerName: String,
  reviewText: String,
  domain: String,
  rating: Number,
  institutionID: String,
});
