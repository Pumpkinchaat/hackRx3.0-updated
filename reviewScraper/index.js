require("dotenv").config();

const SEHATDOMAIN = "https://www.sehat.com/";
const BINGSEARCHQUERY = "https://www.bing.com/search?q=";
const JUSTDIAL = "https://www.justdial.com/";

const sleep = async (time) => {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
};
const waitRandomTime = async () => {
  const miliseconds = Math.trunc(Math.random() * (7 - 3 + 1) * 1000 + 3000); //generates a random number between 3 to 7
  await sleep(miliseconds);
};

const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const {
  institutionSchema,
  unProcessedReviewSchema,
  processedReviewSchema,
} = require("./schemas");

const connectDB = async () => {
  const metaDataDB = mongoose.createConnection(process.env.METADATAURL);
  const supportingDB = mongoose.createConnection(process.env.SUPPORTINGURL);
  const productionDB = mongoose.createConnection(process.env.PRODUCTIONURL);

  const Institution = metaDataDB.model("Institution", institutionSchema);
  const UnProcessedReview = supportingDB.model(
    "UnProcessedReview",
    unProcessedReviewSchema
  );
  const ProcessedReview = productionDB.model(
    "ProcessedReview",
    processedReviewSchema
  );

  return {
    Institution,
    metaDataDB,
    supportingDB,
    UnProcessedReview,
    ProcessedReview,
    productionDB,
  };
};

const sehatReviewScraper = async (institutions, page, UnProcessedReview) => {
  for (let i = 0; i < institutions.length; i++) {
    try {
      await waitRandomTime();
      const test = institutions[i];

      await page.goto(SEHATDOMAIN);

      await waitRandomTime();

      let html = await page.content();
      let $ = cheerio.load(html);

      await page.click("#menu2");
      if (test.type !== "Doctor") {
        await page.click(
          'button#menu2 + ul > li[role="presentation"] > span[role="menuitem"][tab="hospitals"]'
        );
      }

      await page.type("input#hospital-search-query-home", `${test.name}`, {
        delay: 75,
      });
      await page.evaluate(() => {
        document.querySelector("input#location-home").value = "";
      });
      await page.type("input#location-home", `${test.cityName}`, { delay: 89 });
      await sleep(1500);

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.click('fieldset > section  > button[type="submit"].search');
      await waitRandomTime();

      html = await page.content();
      $ = cheerio.load(html);

      const hospitals = $("#se_hospital_list > div.post h2 > a");
      for (let j = 0; j < hospitals.length; j++) {
        const hospitalUrl = $(hospitals[j]).attr("href");

        await page.goto(hospitalUrl);

        html = await page.content();
        $ = cheerio.load(html);

        const reviews = $("div.media > div");

        for (let k = 0; k < reviews.length; k++) {
          const reviewerName = $(reviews[k]).find("h4").text().trim();
          const reviewText = $(reviews[k]).find("p").text().trim();

          const oldReview = await UnProcessedReview.findOne({
            reviewerName,
            reviewText,
            domain: "sehat.com",
            institutionID: `${test._id}`,
          });
          if (oldReview) {
            console.log("[INFO] Review was already scraped");
            continue;
          }

          const newReview = new UnProcessedReview({
            reviewerName,
            reviewText,
            domain: "sehat.com",
            institutionID: `${test._id}`,
          });

          await newReview.save();
          console.log(
            "[INFO] The Review was successfully saved to supporting DB"
          );
        }

        await waitRandomTime();
        break;
      }
    } catch (err) {
      console.log("[ERROR SEHAT.COM] ---> ", err.message);
    }
  }
};

