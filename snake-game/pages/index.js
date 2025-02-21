index.js

import { useRouter } from 'next/router';
import Profile from '../components/Profile';

export default function Home() {
  const router = useRouter();

  const gameModes = [
    { mode: 'classic', title: 'Classic Nokia Snake', img: 'https://via.placeholder.com/150?text=Classic+Snake' },
    { mode: 'turn-based', title: 'Turn-Based Snake', img: 'https://via.placeholder.com/150?text=Turn+Based' },
    { mode: 'multiplayer', title: 'Multiplayer Snake', img: 'https://via.placeholder.com/150?text=Multiplayer' },
  ];

  return (
    <div className="container">
      <div className="header">
        <h1>Ultimate Snake</h1>
        <Profile />
      </div>
      {gameModes.map(({ mode, title, img }) => (
        <div key={mode} className="card" onClick={() => router.push(`/game/${mode}`)}>
          <img src={img} alt={title} />
          <h2>{title}</h2>
        </div>
      ))}
    </div>
  );
}
