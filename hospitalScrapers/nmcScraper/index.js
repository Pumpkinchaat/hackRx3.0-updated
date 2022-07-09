/**
 * This code will scrape information for all the medical colleges in India {they have hospitals too}
 * and store it inside of the metadata DB
 *
 * URL used for medicall college scraping =
 * https://www.nmc.org.in/information-desk/for-students-to-study-in-india/list-of-college-teaching-mbbs/
 */

//loading the environment variables in the .env file

require("dotenv").config();
const Institution = require("./model");
const mongoose = require("mongoose");

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

//defining a sync sleep function
const sleep = async (miliseconds) => {
  return new Promise((res, rej) => {
    setTimeout(res, miliseconds);
  });
};

const connectDB = async () => {
  //connect to the metadata DB
  try {
    await mongoose.connect(process.env.METADATA_DB_URL);
    console.log("[INFO] Production DB connected successfully");
  } catch (err) {
    console.log(
      "[ERROR some issues in connecting to the production DB ---> ",
      err
    );
  }
};

const scrapePage = async (page) => {
  let nextPageUrl, html, $;

  try {
    do {
      //goto the nextPage IF it exists
      if (nextPageUrl) {
        await page.click("a#mbbsColleges_next");

        await page.waitForNavigation();
      }

      await sleep(7500); //this will wait for the data in the page to load {7.5 sec}

      //get the HTML and inject
      html = await page.content();
      $ = cheerio.load(html);

      //get all colleges
      const colleges = $("table#mbbsColleges tbody tr td:nth-child(4)");

      //iterate over each college and save it
      colleges.each(async (index, element) => {
        const collegeText = $(element).text();

        const temp = collegeText.split(",");
        const cityName = temp.pop();
        const address = collegeText;
        const name = temp.join(",");

        //save the college if it already doesnt exist in the metadata DB
        const oldCollege = await Institution.findOne({
          cityName,
          address,
          name,
        });
        if (oldCollege) {
          console.log("[INFO] The medical college already exists, SKIPPING...");
        } else {
          const newCollege = new Institution({
            cityName,
            address,
            name,
          });
          await newCollege.save();
          console.log(
            "[INFO] The new college has been successfully saved to the MetaData DB"
          );
        }
      });

      //go to the next page
      nextPageUrl = $("a#mbbsColleges_next");
    } while (nextPageUrl);
  } catch (err) {
    console.log("[ERROR] ---> ", err.message);
  }
};

//*Driver Code
const main = async () => {
  //connecting the metadata DB
  await connectDB();

  //launching and setting up the headless browsers
  const browser = await puppeteer.launch({
    headless: true,
  });

  //launching the page
  const page = await browser.newPage();
  await page.goto(process.env.MEDICAL_COLLEGE_URL);

  //scraping the medical colleges datas
  await scrapePage(page);
  console.log(
    "[INFO] Scraping process completed, saving the data to metadata DB"
  );

  //close the headless browser after scraping
  await browser.close();
};

//Running the driver code
main();
