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
// ── Configuration ──────────────────────────────────────────────
var OFFICE_EMAIL = 'cindykne@aol.com';  // Primary recipient
var CC_EMAILS    = 'bhinrichs1380@gmail.com';  // Optional: comma-separated CC addresses (leave empty for none)
var LOGO_URL     = 'https://www.specializedoutpatientservices.com/images/SOSlogo.png';
var SITE_URL     = 'https://www.specializedoutpatientservices.com';

// ── Main Handler ───────────────────────────────────────────────
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet;

  if (data.formType === 'referral') {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Referrals');

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

    // Send branded email
    sendBrandedEmail('referral', data);

  } else if (data.formType === 'contact') {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Contact Messages');

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

    // Send branded email
    sendBrandedEmail('contact', data);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Branded Email Sender ───────────────────────────────────────
function sendBrandedEmail(type, data) {
  var subject, bodyRows;
  var timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

  if (type === 'referral') {
    subject = 'New Referral Submission — S.O.S. Counseling';
    bodyRows = [
      { section: 'Referral Information', fields: [
        { label: 'Date', value: data['Date'] },
        { label: 'Referral Source', value: data['Referral Source'] },
        { label: 'Referral Phone', value: data['Referral Phone'] },
        { label: 'Referral Fax', value: data['Referral Fax'] },
        { label: 'Referral Address', value: data['Referral Address'] }
      ]},
      { section: 'Client Information', fields: [
        { label: 'Client Name', value: data['Client Name'] },
        { label: 'Client Address', value: data['Client Address'] },
        { label: 'Date of Birth', value: data['Client DOB'] },
        { label: 'Age', value: data['Age'] },
        { label: 'Gender', value: data['Gender'] },
        { label: 'Residing With', value: data['Residing With'] },
        { label: 'Residence Address', value: data['Client Residence Address'] },
        { label: 'Contact Number', value: data['Contact Number'] }
      ]},
      { section: 'Service Information', fields: [
        { label: 'Services Requested', value: data['Services Requested'] },
        { label: 'Presenting Concerns', value: data['Presenting Concerns'] },
        { label: 'Diagnosis', value: data['Diagnosis'] },
        { label: 'Preferred Therapist', value: data['Therapist'] },
        { label: 'Service Location', value: data['Service Location'] },
        { label: 'Other Location', value: data['Other Location'] }
      ]},
      { section: 'Insurance / Payment', fields: [
        { label: 'Insurance Type', value: data['Insurance Type'] },
        { label: 'Policy Number', value: data['Policy Number'] },
        { label: 'Group Number', value: data['Group Number'] },
        { label: 'Insurance Phone', value: data['Insurance Phone'] }
      ]}
    ];
  } else {
    subject = 'New Contact Message — S.O.S. Counseling';
    bodyRows = [
      { section: 'Contact Details', fields: [
        { label: 'Name', value: data['name'] },
        { label: 'Email', value: data['email'] },
        { label: 'Phone', value: data['phone'] },
        { label: 'Service Interest', value: data['service'] },
        { label: 'Message', value: data['message'] }
      ]}
    ];
  }

  // Build HTML sections
  var sectionsHtml = '';
  bodyRows.forEach(function(section) {
    sectionsHtml += '<tr><td style="padding:20px 30px 8px 30px;">'
      + '<h2 style="margin:0;font-size:16px;color:#8B1A1A;border-bottom:2px solid #D4A574;padding-bottom:6px;">'
      + section.section + '</h2></td></tr>';

    section.fields.forEach(function(field) {
      var val = field.value || '—';
      sectionsHtml += '<tr><td style="padding:4px 30px;">'
        + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
        + '<td width="40%" style="padding:6px 0;font-size:14px;color:#5C4033;font-weight:600;">' + field.label + '</td>'
        + '<td width="60%" style="padding:6px 0;font-size:14px;color:#333333;">' + escapeHtml(val) + '</td>'
        + '</tr></table></td></tr>';
    });
  });

  var html = '<!DOCTYPE html>'
    + '<html><head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:0;background-color:#F5EFED;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EFED;padding:20px 0;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">'

    // Header
    + '<tr><td style="background-color:#8B1A1A;padding:24px 30px;text-align:center;">'
    + '<img src="' + LOGO_URL + '" alt="S.O.S. Counseling" width="160" style="display:block;margin:0 auto 10px auto;">'
    + '<p style="margin:0;color:#D4A574;font-size:13px;letter-spacing:1px;">SPECIALIZED OUTPATIENT SERVICES</p>'
    + '</td></tr>'

    // Badge
    + '<tr><td style="padding:20px 30px 0 30px;text-align:center;">'
    + '<span style="display:inline-block;background-color:' + (type === 'referral' ? '#8B1A1A' : '#5C4033') + ';color:#FFFFFF;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">'
    + (type === 'referral' ? 'NEW REFERRAL' : 'NEW CONTACT MESSAGE') + '</span>'
    + '<p style="margin:8px 0 0 0;font-size:13px;color:#999999;">Received ' + timestamp + '</p>'
    + '</td></tr>'

    // Sections
    + sectionsHtml

    // Footer
    + '<tr><td style="padding:24px 30px;margin-top:20px;border-top:1px solid #E0D5D0;text-align:center;">'
    + '<p style="margin:0 0 4px 0;font-size:13px;color:#8B1A1A;font-weight:600;">S.O.S. Counseling</p>'
    + '<p style="margin:0 0 4px 0;font-size:12px;color:#999999;">Grand Island, NE &bull; (308) 856-9949</p>'
    + '<p style="margin:0;font-size:12px;"><a href="' + SITE_URL + '" style="color:#8B1A1A;text-decoration:none;">' + SITE_URL + '</a></p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  var mailOptions = {
    to: OFFICE_EMAIL,
    subject: subject,
    htmlBody: html
  };

  if (CC_EMAILS) {
    mailOptions.cc = CC_EMAILS;
  }

  MailApp.sendEmail(mailOptions);
}

// ── HTML Escaping Helper ───────────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
