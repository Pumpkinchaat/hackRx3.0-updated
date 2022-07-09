const { Schema, model } = require("mongoose");

const institutionSchema = new Schema({
  name: String,
  address: String,
  cityName: String,
  type: String,
});

module.exports = model("Institution", institutionSchema);
