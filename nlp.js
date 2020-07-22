async function quickstart() {
  // Imports the Google Cloud client library
  const language = require("@google-cloud/language");

  const client = new language.LanguageServiceClient({
    projectId: "sentiment-analysis-2020",
    keyFilename: "./credentials.json",
  });

  // The text to analyze
  const text = "Snowboarding";

  // Prepares a document, representing the provided text
  const document = {
    content: text,
    type: "PLAIN_TEXT",
  };

  // Classifies text in the document
  const [classification] = await client.classifyText({ document });
  classification.categories.forEach((category) => {
    console.log(`Name: ${category.name}, Confidence: ${category.confidence}`);
  });
}

quickstart();
