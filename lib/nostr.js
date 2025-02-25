export function getUserKeypair() {
  try {
    const stored = localStorage.getItem('snakeKeypair');
    if (!stored) {
      console.log('No keypair found, defaulting to guest');
      return null;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error reading keypair:', err);
    return null;
  }
}

export async function loginWithNostr() {
  try {
    if (!window.nostr) {
      throw new Error('Nostr extension not found');
    }

    const pubkey = await window.nostr.getPublicKey();
    if (!pubkey) {
      throw new Error('Failed to get public key');
    }

    const keypair = { pubkey };
    localStorage.setItem('snakeKeypair', JSON.stringify(keypair));
    
    return keypair;
  } catch (err) {
    console.error('Nostr login failed:', err);
    return null;
  }
}

export async function getProfile(pubkey) {
  if (!pubkey) {
    throw new Error('Public key required');
  }
  
  try {
    // Implementation depends on your relay setup
    // This is a placeholder - you'll need to implement the actual relay connection
    return null;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}