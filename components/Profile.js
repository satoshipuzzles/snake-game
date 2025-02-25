import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getProfile, getUserKeypair, loginWithNostr } from '../lib/nostr';

export default function Profile() {
  const router = useRouter();
  const [pic, setPic] = useState('https://via.placeholder.com/40');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        let keypair = getUserKeypair();
        
        if (!keypair) {
          keypair = await loginWithNostr();
          if (!keypair) {
            throw new Error('Failed to connect to Nostr');
          }
        }

        const profile = await getProfile(keypair.pubkey);
        setPic(profile?.picture || 'https://via.placeholder.com/40');
      } catch (err) {
        console.error('Profile loading error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (isLoading) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <img
        src={pic}
        alt="Profile"
        className="profile-pic"
        onClick={() => router.push('/settings')}
      />
      {error && (
        <div className="profile-error" title={error}>
          ⚠️
        </div>
      )}
    </div>
  );
}