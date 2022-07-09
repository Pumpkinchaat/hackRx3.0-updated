const { generateJWT } = require("./jwt");
const { User } = require("../connectDB");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const AppError = require("../utils/appError");

exports.login = catchAsync(async (req, res, next) => {
  //load the username and password in the req.body
  const { username, password } = req.body;

  if (!username || !password)
    return next(new AppError("Username or password not provided", 401));

  let user = await User.findOne({ username });
  if (!user) return next(new AppError("User not found", 404));

  //comparing the password if the oauthFlag is false
  const match = await bcrypt.compare(password, user.password);
  if (!match) return next(new AppError("Access Forbidden", 403));

  // creates session using JWT
  const token = generateJWT(user._id);
  res.cookie("Authorization", `Bearer ${token}`, {
    httpOnly: true,
    maxAge: process.env.COOKIE_EXPIRES_IN * 60 * 1000,
  });
  req.userID = user._id; //this is done for authorization

  res.status(200).json({
    status: "success",
    reqTime: req.requestTime,
    data: {
      user,
    },
  });
});

exports.logoutUser = catchAsync(async (req, res, next) => {
  //session will de destroyed and the req.userID -> NULL
  req.userID = null;
  res.clearCookie("Authorization", {
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    reqTime: req.requestTime,
    data: { message: "User successfully logged out" },
  });
});
