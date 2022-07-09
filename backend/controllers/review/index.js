const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const { ProcessedReview, User } = require("../../connectDB");
const { createOne, updateOne } = require("../handleFactory");

module.exports.createReview = catchAsync(async (req, res, next) => {
  const { reviewText, rating, institutionID } = req.body;

  if (!reviewText || !rating || !institutionID)
    return next(new AppError("One or Many Fields empty", 400));

  req.body.reviewerName = (await User.findById(req.userID)).username;
  req.body.domain = "Self";
  req.body.creator = req.userID;

  createOne(ProcessedReview)(req, res, next);
});

module.exports.updateReview = catchAsync(async (req, res, next) => {
  const { reviewText, rating, institutionID } = req.body;

  if (!reviewText || !rating || !institutionID)
    return next(new AppError("One or Many Fields empty", 400));

  req.body.reviewerName = (await User.findById(req.userID)).username;
  req.body.domain = "Self";
  req.body.creator = req.userID;

  updateOne(ProcessedReview)(req, res, next);
});
