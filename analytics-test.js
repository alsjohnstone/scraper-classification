const { google } = require("googleapis");
const fs = require("fs");
const scopes = "https://www.googleapis.com/auth/analytics";
const key = require("./credentials.json");
const jwt = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  scopes
);

const csvPath = "./ga.csv";

const view_id = "219875047";

const nlpResults = [
  ["ga:pagePath", "ga:dimension1"],
  ["/test", "Test Category"],
];

async function getData() {
  const response = await jwt.authorize();
  const result = await google.analytics("v3").management.uploads.uploadData({
    auth: jwt,
    accountId: "70159337",
    webPropertyId: "UA-70159337-11",
    customDataSourceId: "KXn6RjwHTSyYa8Mf5OrdYQ",
    params: { uploadType: "media" },
    headers: {
      "Content-Type": "application/octet-stream",
    },
    media: {
      body: nlpResults.join("\n"),
      MimeType: "application/octet-stream",
    },
  });

  console.dir(result);
}

getData();
