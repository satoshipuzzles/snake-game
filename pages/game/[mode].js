import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import GameCanvas from '../../components/GameCanvas';
import { loginWithNostr, loginAsGuest, getUserKeypair } from '../../lib/nostr';

const Game = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // ✅ Ensures this runs only on the client
  }, []);

  useEffect(() => {
    if (!isClient) return; // ✅ Ensures SSR never runs this code
    if (typeof window === "undefined") return; // ✅ Double-checks it's client-side

    if (router.query.mode) {
      setMode(router.query.mode);
    }

    async function init() {
      try {
        let keypair = getUserKeypair();
        if (!keypair) {
          if (window.nostr) {
            await loginWithNostr();
          } else {
            await loginAsGuest();
          }
          keypair = getUserKeypair();
        }
        setUser(keypair);
      } catch (error) {
        console.error("Error initializing Nostr:", error);
      }
    }
    init();
  }, [router.query.mode, isClient]);

  if (!isClient || !mode || !user) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>{mode.charAt(0).toUpperCase() + mode.slice(1)} Snake</h1>
        <button onClick={() => router.push('/settings')}>Settings</button>
      </div>
      <GameCanvas mode={mode} user={user} />
      <button onClick={() => router.push('/')}>Back to Home</button>
    </div>
  );
};

// ✅ Completely disables SSR
export default dynamic(() => Promise.resolve(Game), { ssr: false });
