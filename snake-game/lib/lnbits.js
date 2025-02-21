lnbits.js

import axios from 'axios';

export async function createInvoice(amount, apiKey, url) {
  const res = await axios.post(
    `${url}/api/v1/payments`,
    { amount, out: false, description: 'Snake Game Invoice' },
    { headers: { 'X-Api-Key': apiKey } }
  );
  return res.data;
}