/**
 * This is supposed to run only after the geoEncoder/index.js script
 * This will generate a geoJSON attributes file, which will be used by MapBox to render our map
 * This is done to improve speed as a static mapbox link can be generated which will be fast and scalable
 * THE RESULTS WILL BE IN RESULTS.JSON
 */

const mongoose = require("mongoose");
const Institution = require("./model");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const connectDB = async () => {
  //connect the code to mongo database
  await mongoose.connect(process.env.METADATA_DB_URL);
};

const main = async () => {
  try {
    //connecting to metadata DB
    await connectDB(process.env.METADATA_DB_URL);
    console.log("[INFO] The Database is connected successfully");
  } catch (err) {
    console.log(
      "[ERROR] There is problem connecting to the databse (METADATA DB)"
    );
  }

  //getting all the institutions
  const institutions = await Institution.find({ cityName: "Dehradun" }); //working on dehradun

  const length = institutions.length; //getting the length to perform iterations

  let result = { features: [] }; //this will store the result GeoJSON

  for (let i = 0; i < length; i++) {
    if (!institutions[i].geometry.length) continue;

    //creating the geoJSON and pushing it
    const temp = {
      type: "Feature",
      properties: {
        title: institutions[i].name,
        description: institutions[i].address,
        id: institutions[i].type,
      },
      geometry: {
        coordinates: institutions[i].geometry,
        type: "Point",
      },
    };

    result.features.push(temp);
  }

  //writing the result to results.json
  const JSONpath = path.join(__dirname, "results.json");
  fs.writeFileSync(JSONpath, JSON.stringify(result));

  //closing the connection
  mongoose.connection.close();
};

main();