const mouthShutReviewScraper = async (institutions, page, ProcessedReview) => {
  for (let i = 0; i < institutions.length; i++) {
    try {
      await waitRandomTime();
      const test = institutions[i];

      await page.goto(
        `${BINGSEARCHQUERY}${test.name.split(" ").join("+")}+${test.cityName
          .split(" ")
          .join("+")}+reviews+mouthshut.com`
      );

      await waitRandomTime();

      let html = await page.content();
      let $ = cheerio.load(html);

      let institutionUrl = $($("ol#b_results > li.b_algo h2 a")[0]).attr(
        "href"
      );

      await page.goto(institutionUrl);

      let nextPage;
      do {
        if (nextPage) {
          await page.goto(nextPage);

          html = await page.content();
          $ = cheerio.load(html);
        }

        await waitRandomTime();

        await page.evaluate(async () => {
          const readMoreButtons = document.querySelectorAll(
            ".more.reviewdata > a"
          );
          for (let j = 0; j < readMoreButtons.length; j++) {
            await readMoreButtons[j].click();
          }
        });

        await waitRandomTime();

        html = await page.content();
        $ = cheerio.load(html);

        const reviews = $("div#dvreview-listing > .row.review-article");
        console.log(reviews.length);
        for (let j = 0; j < reviews.length; j++) {
          const ratedStars = $(reviews[j]).find(
            ".row .rating > span:nth-child(1) .rated-star"
          ).length;

          const reviewerName = $(reviews[j])
            .find(".row > div > div:nth-child(2) > a")
            .text()
            .trim();

          const reviewText = $(reviews[j])
            .find(".row > div:nth-child(2) > .more.reviewdata")
            .text()
            .replace("Flag This ReviewIrrelevantFakeJunk", "")
            .replace("Thank You! We appreciate your effort.", "")
            .trim();

          if (ratedStars) {
            // console.log({
            //   reviewerName,
            //   reviewText,
            //   domain: "mouthshut.com",
            //   rating: ratedStars,
            // });

            const oldReview = await ProcessedReview.findOne({
              reviewerName,
              reviewText,
              domain: "mouthshut.com",
              rating: ratedStars,
              institutionID: `${test._id}`,
            });
            if (oldReview) {
              console.log("[INFO] Review Already Exists, Skipping.....");
              continue;
            }

            const newReview = new ProcessedReview({
              reviewerName,
              reviewText,
              domain: "mouthshut.com",
              rating: ratedStars,
              institutionID: `${test._id}`,
            });

            await newReview.save();
            console.log("[INFO] The review has been saved to Production DB");
          }
        }

        if (nextPage === $("li.next > a").attr("href")) break;
        nextPage = $("li.next > a").attr("href");
      } while (nextPage);
    } catch (err) {
      console.log("[ERROR MOUTHSHUT.com] ---> ", err.message);
    }
  }
};

const practoReviewScraper = async (institutions, page, UnProcessedReview) => {
  for (let i = 0; i < institutions.length; i++) {
    try {
      await waitRandomTime();
      const test = institutions[i];

      await page.goto(
        `${BINGSEARCHQUERY}${test.name.split(" ").join("+")}+${test.cityName
          .split(" ")
          .join("+")}+reviews+practo`
      );

      await waitRandomTime();

      let html = await page.content();
      let $ = cheerio.load(html);

      let institutionUrl = $($("ol#b_results > li.b_algo h2 a")[0]).attr(
        "href"
      );
      if (!institutionUrl.includes("reviews"))
        institutionUrl = institutionUrl + `/reviews`;

      await page.goto(institutionUrl);

      let moreButton;
      await waitRandomTime();

      do {
        if (moreButton) {
          await page.click("button.feedback__pagination-btn");

          await waitRandomTime();
        }

        html = await page.content();
        $ = cheerio.load(html);

        const reviews = $("div.feedback--item > div:nth-child(2)");
        console.log(reviews.length);

        for (let j = 0; j < reviews.length; j++) {
          const reviewerName = $(reviews[j])
            .find('span[data-qa-id="reviewer-name"]')
            .text()
            .trim();
          const reviewText = $(reviews[j])
            .find(
              'div:nth-child(2) > div  p.feedback__content[data-qa-id="review-text"]'
            )
            .text()
            .replace("\n", "")
            .replace("+", "")
            .trim();

          if (reviewText.length !== 0) {
            const oldReview = await UnProcessedReview.findOne({
              reviewerName,
              reviewText,
              domain: "practo.com",
              institutionID: `${test._id}`,
            });

            if (oldReview) {
              console.log("[INFO] Review Already Exists, Skipping....");
              continue;
            }

            const newReview = new UnProcessedReview({
              reviewerName,
              reviewText,
              domain: "practo.com",
              institutionID: `${test._id}`,
            });

            await newReview.save();
            console.log(
              "[INFO] The review has been added to the supporting DB"
            );
          }
        }

        await waitRandomTime();

        moreButton = $('button[data-qa-id="view-more-feedback"]');
      } while (moreButton);
    } catch (err) {
      console.log("[PRACTO ERROR] ---> ", err);
    }
  }
};

