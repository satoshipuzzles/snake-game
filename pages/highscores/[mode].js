[mode].js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HighScores() {
  const router = useRouter();
  const { mode } = router.query;
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (mode) {
      axios.get(`/api/highscores?mode=${mode}`).then(res => setScores(res.data));
    }
  }, [mode]);

  return (
    <div className="container">
      <h1>{mode ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} High Scores` : 'High Scores'}</h1>
      <div>
        {scores.map(({ pubkey, score }) => (
          <p key={pubkey}>{pubkey.slice(0, 8)}...: {score}</p>
        ))}
      </div>
      <button onClick={() => router.push('/')}>Back</button>
    </div>
  );
}