/**
 * We won't be exporting models cause we are using multiple DBs,
 * so model for each one would be needed to define seperately
 */

const { Schema } = require("mongoose");

module.exports.institutionSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name of the institution is required"],
  },
  address: {
    type: String,
    required: [true, "Address of the institution is required"],
  },
  geometry: [Number],
  cityName: {
    type: String,
    required: [true, "City Name of the institution is required"],
  },
  type: {
    type: String,
    required: [true, "Type of the institution is required"],
    enum: ["Hospital", "Chemist", "Doctor", "Lab"],
  },
  review: [String],
  creator: String, //not required cause many were scraped
});

module.exports.unProcessedReviewSchema = new Schema({
  reviewerName: {
    type: String,
    required: [true, "The reviewername is required"],
  },
  reviewText: {
    type: String,
    required: [true, "The reviewText is required"],
  },
  domain: {
    type: String,
    required: [true, "The domain of review is required"],
  },
  institutionID: String, //a reference has NOT been created
  //cause the data is in diff DB
});

module.exports.processedReviewSchema = new Schema({
  reviewerName: {
    type: String,
    required: [true, "The reviewername is required"],
  },
  reviewText: {
    type: String,
    required: [true, "The reviewText is required"],
  },
  domain: {
    type: String,
    required: [true, "The domain of review is required"],
  },
  rating: {
    type: Number,
    required: [true, "A rating is required"],
  },
  creator: String,
  institutionID: String, //same as above reason
});

module.exports.userSchema = new Schema({
  username: {
    type: String,
    unique: [true, "The Username needs to be unique"],
    required: [true, "The Username is required"],
    trim: true,
  },
  password: {
    type: String,
    required: [true, "The Password is required"], //hash will be stored here
  },
});