const indiaplReviewScraper = async (institutions, page, ProcessedReview) => {
  for (let i = 0; i < institutions.length; i++) {
    try {
      await waitRandomTime();
      const test = institutions[i];

      await page.goto(
        `${BINGSEARCHQUERY}${test.name.split(" ").join("+")}+${test.cityName
          .split(" ")
          .join("+")}+reviews+indiapl.com`
      );

      await waitRandomTime();

      let html = await page.content();
      let $ = cheerio.load(html);

      let institutionUrl = $($("ol#b_results > li.b_algo h2 a")[0]).attr(
        "href"
      );

      await page.goto(institutionUrl);

      let nextPage;
      await waitRandomTime();
      do {
        if (nextPage) {
          await page.click("a#next");

          await waitRandomTime();
        }

        html = await page.content();
        $ = cheerio.load(html);

        const reviews = $("div.review");

        for (let j = 0; j < reviews.length; j++) {
          const reviewerName = $(reviews[j])
            .find(".review-name span")
            .text()
            .trim();
          const reviewText = $(reviews[j]).find(".review-text").text().trim();
          const rating = $(reviews[j]).find(".review-text .a-star").length;

          if (reviewerName.length === 0) continue;

          const oldReview = await ProcessedReview.findOne({
            reviewerName,
            reviewText,
            rating,
            domain: "indiapl.com",
            institutionID: `${test._id}`,
          });

          if (oldReview) {
            console.log("[INFO] Review already exists, Skipping...");
            continue;
          }

          const newReview = new ProcessedReview({
            reviewerName,
            reviewText,
            rating,
            domain: "indiapl.com",
            institutionID: `${test._id}`,
          });

          await newReview.save();
          console.log("[INFO] The review has been saved to the Production DB");
        }

        nextPage = $("a#next");
      } while (nextPage);
    } catch (err) {
      console.log("[ERROR INDIAPL.COM] ---> ", err);
    }
  }
};

const sulekhaReviewScraper = async (institutions, page, ProcessedReview) => {
  for (let i = 0; i < institutions.length; i++) {
    try {
      await waitRandomTime();
      const test = institutions[i];

      await page.goto(
        `${BINGSEARCHQUERY}${test.name.split(" ").join("+")}+${test.cityName
          .split(" ")
          .join("+")}+reviews+sulekha.com`
      );

      await waitRandomTime();

      let html = await page.content();
      let $ = cheerio.load(html);

      let institutionUrl = $($("ol#b_results > li.b_algo h2 a")[0]).attr(
        "href"
      );

      await page.goto(institutionUrl);

      let moreReviewButton;
      await waitRandomTime();

      do {
        if (moreReviewButton) {
          await page.evaluate(async () => {
            document.querySelector("button#moreReviewButton").click();
          });

          await waitRandomTime();
        }

        html = await page.content();
        $ = cheerio.load(html);

        const reviews = $(".all-reviews > .review-widget");
        for (let j = 0; j < reviews.length; j++) {
          const reviewerName = $(reviews[j])
            .find(".data > .title-medium")
            .text()
            .trim();
          const reviewText = $(reviews[j]).find("p").text().trim();
          const rating = $(reviews[j])
            .find(".ratings.single+b")
            .text()
            .trim()
            .replace("/5", "");

          if (reviewerName.length === 0) continue;

          const oldReview = await ProcessedReview.findOne({
            reviewerName,
            reviewText,
            rating,
            domain: "sulekha.com",
            institutionID: `${test._id}`,
          });

          if (oldReview) {
            console.log("[INFO] Review already exists, Skipping...");
            continue;
          }

          const newReview = new ProcessedReview({
            reviewerName,
            reviewText,
            rating,
            domain: "sulekha.com",
            institutionID: `${test._id}`,
          });

          await newReview.save();
          console.log("[INFO] The review has been saved to the Production DB");
        }

        // moreReviewButton = $("")
      } while (moreReviewButton);
    } catch (err) {
      console.log("[ERROR SULEKHA.COM] ---> ", err.message);
    }
  }
};

