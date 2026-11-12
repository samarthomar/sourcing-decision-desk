# Sourcing Decision Desk

A clickable proof-of-concept demo by Tech Mahindra, prepared for Carhartt.
Five AI agents check a supplier quote against its should-cost and landed cost, score each supplier's record, and recommend a supplier with a negotiation brief. The buyer approves every decision.

All supplier names, prices and performance figures are sample data created for this demo.

## Run it

Open `index.html` in a browser. No install or server is needed.

## Edit it

1. Change `src.html`.
2. Run `python build.py`. It inlines the logo from `assets/` and writes `index.html` and `sourcing-decision-desk.html`.

## Host it on AWS

The app is one static file (`index.html`) with no backend, database or API keys. It only loads the Georama font from Google Fonts.

**Option A: AWS Amplify Hosting (easiest)**
1. Open AWS Amplify, choose **Create new app**, then **Deploy without Git**.
2. Upload a zip that contains `index.html` at its top level, or drag in `index.html` itself.
3. Amplify gives a public `*.amplifyapp.com` link.

**Option B: Amazon S3 + CloudFront**
1. Create an S3 bucket and upload `index.html`.
2. Create a CloudFront distribution with the bucket as its origin (Origin Access Control) and set the default root object to `index.html`.
3. Share the CloudFront link.
