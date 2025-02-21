import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import GameCanvas from '../../components/GameCanvas';
import { loginWithNostr, loginAsGuest, getUserKeypair } from '../../lib/nostr';

export default function Game() {
  const router = useRouter();
  const { mode } = router.query;
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function init() {
      if (typeof window !== "undefined") { // ✅ Prevents server-side errors
        let keypair = getUserKeypair();
        if (!keypair) {
          if (window.nostr) await loginWithNostr();
          else await loginAsGuest();
          keypair = getUserKeypair();
        }
        setUser(keypair);
      }
    }
    init();
  }, []);

  if (!mode || !user) return <div>Loading...</div>;

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
}
