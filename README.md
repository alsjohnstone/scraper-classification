# Content Classification for GA

This script scrapes the content from websites using headless-chrome-crawler, runs the content through Google's Content Classification API and then imports the results to Google Analytics using the Management API.

## Set up

1) Clone this repo locally
2) Update the config.json and upload to GCP bucket along with credentials.json
3) Update the bucket referenced in the install.sh file with your bucket
2) Make sure service account is set up with the NLP and Analytics API's enabled in GCP
3) Set up Data Import and Custom Dimension for the classification category in Google Analytics
4) Run the command below to spin up a compute instance that will automatically shutdown after the crawl is complete.

```
gcloud compute instances create scraper \
    --machine-type=n1-standard-16 \
    --metadata-from-file=startup-script=./install.sh \
    --scopes=cloud-platform \
    --zone=europe-west2-c
    ```