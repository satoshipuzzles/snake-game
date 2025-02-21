import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import QRCode from 'qrcode';

// ✅ Lazy load WalletConnect to prevent SSR issues
const WalletConnect = dynamic(() => import('../components/WalletConnect'), { ssr: false });

const Settings = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [snakes, setSnakes] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ Prevents SSR execution

    async function load() {
      try {
        const { getUserKeypair, getProfile } = await import('../lib/nostr'); // ✅ Lazy import

        let keypair = getUserKeypair();
        if (!keypair) {
          console.warn("No keypair found, defaulting to guest");
          keypair = { pubkey: "Guest" }; // ✅ Prevents null errors
        }

        const prof = await getProfile(keypair.pubkey);
        setProfile(prof);

        setWalletConnected(!!localStorage.getItem('walletLnurl'));
        setSnakes(JSON.parse(localStorage.getItem('unlockedSnakes')) || ['default']);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    }

    load();
  }, []);

  const createInvoice = async () => {
    try {
      const res = await axios.post('/api/invoice', { amount: 100 });
      setInvoice(res.data.payment_request);
      const qr = await QRCode.toDataURL(res.data.payment_request);
      setQrCode(qr);
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  return (
    <div className="container dark-theme"> {/* ✅ Dark theme applied */}
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
};

// ✅ Fully disable SSR for this page
export default dynamic(() => Promise.resolve(Settings), { ssr: false });
