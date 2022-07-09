const { Schema, model } = require("mongoose");

const institutionSchema = new Schema({
  name: String,
  address: String,
  cityName: String,
  type: String,
  geometry: [Number],
});

module.exports = model("Institution", institutionSchema);
