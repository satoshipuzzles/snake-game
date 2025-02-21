invoice.js

import { createInvoice } from '../../lib/lnbits';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount } = req.body;
    const invoice = await createInvoice(amount, process.env.LNBITS_API_KEY, process.env.LNBITS_URL);
    res.status(200).json(invoice);
  }
}