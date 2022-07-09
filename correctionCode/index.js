const mongoose = require("mongoose");

require("dotenv").config();
const {
  institutionSchema,
  unProcessedReviewSchema,
  processedReviewSchema,
} = require("./schema");

const main = async () => {
  try {
    const metadataDB = mongoose.createConnection(process.env.METADATA_DB_URL);
    const productionDB = mongoose.createConnection(
      process.env.PRODUCTION_DB_URL
    );
    const supportingDB = mongoose.createConnection(
      process.env.SUPPORTING_DB_URL
    );

    console.log("[INFO] DB connected");
    const Institution = metadataDB.model("Institution", institutionSchema);
    const ProcessedReview = productionDB.model(
      "ProcessedReview",
      processedReviewSchema
    );

    console.log("[INFO] Reviews Acquired");
    const institutions = await Institution.find({ cityName: "Dehradun" });
    const reviews = await ProcessedReview.find();

    for (let i = 0; i < institutions.length; i++) {
      const institution = institutions[i];
      institution.review = [];

      for (let j = 0; j < reviews.length; j++) {
        if (institution._id.equals(reviews[j].institutionID)) {
          institution.review.push(reviews[j]._id);
        }
      }

      console.log(institution);
      await Institution.updateOne(
        { _id: institutions[i]._id },
        {
          review: institution.review,
        }
      );
    }

    console.log("The Entire Data has been corrected");
  } catch (err) {
    console.log(err);
  }
};
main();
