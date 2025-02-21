highscores.js

import { relayInit } from 'nostr-tools';

export default async function handler(req, res) {
  const relay = relayInit(process.env.NOSTR_RELAY);
  await relay.connect();

  if (req.method === 'GET') {
    const { mode } = req.query;
    const scores = [];
    const sub = relay.sub([{ kinds: [1], '#mode': [mode] }]);
    sub.on('event', (event) => {
      const { score } = JSON.parse(event.content);
      scores.push({ pubkey: event.pubkey, score });
    });
    sub.on('eose', () => {
      relay.close();
      res.status(200).json(scores.sort((a, b) => b.score - a.score));
    });
  } else if (req.method === 'POST') {
    const { mode, score, pubkey } = req.body;
    await relay.publish({
      kind: 1,
      content: JSON.stringify({ mode, score }),
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['mode', mode]],
    });
    relay.close();
    res.status(200).json({ success: true });
  }
}