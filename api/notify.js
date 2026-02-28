// api/notify.js — Vercel serverless function
// Sends an SMS via Twilio when a contact form is submitted.
// Credentials are read from environment variables — never hardcoded.

// Route each service option to the right recipient phone number.
// Update these numbers to match each person's SMS-capable cell phone.
const SERVICE_ROUTING = {
  youth:   { name: 'Cindy Kissack',    to: process.env.SMS_CINDY   || process.env.SMS_OFFICE },
  trauma:  { name: 'Cindy Kissack',    to: process.env.SMS_CINDY   || process.env.SMS_OFFICE },
  family:  { name: 'Jenna Davis',      to: process.env.SMS_JENNA   || process.env.SMS_OFFICE },
  adult:   { name: 'Jenna Davis',      to: process.env.SMS_JENNA   || process.env.SMS_OFFICE },
  cta:     { name: 'Brandon Hinrichs', to: process.env.SMS_BRANDON || process.env.SMS_OFFICE },
  other:   { name: 'Office',           to: process.env.SMS_OFFICE },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, service, message } = req.body || {};

  if (!name) return res.status(400).json({ error: 'Missing name' });

  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = process.env.TWILIO_FROM_NUMBER;
  const officeNumber = process.env.SMS_OFFICE;

  if (!accountSid || !authToken || !fromNumber || !officeNumber) {
    console.error('Missing Twilio environment variables');
    return res.status(500).json({ error: 'SMS service not configured' });
  }

  // Determine recipient based on service selection
  const route = SERVICE_ROUTING[service] || { name: 'Office', to: officeNumber };
  const toNumber = route.to;

  if (!toNumber) {
    console.error('No destination number for service:', service);
    return res.status(500).json({ error: 'No destination number configured' });
  }

  // Build the SMS body
  const serviceLabel = {
    youth:  'Youth & Adolescent Counseling',
    family: 'Family Therapy',
    adult:  'Adult Individual Therapy',
    trauma: 'Trauma & PTSD Treatment',
    cta:    'Community Treatment Aide',
    other:  'Other',
  }[service] || 'Not specified';

  const smsBody = [
    `📋 New Contact — S.O.S. Counseling`,
    `Name: ${name}`,
    phone  ? `Phone: ${phone}`   : null,
    `Email: ${email}`,
    `Service: ${serviceLabel}`,
    message ? `Message: ${message}` : null,
  ].filter(Boolean).join('\n');

  // Twilio Messages API — plain fetch, no SDK needed
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To:   toNumber,
        From: fromNumber,
        Body: smsBody,
      }).toString(),
    });

    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      console.error('Twilio error:', errText);
      return res.status(502).json({ error: 'SMS delivery failed' });
    }

    return res.status(200).json({ ok: true, sentTo: route.name });
  } catch (err) {
    console.error('Notify handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
