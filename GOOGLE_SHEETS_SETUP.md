# Google Sheets Integration — Setup Guide

This connects the website's contact form and referral form to a Google Sheet so every submission is logged automatically.

## Step 1: Create the Google Sheet

1. Go to https://sheets.google.com and create a new spreadsheet
2. Name it something like **"S.O.S. Counseling — Form Submissions"**
3. Rename the first tab (bottom of screen) to **Referrals**
4. Add a second tab and name it **Contact Messages**

## Step 2: Add the Apps Script

1. In the spreadsheet, go to **Extensions > Apps Script**
2. Delete any code in the editor
3. Paste the following script:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet;

  if (data.formType === 'referral') {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Referrals');

    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Date', 'Client Name', 'Client Address',
        'Referral Source', 'Referral Phone', 'Referral Fax', 'Referral Address',
        'Client DOB', 'Age', 'Gender', 'Residing With',
        'Client Residence Address', 'Contact Number',
        'Services Requested', 'Presenting Concerns', 'Diagnosis', 'Therapist',
        'Service Location', 'Other Location',
        'Insurance Type', 'Policy Number', 'Group Number', 'Insurance Phone'
      ]);
    }

    sheet.appendRow([
      new Date(),
      data['Date'] || '',
      data['Client Name'] || '',
      data['Client Address'] || '',
      data['Referral Source'] || '',
      data['Referral Phone'] || '',
      data['Referral Fax'] || '',
      data['Referral Address'] || '',
      data['Client DOB'] || '',
      data['Age'] || '',
      data['Gender'] || '',
      data['Residing With'] || '',
      data['Client Residence Address'] || '',
      data['Contact Number'] || '',
      data['Services Requested'] || '',
      data['Presenting Concerns'] || '',
      data['Diagnosis'] || '',
      data['Therapist'] || '',
      data['Service Location'] || '',
      data['Other Location'] || '',
      data['Insurance Type'] || '',
      data['Policy Number'] || '',
      data['Group Number'] || '',
      data['Insurance Phone'] || ''
    ]);

  } else if (data.formType === 'contact') {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Contact Messages');

    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Full Name', 'Email', 'Phone', 'Service Interest', 'Message'
      ]);
    }

    sheet.appendRow([
      new Date(),
      data['name'] || '',
      data['email'] || '',
      data['phone'] || '',
      data['service'] || '',
      data['message'] || ''
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Save** (Ctrl+S)

## Step 3: Deploy as a Web App

1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set:
   - **Description**: Form submissions
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Authorize the app when prompted (click through the "unsafe" warning — it's your own script)
6. **Copy the Web App URL** — it will look like:
   `https://script.google.com/macros/s/ABCDEF.../exec`

## Step 4: Paste the URL into the Website Code

Open **referral.js** and **script.js** and replace the placeholder URL:

```
const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_SHEETS_URL_HERE';
```

Replace `YOUR_GOOGLE_SHEETS_URL_HERE` with the Web App URL you copied.

## Done!

Every form submission will now:
1. Send an email via Web3Forms
2. Log a row in the Google Sheet

The Google Sheet will auto-create headers on the first submission.
