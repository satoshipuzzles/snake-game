WalletConnect.js

import { useState } from 'react';

export default function WalletConnect({ onConnect }) {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      const lnurl = prompt('Enter your LNURL (mock for now):');
      if (lnurl) {
        localStorage.setItem('walletLnurl', lnurl);
        onConnect();
      }
    } catch (error) {
      console.error('Wallet connect failed:', error);
    }
    setConnecting(false);
  };

  return (
    <button onClick={connectWallet} disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect Lightning Wallet'}
    </button>
  );
}