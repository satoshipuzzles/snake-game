Profile.js

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getProfile, getUserKeypair } from '../lib/nostr';

export default function Profile() {
  const router = useRouter();
  const [pic, setPic] = useState('https://via.placeholder.com/40');

  useEffect(() => {
    async function load() {
      const keypair = getUserKeypair();
      const profile = await getProfile(keypair.pubkey);
      setPic(profile?.picture || 'https://via.placeholder.com/40');
    }
    load();
  }, []);

  return (
    <img
      src={pic}
      alt="Profile"
      className="profile-pic"
      onClick={() => router.push('/settings')}
    />
  );
}