turn.js

import { relayInit } from 'nostr-tools';

export default async function handler(req, res) {
  const relay = relayInit(process.env.NOSTR_RELAY);
  await relay.connect();

  if (req.method === 'POST') {
    const { move, position, pubkey } = req.body;
    await relay.publish({
      kind: 30000,
      content: JSON.stringify({ move, position }),
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', 'some-opponent-pubkey']],
    });
    relay.close();
    res.status(200).json({ success: true });
  }
}