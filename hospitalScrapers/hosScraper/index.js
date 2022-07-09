/**
 * This is a script which will scrape list of hospitals or institutions and add them to the metadataDB
 * NOTE: Although using this script we have scraped almost all the hospitals / institutions in India
 * BUT we are still using only the city of Dehradun for demo purposes
 */

//This is a sleep function, which will halt the execution
//thread for x miliseconds
const sleep = async (miliseconds) => {
  return new Promise((res, rej) => {
    setTimeout(res, miliseconds);
  });
};

//This will hold the execution thread using sleep() for 3 to 7 (random) miliseconds
const waitRandomTime = async () => {
  const miliseconds = Math.trunc(Math.random() * (7 - 3 + 1) * 1000 + 3000); //generates a random number between 3 to 7
  await sleep(miliseconds);
};

const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const Institution = require("./model");

//this will load the environment variables
require("dotenv").config();

const HOSPITALURL = "https://www.healthfrog.in/hospital";
const CHEMISTURL = "https://www.healthfrog.in/chemists";
const DOCTORURL = "https://www.healthfrog.in/doctor";
const LABURL = "https://www.healthfrog.in/laboratory";

const scrapeHospitalCity = async (page, cityUrl, cityName) => {
  try {
    await page.goto(cityUrl);

    let html = await page.content();
    let $ = cheerio.load(html);

    await waitRandomTime();

    let loadMoreButton = (
      await page.$x(
        '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
      )
    )[0];

    while (loadMoreButton) {
      await loadMoreButton.click();

      await waitRandomTime();

      loadMoreButton = (
        await page.$x(
          '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
        )
      )[0];
    }

    //all the hospitals will be loaded

    html = await page.content();
    $ = cheerio.load(html);

    const hospitals = $("div.post > div.listing");

    for (let i = 0; i < hospitals.length; i++) {
      const hospitalName = $(hospitals[i]).find("h3 > a").text().trim();
      const hospitalAddress = $(hospitals[i]).find("p").text().trim();

      if (hospitalName === "" || hospitalAddress === "") continue;

      const oldInstitution = await Institution.findOne({
        name: hospitalName,
        cityName,
        address: hospitalAddress,
      });
      if (oldInstitution) {
        console.log("[INFO] Already in DB, Hospital skipped");
        continue;
      }

      const newInstitution = new Institution({
        name: hospitalName,
        address: hospitalAddress,
        cityName,
        type: "Hospital",
      });

      await newInstitution.save();
      console.log("[INFO] New Hospital Saved");
    }
  } catch (err) {
    console.log("[ERROR SCRAPE HOSPITAL CITY] ", err.message);
  }
};

const scrapeHospitalState = async (page, stateUrl) => {
  try {
    await page.goto(stateUrl);

    const html = await page.content();
    const $ = cheerio.load(html);

    const cities = $("div.post > ul > li > a");

    for (let i = 0; i < cities.length; i++) {
      const cityUrl = $(cities[i]).attr("href");
      const cityName = $(cities[i]).text();

      await scrapeHospitalCity(page, cityUrl, cityName);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE HOSPITAL STATE] ", err.message);
  }
};

const scrapeHospital = async (page) => {
  try {
    await page.goto(HOSPITALURL);

    const html = await page.content();
    const $ = cheerio.load(html);

    const states = $("div.post > ul > li > a");

    for (let i = 0; i < states.length; i++) {
      const stateUrl = $(states[i]).attr("href");
      console.log(stateUrl);

      await scrapeHospitalState(page, stateUrl);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE HOSPITAL] ", err.message);
  }
};

//*HOSPITAL CODE ENDS HERE---------------------------------------------------------------------------------
//* CHEMIST CODE STARTS HERE

