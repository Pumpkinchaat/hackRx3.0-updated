/**
 * This scrpit will help in geocoding the data of
 * institutions {hospitals etc.} present in metadata DB
 */

require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const request = require("request-promise");

//Sleep function for judicial calls of API
const sleep = async (miliseconds) => {
  return new Promise((res, rej) => {
    setTimeout(res, miliseconds);
  });
};

//getting the Institution model
const Institution = require("./model");

const main = async () => {
  //connect the DB
  try {
    await mongoose.connect(process.env.METADATA_DB_URL);
    console.log("[INFO] Database Connected");
  } catch (err) {
    console.log("[ERROR] Database NOT connected ---> ", err);
  }

  //getting all hospitals from metadata DB
  const institutions = await Institution.find({ cityName: "Dehradun" });
  console.log("[INFO] Institutions info acquired");

  const length = institutions.length; //get institutions length to iterate over it

  for (let i = 0; i < length; i++) {
    /**
     * Goto each institution
     * If they contain a geometry {long lat} IGNORE THEM
     * Otherwise find their geomtry and push it to their document in mongo
     */
    try {
      if (institutions[i].geometry.length) {
        console.log("[INFO] Review already rated, SKIPPING...");
        continue;
      }

      const address = institutions[i].address;
      const requestUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${process.env.ACCESS_TOKEN}`;

      const response = await request.get(requestUrl);
      const geometry = JSON.parse(response).features[0].geometry.coordinates;

      //Update the document
      await Institution.findOneAndUpdate(
        { _id: institutions[i]._id },
        { geometry: geometry }
      );
      console.log("[INFO] Updated!");

      //sleeping for API relaxation
      await sleep(1500);
    } catch (err) {
      console.log("[ERROR] ---> ", err);
    }
  }
};

main();
