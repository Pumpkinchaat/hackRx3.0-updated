const express = require("express");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const bodyParser = require("body-parser");

const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));

//router
const hospitalRouter = require("./routes/hospital");
const userRouter = require("./routes/user");
const reviewRouter = require("./routes/review");

// error handlers
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/globalErrorController");

// creating middleware
app.use(express.json({ limit: "10kb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // to enable logging
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// for preventing DoS
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);

// for security
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// prevent parameter pollution
// from the query
app.use(hpp());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next(); // to make sure next middleware gets executed
});

//!ROUTES GO HERE**********
app.use("/api/hospitals", hospitalRouter);
app.use("/api/user", userRouter);
app.use("/api/review", reviewRouter);

// if the above routes don't get triggered, we can fire another middleware
// for catching errors
app.all("*", (req, res, next) => {
  //global error handler
  next(new AppError(`cannot find ${req.originalUrl} on this server!`, 404));
});

// error handling middleware
app.use(globalErrorHandler);

// server
module.exports = app;
