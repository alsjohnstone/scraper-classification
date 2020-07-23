# Content Classification for GA

This script scrapes the content from websites using headless-chrome-crawler, runs the content through Google's Content Classification API and then imports the results to Google Analytics using the Management API.

## Set up

1) Update website and CSS selector settings in HCC
2) Make sure service account is set up with the NLP and Analytics API's enabled in GCP.
3) Set up Data Import and Custom Dimension for the classification category in Google Analytics.
