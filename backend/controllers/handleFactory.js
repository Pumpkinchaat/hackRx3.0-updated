const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { User } = require("../connectDB");

const { generateJWT } = require("./jwt");

exports.deleteOne = (Model) =>
  //provide ID inside params of doc to delete
  catchAsync(async (req, res, next) => {
    if (!req.params.id)
      return next(new AppError("The id param was not supplied", 400));

    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) return next(new AppError("No document with that ID", 404));

    res.status(200).json({
      status: "success",
    });
  });

exports.checkUser = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const document = await Model.findById(id);

    if (!document) return next(new AppError("The document was not found", 404));

    if (document.creator == req.userID) return next();
    else return next(new AppError("Forbidden Access", 403));
  });

exports.authorizeUser = (Model) =>
  catchAsync(async (req, res, next) => {
    if (!req.cookies.Authorization)
      return next(new AppError("Bearer Token is missing", 401));

    const jwtToken = req.cookies.Authorization.split(" ")[1];
    if (!jwtToken) return next(new AppError("Bearer token is missing", 401));

    jwt.verify(jwtToken, process.env.JWT_SECRET, async (err, Obj) => {
      if (err) return next(new AppError("Bearer token is invalid", 403));
      const user = await Model.findById(Obj.id);

      if (!user) return next(new AppError("User not found", 404));

      req.userID = `${user._id}`;
      next();
    });
  });

exports.updateOne = (Model) =>
  //forward the updated body and ID should be in params
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // now the modified document will be returned
      runValidators: true, // does type checking as defined by the schema
    });

    if (!document)
      return next(new AppError("no document found with that ID", 404)); // if no tours are found with the given ID in the db

    res.status(200).json({
      status: "success",
      reqTime: req.requestTime,
      data: {
        document,
      },
    });
  });

exports.createOne = (Model, returnJWT = false) =>
  catchAsync(async (req, res, next) => {
    //hashing the password if provided
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 12); //12 salt rounds
    }

    //creating the document
    const document = await Model.create(req.body);
    if (returnJWT) {
      console.log("Cookie will be returned");
      res.cookie("Authorization", `Bearer ${generateJWT(document._id)}`, {
        httpOnly: true,
        maxAge: process.env.COOKIE_EXPIRES_IN * 60 * 1000,
      });
    }

    //creating a req.userID for authorization
    if (Model === User) req.userID = document._id;

    res.status(200).json({
      status: "success",
      reqTime: req.requestTime,
      data: {
        document,
      },
    });
  });

exports.getOne = (Model, populateQuery = null) =>
  catchAsync(async (req, res, next) => {
    let document;

    if (!populateQuery) document = await Model.findById(req.params.id);
    else document = await Model.findById(req.params.id).populate(populateQuery);

    if (document) {
      console.log("bruhhh");
      console.log(document);
    } else console.log("wefwefw");

    if (!document)
      return next(new AppError("no document found with that ID", 404)); // if no tours are found with the given ID in the db

    res.status(200).json({
      status: "success",
      results: document.length,
      reqTime: req.requestTime,
      data: {
        document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.find();

    res.status(200).json({
      status: "success",
      results: document.length,
      reqTime: req.requestTime,
      data: {
        document,
      },
    });
  });
