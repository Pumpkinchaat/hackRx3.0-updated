const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { Institution } = require("../../connectDB");
const request = require("request-promise");

const { createOne, updateOne } = require("../handleFactory");

module.exports.getAllHospitals = catchAsync(async (req, res, next) => {
  //returning Dehradun hospitals by default {hahrdcoding}
  //!REMOVE THIS

  let document;

  let { location } = req.params;
  if (!location) document = await Institution.find({ cityName: "Dehradun" });
  else {
    //this logic is to capitalize the words -> navi mumbai = Navi Mumbai
    location = location
      .split(" ")
      .map((element, index) => {
        return `${element[0].toUpperCase() + element.slice(1, element.length)}`;
      })
      .join(" ");
    document = await Institution.find({ cityName: location });
  }

  res.status(200).json({
    status: "success",
    results: document.length,
    reqTime: req.requestTime,
    data: {
      document,
    },
  });
});

module.exports.updateHospital = catchAsync(async (req, res, next) => {
  const { name, address, cityName, type } = req.body;

  if (!name || !address || !cityName || !type)
    return next(new AppError("One or Many fields empty", 400));

  // req.body.creator = req.userID; !The option to update creator won't be provided

  const requestUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${process.env.ACCESS_TOKEN}`;

  const response = await request.get(requestUrl);
  const geometry = JSON.parse(response).features[0].geometry.coordinates;

  if (!geometry) return next(new AppError("Geo-Coding Service is down", 500));

  req.body.geometry = geometry;

  updateOne(Institution)(req, res, next);
});

module.exports.createHospital = catchAsync(async (req, res, next) => {
  const { name, address, cityName, type } = req.body;

  if (!name || !address || !cityName || !type)
    return next(new AppError("One or Many fields empty", 400));

  req.body.creator = req.userID;

  const requestUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${process.env.ACCESS_TOKEN}`;

  const response = await request.get(requestUrl);
  const geometry = JSON.parse(response).features[0].geometry.coordinates;

  if (!geometry) return next(new AppError("Geo-Coding Service is down", 500));

  req.body.geometry = geometry;

  createOne(Institution)(req, res, next);
});
