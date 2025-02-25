import { relayInit } from 'nostr-tools';

const relayUrl = 'wss://relay.nostrfreaks.com';

export async function connectToRelay() {
  const relay = relayInit(relayUrl);
  await relay.connect();
  return relay;
}

export async function publishEvent(relay, event) {
  await relay.publish(event);
}

export function subscribe(relay, filters, callback) {
  const sub = relay.sub(filters);
  sub.on('event', callback);
  return sub;
}