const consumerComplaintsReviewScraper = async (
  institutions,
  page,
  UnProcessedReview
) => {
  for (let i = 0; i < institutions.length; i++) {
    try {
      await waitRandomTime();
      const test = institutions[i];

      await page.goto(
        `${BINGSEARCHQUERY}${test.name.split(" ").join("+")}+${test.cityName
          .split(" ")
          .join("+")}+reviews+consumercomplaints.in`
      );

      await waitRandomTime();

      let html = await page.content();
      let $ = cheerio.load(html);

      let institutionUrl = $($("ol#b_results > li.b_algo h2 a")[0]).attr(
        "href"
      );

      await page.goto(institutionUrl);

      let nextPageUrl;
      await waitRandomTime();

      do {
        if (nextPageUrl) {
          await page.goto(nextPageUrl);

          await waitRandomTime();
        }

        html = await page.content();
        $ = cheerio.load(html);

        const reviews = $("div.complaint-box");
        for (let j = 0; j < reviews.length; j++) {
          const reviewerName = $(reviews[j])
            .find(".complaint-box__box .author-box__user b")
            .text()
            .trim();
          const reviewText = $(reviews[j])
            .find('div[itemprop="reviewBody"]')
            .text()
            .trim();

          if (reviewerName.length === 0 || reviewText.length === 0) continue;

          // console.log({
          //   reviewerName,
          //   reviewText,
          //   domain: "consumercomplaints.in",
          //   institutionID: `${test._id}`,
          // });

          const oldReview = await UnProcessedReview.findOne({
            reviewerName,
            reviewText,
            domain: "consumercomplaints.in",
            institutionID: `${test._id}`,
          });

          if (oldReview) {
            console.log("[INFO] Review already exists, Skipping...");
            continue;
          }

          const newReview = new UnProcessedReview({
            reviewerName,
            reviewText,
            domain: "consumercomplaints.in",
            institutionID: `${test._id}`,
          });

          await newReview.save();
          console.log("[INFO] The review has been saved to the Supporting DB");
        }

        nextPageUrl =
          "https://www.consumercomplaints.in" +
          `${$("a.pagination__next_active").attr("href")}`;
        await waitRandomTime();
      } while (nextPageUrl);
    } catch (err) {
      console.log("[ERROR SULEKHA.COM] ---> ", err.message);
    }
  }
};

const main = async () => {
  const {
    Institution,
    metaDataDB,
    supportingDB,
    UnProcessedReview,
    ProcessedReview,
    productionDB,
  } = await connectDB();

  console.log("[INFO] DB CONNECTED");

  const institutions = await Institution.find({
    cityName: "Dehradun",
  }); //all the data from metadata DB

  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1920,1080`],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  //*creating 7 pages
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  const page3 = await browser.newPage();
  const page4 = await browser.newPage();
  const page5 = await browser.newPage();
  const page6 = await browser.newPage();

  await Promise.all([
    sulekhaReviewScraper(institutions, page1, ProcessedReview),
    mouthShutReviewScraper(institutions, page2, ProcessedReview),
    indiaplReviewScraper(institutions, page3, ProcessedReview),
    sehatReviewScraper(institutions, page4, UnProcessedReview),
    practoReviewScraper(institutions, page5, UnProcessedReview),
    consumerComplaintsReviewScraper(institutions, page6, UnProcessedReview),
  ]);

  await browser.close();
};

main();
