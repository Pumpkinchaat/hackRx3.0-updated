/**
 * This script will get the review data from the DB, which will be used to train the sentimental engine
 * The division we are going for is (4:1) {4 review in Train set , 1 review in test set}
 *
 * INSTRUCTIONS FOR RUNNING: -
 *  1. Goto terminal and arrive at the directory where this code is tored
 *  2. type: node index.js
 *  3. DONE! - find your reviews inside the reviews folder
 */

//loading the .env file
require("dotenv").config();

//importing the rated reviews from production DB
const ProcessedReview = require("./model");

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

//defining the folder paths
const TrainFolderPath = path.join(__dirname, "reviews", "train");
const TestFolderPath = path.join(__dirname, "reviews", "test");
const TrainFolderPositivePath = path.join(TrainFolderPath, "pos");
const TrainFolderNegativePath = path.join(TrainFolderPath, "neg");
const TestFolderPositivePath = path.join(TestFolderPath, "pos");
const TestFolderNegatiivePath = path.join(TestFolderPath, "neg");

const main = async () => {
  //connecting to the production DB
  try {
    await mongoose.connect(process.env.PRODUCTION_DB_URL);
    console.log("[INFO] Production DB connected successfully");
  } catch (err) {
    console.log(
      "[ERROR some issues in connecting to the production DB ---> ",
      err
    );
  }

  //pulling all the review data from the production DB
  const positiveReviews = await ProcessedReview.find({ rating: { $gt: 3.5 } }); //to create  higher bias for negative reviews due to product reasons
  const negativeReviews = await ProcessedReview.find({ rating: { $lte: 3.5 } }); //2.5 will be considered a negative review

  console.log("[INFO] Acquired Reviews");

  const length = Math.min(positiveReviews.length, negativeReviews.length); // the number of reviews need to be equal for positive and negative

  for (let i = 0; i < length; i += 4) {
    //the division will be a 4:1 as mentioned
    //*This is the pos section
    let limit = i + 3;
    while (i < limit) {
      const TrainPositiveReviewPath = path.join(
        TrainFolderPositivePath,
        `${i}.txt`
      );
      fs.writeFileSync(TrainPositiveReviewPath, positiveReviews[i].reviewText);
      i++;
    }

    const TestPositiveReviewPath = path.join(
      TestFolderPositivePath,
      `${i}.txt`
    );
    fs.writeFileSync(TestPositiveReviewPath, positiveReviews[i].reviewText);
    i++;

    i -= 4; //this is to reset for negative reviews

    //*This is the neg section

    limit = i + 3;
    while (i < limit) {
      const TrainNegativeReviewPath = path.join(
        TrainFolderNegativePath,
        `${i}.txt`
      );
      fs.writeFileSync(TrainNegativeReviewPath, negativeReviews[i].reviewText);
      i++;
    }

    const TestNegativeReviewPath = path.join(
      TestFolderNegatiivePath,
      `${i}.txt`
    );
    fs.writeFileSync(TestNegativeReviewPath, negativeReviews[i].reviewText);
    i++;
  }

  console.log("[INFO] The reviews have been divided");
  console.log("[INFO] Closing connection...");

  await mongoose.connection.close();
};

main();
