settings.js

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getUserKeypair, getProfile } from '../lib/nostr';
import WalletConnect from '../components/WalletConnect';
import axios from 'axios';
import QRCode from 'qrcode';

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [snakes, setSnakes] = useState(JSON.parse(localStorage.getItem('unlockedSnakes')) || ['default']);

  useEffect(() => {
    async function load() {
      const keypair = getUserKeypair();
      const prof = await getProfile(keypair.pubkey);
      setProfile(prof);
      setWalletConnected(!!localStorage.getItem('walletLnurl'));
    }
    load();
  }, []);

  const createInvoice = async () => {
    const res = await axios.post('/api/invoice', { amount: 100 });
    setInvoice(res.data.payment_request);
    const qr = await QRCode.toDataURL(res.data.payment_request);
    setQrCode(qr);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Settings</h1>
      </div>
      <div>
        <h2>Bitcoin Connect</h2>
        <WalletConnect onConnect={() => setWalletConnected(true)} />
        <p>{walletConnected ? 'Wallet Connected' : 'Not Connected'}</p>
      </div>
      <div>
        <h2>Create Invoice (LNBits)</h2>
        <button onClick={createInvoice}>Generate 100 sat Invoice</button>
        {invoice && (
          <>
            <p>{invoice}</p>
            {qrCode && <img src={qrCode} alt="Invoice QR" className="qr-code" />}
          </>
        )}
      </div>
      <div>
        <h2>Profile</h2>
        <pre>{profile ? JSON.stringify(profile, null, 2) : 'Loading...'}</pre>
      </div>
      <div>
        <h2>Snake Skins</h2>
        <div className="snake-list">
          {['default', 'blue', 'red', 'green', 'purple'].map(skin => (
            <div key={skin} className="snake-item">
              {skin} - {snakes.includes(skin) ? 'Unlocked' : 'Locked'}
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => router.push('/')}>Back</button>
    </div>
  );
}