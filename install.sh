#!/usr/bin/env bash

config='gs://scraper-config/config.json'
credentials='gs://scraper-config/credentials.json'

set -v

apt-get update
apt-get install -y chromium
apt-get install -y libgbm-dev

curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -yq git libgconf-2-4 nodejs

git clone https://github.com/alsjohnstone/scraper-classification.git

cd scraper-classification
sudo npm install
gsutil cp ${config} .
gsutil cp ${credentials} .
node index.js

shutdown -h now