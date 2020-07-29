# Content Classification for GA

This app scrapes the content from websites using headless-chrome-crawler, runs the content through Google's Content Classification API and then imports the results to Google Analytics using the Management API.

## Set up
1) Create three custom dimensions in GA for `Primary Category`, `Subcategory` and `Secondary Subcategory`
2) Set up a Data Import in GA with the type "Content". For the data set schema: "Key" should be set to `Page` and "Imported Data" should be set to the three new custom dimensions
1) Clone this repo `git clone https://github.com/alsjohnstone/scraper-classification.git`
2) Create a GCP project, enable NLP API and Analytics API
3) Create service worker account and download the credentials.json file
4) update the config.json file
5) Create a new GCP storage bucket and add your config.json and credentials.json files
6) Update the bucket referenced in the install.sh file with your bucket
7) Run the command below to spin up a new GCP Compute Instance that will automatically shutdown after the crawl is complete.

```
gcloud compute instances create scraper \
    --machine-type=n1-standard-16 \
    --metadata-from-file=startup-script=./install.sh \
    --scopes=cloud-platform \
    --zone=europe-west2-c
    ```

Restarting the GCP Compute Instance will automatically scrape, classify and upload the results to GA. You could also schedule crawls using Cloud Scheduler.