const HCCrawler = require("headless-chrome-crawler");
const { google } = require("googleapis");
const scopes = "https://www.googleapis.com/auth/analytics";
const credentials = "./credentials.json";
const key = require("./credentials.json");

const jwt = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  scopes
);

// NLP results for GA Data Import
const nlpResults = [["ga:pagePath", "ga:dimension1"]];

// Upload classification data to Google Analytics
async function uploadData() {
  const response = await jwt.authorize();
  const result = await google.analytics("v3").management.uploads.uploadData({
    auth: jwt,
    accountId: "70159337",
    webPropertyId: "UA-70159337-7",
    customDataSourceId: "z0hPigyXRvm-x2BCWXv15g",
    params: { uploadType: "media" },
    headers: {
      "Content-Type": "application/octet-stream",
    },
    media: {
      body: nlpResults.join("\n"),
      MimeType: "application/octet-stream",
    },
  });
  console.log(result);
}

// Run the page text through classification API
async function returnCategories(result) {
  if (!result.result.pagePath.includes("contact")) {
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
  }
}

(async () => {
  const crawler = await HCCrawler.launch({
    maxDepth: 9999,
    allowedDomains: ["alsjohnstone.com"], // www.naturesbest.co.uk
    // Function to be evaluated in browsers
    evaluatePage: () => ({
      pagePath: window.location.href.replace("https://alsjohnstone.com", ""),
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
  await crawler.queue("https://alsjohnstone.com"); // https://www.naturesbest.co.uk
  await crawler.onIdle(); // Resolved when no queue is left
  await crawler.close(); // Close the crawler
  // Upload CSV to GA when crawl is complete
  uploadData();
})();
