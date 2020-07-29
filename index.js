const HCCrawler = require("headless-chrome-crawler");
const { google } = require("googleapis");
const scopes = "https://www.googleapis.com/auth/analytics";
const credentials = "./credentials.json";
const key = require("./credentials.json");
const config = require("./config.json");

var pagesCrawled = 0;

const jwt = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  scopes
);

var pageCount = 0;

// NLP results for GA Data Import
const nlpResults = [config.dataImportSchema];

// Upload classification data to Google Analytics
const uploadData = async () => {
  const response = await jwt.authorize();
  const result = await google.analytics("v3").management.uploads.uploadData({
    auth: jwt,
    accountId: config.accountId,
    webPropertyId: config.webPropertyId,
    customDataSourceId: config.customDataSourceId,
    params: { uploadType: "media" },
    headers: {
      "Content-Type": "application/octet-stream",
    },
    media: {
      body: [...new Set(nlpResults)].join("\n"),
      MimeType: "application/octet-stream",
    },
  });
  if (result.status == 200) {
    console.log("Classifications uploaded to GA");
  }
};

// Run the page text through classification API
const returnCategories = async (result) => {
  pagesCrawled++;
  try {
    if (!result.result.pagePath.includes("our-blog")) {
      const language = require("@google-cloud/language");
      const client = new language.LanguageServiceClient({
        projectId: "sentiment-analysis-2020",
        keyFilename: credentials,
      });
      // Page text content
      const text = result.result.text;
      // Prepares a document, representing the provided text
      const document = {
        content: text,
        type: "PLAIN_TEXT",
      };
      // Classifies text in the document
      const [classification] = await client.classifyText({ document });
      pageCount++;
      // Add to nlpResults array, used to GA import
      nlpResults.push([
        result.result.pagePath,
        classification.categories[0].name.split("/")[1],
        classification.categories[0].name.split("/")[2],
        classification.categories[0].name.split("/")[3],
      ]);
      console.log(`${pageCount}) Page Path: ${result.result.pagePath}`);
      console.log(`   Category: ${classification.categories[0].name}`);
    }
  } catch (error) {
    console.log(`!! Page Path: ${result.result.pagePath}`);
    console.log("   NO CATEGORY FOUND");
  }
};

(async () => {
  const crawler = await HCCrawler.launch({
    args: ["--no-sandbox"],
    maxConcurrency: 50,
    maxDepth: 9999999,
    allowedDomains: config.allowedDomains,
    // Function to be evaluated in browsers
    evaluatePage: () => ({
      pagePath: window.location.pathname,
      text: Array.from(document.querySelectorAll("h1, h2, p"))
        .map((x) => x.innerText)
        .join(" ")
        .replace(/\s\s+/g, " ")
        .replace(/(\r\n|\n|\r)/gm, " "),
    }),
    // Function to be called with evaluated results from browsers
    onSuccess: returnCategories,
  });
  // Queue a request
  console.log("Crawl started");
  await crawler.queue(config.startUrl);
  await crawler.onIdle(); // Resolved when no queue is left
  await crawler.close(); // Close the crawler
  // Upload NLP data to GA when crawl is complete
  console.log(
    `Crawl complete. ${pagesCrawled} pages crawled. ${pageCount} pages successfully classified`
  );
  uploadData();
})();
