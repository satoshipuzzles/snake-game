import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const HighScores = () => {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return; // Prevent SSR

    if (router.query.mode) {
      setMode(router.query.mode);
    }
  }, [router.query.mode]);

  useEffect(() => {
    if (mode) {
      axios.get(`/api/highscores?mode=${mode}`)
        .then(res => setScores(res.data))
        .catch(err => console.error("Failed to fetch scores:", err));
    }
  }, [mode]);

  return (
    <div className="container">
      <h1>{mode ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} High Scores` : 'High Scores'}</h1>
      <div>
        {scores.length > 0 ? (
          scores.map(({ pubkey, score }) => (
            <p key={pubkey}>{pubkey.slice(0, 8)}...: {score}</p>
          ))
        ) : (
          <p>Loading or no scores available...</p>
        )}
      </div>
      <button onClick={() => router.push('/')}>Back</button>
    </div>
  );
};

// ✅ Fully disables server-side rendering (SSR)
export default dynamic(() => Promise.resolve(HighScores), { ssr: false });