const scrapeChemistCity = async (page, cityUrl, cityName) => {
  try {
    await page.goto(cityUrl);

    let html = await page.content();
    let $ = cheerio.load(html);

    await waitRandomTime();

    let loadMoreButton = (
      await page.$x(
        '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
      )
    )[0];

    while (loadMoreButton) {
      await loadMoreButton.click();

      await waitRandomTime();

      loadMoreButton = (
        await page.$x(
          '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
        )
      )[0];
    }

    //all the chemists will be loaded

    html = await page.content();
    $ = cheerio.load(html);

    const chemists = $("div.post > div.listing");

    for (let i = 0; i < chemists.length; i++) {
      const chemistName = $(chemists[i]).find("h3 > a").text().trim();
      const chemistAddress = $(chemists[i]).find("p").text().trim();

      if (chemistName === "" || chemistAddress === "") continue;

      const oldInstitution = await Institution.findOne({
        cityName,
        name: chemistName,
        address: chemistAddress,
      });
      if (oldInstitution) {
        console.log("[INFO] Data has already been scraped, IGNORING...");
        continue;
      }

      const newInstitution = new Institution({
        name: chemistName,
        address: chemistAddress,
        cityName,
        type: "Chemist",
      });

      await newInstitution.save();
      console.log("[INFO] New Chemist Saved");
    }
  } catch (err) {
    console.log("[ERROR SCRAPE CHEMIST CITY] ", err.message);
  }
};

const scrapeChemistState = async (page, stateUrl) => {
  try {
    await page.goto(stateUrl);

    const html = await page.content();
    const $ = cheerio.load(html);

    const cities = $("div.post > ul > li > a");

    for (let i = 0; i < cities.length; i++) {
      const cityUrl = $(cities[i]).attr("href");
      const cityName = $(cities[i]).text();

      await scrapeChemistCity(page, cityUrl, cityName);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE CHEMIST STATE] ", err.message);
  }
};

const scrapeChemist = async (page) => {
  try {
    await page.goto(CHEMISTURL);

    const html = await page.content();
    const $ = cheerio.load(html);

    const states = $("div.post > ul > li > a");

    for (let i = 0; i < states.length; i++) {
      const stateUrl = $(states[i]).attr("href");

      await scrapeChemistState(page, stateUrl);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE CHEMIST] ", err.message);
  }
};

//* CHEMIST CODE ENDS HERE---------------------------------------------------------------------------------
//* DOCTOR CODE STARTS HERE

const scrapeDoctorCity = async (page, cityUrl, cityName) => {
  try {
    await page.goto(cityUrl);

    let html = await page.content();
    let $ = cheerio.load(html);

    await waitRandomTime();

    let loadMoreButton = (
      await page.$x(
        '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
      )
    )[0];

    while (loadMoreButton) {
      await loadMoreButton.click();

      await waitRandomTime();

      loadMoreButton = (
        await page.$x(
          '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
        )
      )[0];
    }

    //all the doctors will be loaded

    html = await page.content();
    $ = cheerio.load(html);

    const doctors = $("div.post > div.listing");

    for (let i = 0; i < doctors.length; i++) {
      const doctorName = $(doctors[i]).find("h3 > a").text().trim();
      const doctorAddress = $(doctors[i]).find("p").text().trim();

      if (doctorName === "" || doctorAddress === "") continue;

      const oldInstitution = await Institution.findOne({
        cityName,
        name: doctorName,
        address: doctorAddress,
      });
      if (oldInstitution) {
        console.log("[INFO] Data has already been scraped, IGNORING...");
        continue;
      }

      const newInstitution = new Institution({
        name: doctorName,
        address: doctorAddress,
        cityName,
        type: "Doctor",
      });

      await newInstitution.save();
      console.log("[INFO] New Doctor Saved");
    }
  } catch (err) {
    console.log("[ERROR SCRAPE DOCTOR CITY] ", err.message);
  }
};

