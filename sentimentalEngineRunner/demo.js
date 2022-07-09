/**
 * This code will allow the sentimental engine to run over the un-rated reviews in supporting DB
 */

const { spawn } = require("child_process");
const path = require("path");
const mongoose = require("mongoose");

//Sleep function to pause execution thread
const sleep = async (miliseconds) => {
  return new Promise((res, rej) => {
    setTimeout(res, miliseconds);
  });
};

//loading all the environment variables
require("dotenv").config();

//importing the unprocessd model
const {
  unProcessedReviewSchema,
  processedReviewSchema,
  institutionSchema,
} = require("./model");

//defining the file Path
const filePath = path.join(
  __dirname,
  "..",
  "Sentiment Analysis_Reviews",
  "output.py"
);

//defining the model path
const modelPath = path.join(
  __dirname,
  "..",
  "Sentiment Analysis_Reviews",
  "training",
  "config",
  "model-best"
);

//This method will connect the DB
const connectDB = async () => {
  //connecting the supporting DB and Produciton DB and creating models out of them
  const supportingDB = await mongoose.createConnection(
    process.env.SUPPORTING_DB_URL
  );
  const productionDB = await mongoose.createConnection(
    process.env.PRODUCTION_DB_URL
  );
  const metadataDB = await mongoose.createConnection(
    process.env.METADATA_DB_URL
  );

  const UnProcessedReview = supportingDB.model(
    "UnProcessedReview",
    unProcessedReviewSchema
  );
  const ProcessedReview = productionDB.model(
    "ProcessedReview",
    processedReviewSchema
  );
  const Institution = metadataDB.model("Institution", institutionSchema);

  return { UnProcessedReview, ProcessedReview, Institution };
};

const main = async () => {
  //try connecting the DB
  try {
    const { UnProcessedReview, ProcessedReview, Institution } =
      await connectDB();
    console.log(
      "[INFO] The SUPPORTING and PRODUCTION DB was connected successfully"
    );

    const institutions = await Institution.find({ cityName: "Dehradun" });
    //getting all the unprocessed reveiws
    const reveiws = await UnProcessedReview.find();
    console.log("[INFO] The unprocessed reviews are gathered");

    const length = reveiws.length; //Number of unProcessedReviews to iterate over and run the sentimental analysis engine

    for (let j = 0; j < institutions.length; j++) {
      for (let i = 0; i < length; i++) {
        const institution = institutions[j];
        if (institution._id.equals(reveiws[i].institutionID)) {
          //creating a child process for the sentimental engine
          const childPython = spawn("python", [
            `${filePath}`,
            `${reveiws[i].reviewText}`,
            `${modelPath}`,
          ]);

          //capturing data from stdout
          childPython.stdout.on("data", async (data) => {
            const rating = Buffer.from(data).toString("utf8").trim();

            //It will be stored in the
            //Production DB and removed from the supporting DB

            const newReview = new ProcessedReview({
              reviewerName: reveiws[i].reviewerName,
              reviewText: reveiws[i].reviewText,
              domain: reveiws[i].domain,
              rating: rating,
              institutionID: reveiws[i].institutionID,
            });

            await newReview.save();

            await UnProcessedReview.deleteOne({
              _id: reveiws[i]._id,
            });

            console.log("[INFO] Unprocessed review Rated successfully");
          });

          //capturing data from stderr
          childPython.stderr.on("data", (err) => {
            console.log(err);
          });

          //capturing the return code of engine
          childPython.on("close", (code) => {
            console.log("[INFO] Engine ended with code: ", code);
          });

          //Implementing a hold to ensure processes are NOT congested
          await sleep(100);
        }
      }
    }
  } catch (err) {
    console.log("[ERROR] ---> ", err.message);
  }
};

main();
