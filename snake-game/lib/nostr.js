nostr.js

import { relayInit, generatePrivateKey, getPublicKey } from 'nostr-tools';

export function getUserKeypair() {
  return JSON.parse(localStorage.getItem('snakeKeypair')) || null;
}

export async function loginWithNostr() {
  if (window.nostr) {
    const pubkey = await window.nostr.getPublicKey();
    const privkey = await window.nostr.signEvent({ kind: 0, content: '' });
    const keypair = { pubkey, privkey: privkey.sk };
    localStorage.setItem('snakeKeypair', JSON.stringify(keypair));
    await publishProfile(keypair);
    return keypair;
  }
}

export async function loginAsGuest() {
  const privkey = generatePrivateKey();
  const pubkey = getPublicKey(privkey);
  const keypair = { pubkey, privkey };
  localStorage.setItem('snakeKeypair', JSON.stringify(keypair));
  await publishProfile(keypair);
  return keypair;
}

async function publishProfile(keypair) {
  const relay = relayInit(process.env.NEXT_PUBLIC_NOSTR_RELAY);
  await relay.connect();
  await relay.publish({
    kind: 0,
    content: JSON.stringify({ picture: 'https://via.placeholder.com/40', name: 'Guest' }),
    pubkey: keypair.pubkey,
    created_at: Math.floor(Date.now() / 1000),
  });
  relay.close();
}

export async function getProfile(pubkey) {
  const relay = relayInit(process.env.NEXT_PUBLIC_NOSTR_RELAY);
  await relay.connect();
  return new Promise((resolve) => {
    const sub = relay.sub([{ kinds: [0], authors: [pubkey] }]);
    sub.on('event', (event) => {
      resolve(JSON.parse(event.content));
      relay.close();
    });
  });
}