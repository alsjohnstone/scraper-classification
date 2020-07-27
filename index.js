const HCCrawler = require("headless-chrome-crawler");
const { google } = require("googleapis");
const scopes = "https://www.googleapis.com/auth/analytics";
const credentials = "./credentials.json";
const key = require("./credentials.json");
const config = require("./config.json");

const jwt = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  scopes
);

let pageCount = 1;

// NLP results for GA Data Import
const nlpResults = [config.dataImportSchema];

// Upload classification data to Google Analytics
async function uploadData() {
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
      body: nlpResults.join("\n"),
      MimeType: "application/octet-stream",
    },
  });
  if (result.status == 200) {
    console.log("Classifications uploaded to GA");
  }
}

// Run the page text through classification API
async function returnCategories(result) {
  try {
    if (result.result.pagePath.includes("our-blog")) {
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
      // Add to nlpResults array, used to GA import
      nlpResults.push([
        result.result.pagePath,
        classification.categories[0].name,
      ]);
      console.log(pageCount + ") Page Path: " + result.result.pagePath);
      console.log("   Category: " + classification.categories[0].name);
      pageCount++;
    }
  } catch (error) {
    console.log("No categories for this page");
    console.error(error);
  }
}

(async () => {
  const crawler = await HCCrawler.launch({
    maxDepth: 9999,
    allowedDomains: config.allowedDomains, // www.naturesbest.co.uk
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
  await crawler.queue(config.startUrl); // https://www.naturesbest.co.uk
  await crawler.onIdle(); // Resolved when no queue is left
  await crawler.close(); // Close the crawler
  // Upload CSV to GA when crawl is complete
  console.log("Crawl complete");
  uploadData();
})();
