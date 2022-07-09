const mongoose = require("mongoose");

let metadataDB, supportingDB, productionDB;

const {
  institutionSchema,
  unProcessedReviewSchema,
  processedReviewSchema,
  userSchema,
} = require("./models/schemas");

try {
  metadataDB = mongoose.createConnection(process.env.METADATA_DB_URL);
  supportingDB = mongoose.createConnection(process.env.SUPPORTING_DB_URL);
  productionDB = mongoose.createConnection(process.env.PRODUCTION_DB_URL);
} catch (err) {
  console.log("ERROR 💥", err.message);
}

console.log(
  "[INFO] The databased {production / supporting / metadata} has been connected"
);

module.exports.Institution = metadataDB.model("Institution", institutionSchema);
module.exports.UnProcessedReview = supportingDB.model(
  "UnProcessedReview",
  unProcessedReviewSchema
);
module.exports.ProcessedReview = productionDB.model(
  "ProcessedReview",
  processedReviewSchema
);
module.exports.User = productionDB.model("User", userSchema);
