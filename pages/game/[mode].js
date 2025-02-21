import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('../../components/GameCanvas'), { ssr: false });
const loginWithNostr = async () => {};
const loginAsGuest = async () => {};
const getUserKeypair = () => null;

const Game = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // ✅ Ensures this runs ONLY on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === "undefined") return; // ✅ Prevent SSR execution

    const queryMode = router.query.mode;
    if (queryMode) setMode(queryMode);

    async function init() {
      try {
        let keypair = getUserKeypair();
        if (!keypair) {
          if (typeof window !== "undefined" && window.nostr) {
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

// ✅ 100% Blocks Server-Side Rendering (SSR)
export default dynamic(() => Promise.resolve(Game), { ssr: false });