const scrapeDoctorState = async (page, stateUrl) => {
  try {
    await page.goto(stateUrl);

    const html = await page.content();
    const $ = cheerio.load(html);

    const cities = $("div.post > ul > li > a");

    for (let i = 0; i < cities.length; i++) {
      const cityUrl = $(cities[i]).attr("href");
      const cityName = $(cities[i]).text();

      await scrapeDoctorCity(page, cityUrl, cityName);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE DOCTOR STATE] ", err.message);
  }
};

const scrapeDoctor = async (page) => {
  try {
    await page.goto(DOCTORURL);

    const html = await page.content();
    const $ = cheerio.load(html);

    const states = $("div.post > ul > li > a");

    for (let i = 0; i < states.length; i++) {
      const stateUrl = $(states[i]).attr("href");

      await scrapeDoctorState(page, stateUrl);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE DOCTOR] ", err.message);
  }
};

//* DOCTOR CODE ENDS HERE---------------------------------------------------------------------------------
//* LAB CODE STARTS HERE

const scrapeLabCity = async (page, cityUrl, cityName) => {
  try {
    await page.goto(cityUrl);

    let html = await page.content();
    let $ = cheerio.load(html);

    await waitRandomTime();

    let loadMoreButton = (
      await page.$x(
        '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
      )
    )[0];

    while (loadMoreButton) {
      await loadMoreButton.click();

      await waitRandomTime();

      loadMoreButton = (
        await page.$x(
          '//div[@id="pagination" and not(contains(@style , "display: none"))]/a'
        )
      )[0];
    }

    //all the labs will be loaded

    html = await page.content();
    $ = cheerio.load(html);

    const labs = $("div.post > div.listing");

    for (let i = 0; i < labs.length; i++) {
      const labName = $(labs[i]).find("h3 > a").text().trim();
      const labAddress = $(labs[i]).find("p").text().trim();

      if (labName === "" || labAddress === "") continue;

      const oldInstitution = await Institution.findOne({
        cityName,
        name: labName,
        address: labAddress,
      });
      if (oldInstitution) {
        console.log("[INFO] Data has already been scraped, IGNORING...");
        continue;
      }

      const newInstitution = new Institution({
        name: labName,
        address: labAddress,
        cityName,
        type: "Lab",
      });

      await newInstitution.save();
      console.log("[INFO] New Lab Saved");
    }
  } catch (err) {
    console.log("[ERROR SCRAPE LAB CITY] ", err.message);
  }
};

const scrapeLabState = async (page, stateUrl) => {
  try {
    await page.goto(stateUrl);

    const html = await page.content();
    const $ = cheerio.load(html);

    const cities = $("div.post > ul > li > a");

    for (let i = 0; i < cities.length; i++) {
      const cityUrl = $(cities[i]).attr("href");
      const cityName = $(cities[i]).text();

      await scrapeLabCity(page, cityUrl, cityName);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE LAB STATE] ", err.message);
  }
};

const scrapeLab = async (page) => {
  try {
    await page.goto(LABURL);

    const html = await page.content();
    const $ = cheerio.load(html);

    const states = $("div.post > ul > li > a");

    for (let i = 0; i < states.length; i++) {
      const stateUrl = $(states[i]).attr("href");

      await scrapeLabState(page, stateUrl);
      await waitRandomTime();
    }
  } catch (err) {
    console.log("[ERROR SCRAPE LAB] ", err.message);
  }
};

//*THIS IS THE MAIN CODE {DRIVER CODE}
const main = async () => {
  try {
    //instantiating a headless browser for scraping
    await mongoose.connect(process.env.DBURL, { useNewUrlParser: true });
    console.log("[INFO] DATABASE CONNECTED");

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await scrapeHospital(page); //*This will scrape all the hospitals
    await scrapeChemist(page); //* This will scrape all the chemist shops
    await scrapeDoctor(page); //* This will scrape all the doctors
    await scrapeLab(page); //* This will scrape all the Labs

    await browser.close();
  } catch (err) {
    console.log("[ERROR MAIN] ", err.message);
  }
};

main();
