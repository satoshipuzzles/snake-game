import GameCanvas from '../components/GameCanvas';

export default function Home() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Multiplayer Snake Game</h1>
      <GameCanvas />
    </div>
  );
}
