GameCanvas.js

import { useEffect, useRef, useState } from 'react';
import { relayInit, nip44 } from 'nostr-tools';
import axios from 'axios';

export default function GameCanvas({ mode, user }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const gridSize = 20, tileCount = 20;
  let snake = [{ x: 10, y: 10 }], direction = { x: 1, y: 0 }, food = {};
  let relay, opponent;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    relay = relayInit(process.env.NEXT_PUBLIC_NOSTR_RELAY);
    relay.connect();
    spawnFood();

    if (mode === 'classic') classicGame(ctx);
    else if (mode === 'turn-based') turnBasedGame(ctx);
    else if (mode === 'multiplayer') multiplayerGame(ctx);

    return () => relay.close();
  }, [mode]);

  function spawnFood() {
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  }

  function draw(ctx, players = [snake]) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    players.forEach((player, i) => {
      player.forEach((segment, j) => {
        ctx.fillStyle = j === 0 && i === 0 ? 'var(--accent-color)' : '#666';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });
    });
    ctx.font = '20px Arial';
    ctx.fillText('⚡', food.x * gridSize, food.y * gridSize + gridSize / 2);
  }

  function moveSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (mode === 'classic') {
      head.x = (head.x + tileCount) % tileCount;
      head.y = (head.y + tileCount) % tileCount;
    } else if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return;
    snake.unshift(head);
    snake.pop();
  }

  function collision() {
    return snake.slice(1).some(segment => segment.x === snake[0].x && segment.y === snake[0].y);
  }

  function classicGame(ctx) {
    document.addEventListener('keydown', changeDirection);
    const loop = setInterval(async () => {
      moveSnake();
      if (snake[0].x === food.x && snake[0].y === food.y) {
        setScore(s => s + 10);
        spawnFood();
        snake.push({ ...snake[snake.length - 1] });
        if (score % 25 === 0) updateSnakes();
      }
      if (collision()) {
        clearInterval(loop);
        await axios.post('/api/highscores', { mode, score, pubkey: user.pubkey });
        window.location.href = `/highscores/${mode}`;
      }
      draw(ctx);
    }, 100);
  }

  function turnBasedGame(ctx) {
    opponent = { snake: [{ x: 5, y: 5 }], score: 0 };
    let myTurn = true;
    canvas.addEventListener('click', async () => {
      if (myTurn) {
        const roll = Math.floor(Math.random() * 6) + 1;
        for (let i = 0; i < roll; i++) moveSnake();
        if (snake[0].x === food.x && snake[0].y === food.y) {
          setScore(s => s + 10);
          spawnFood();
          snake.push({ ...snake[snake.length - 1] });
          if (score % 25 === 0) updateSnakes();
        }
        await axios.post('/api/turn', { move: roll, position: snake, pubkey: user.pubkey });
        myTurn = false;
        await notifyOpponent();
      }
    });
    const sub = relay.sub([{ kinds: [30000], '#p': [user.pubkey] }]);
    sub.on('event', (event) => {
      if (!myTurn) {
        const { move } = JSON.parse(event.content);
        for (let i = 0; i < move; i++) {
          const head = { x: opponent.snake[0].x + (Math.random() > 0.5 ? 1 : -1), y: opponent.snake[0].y };
          if (head.x >= 0 && head.x < tileCount && head.y >= 0 && head.y < tileCount) {
            opponent.snake.unshift(head);
            opponent.snake.pop();
          }
        }
        myTurn = true;
      }
      draw(ctx, [snake, opponent.snake]);
    });
    draw(ctx);
  }

  function multiplayerGame(ctx) {
    const players = new Map();
    players.set(user.pubkey, snake);
    const sub = relay.sub([{ kinds: [30001] }]);
    sub.on('event', (event) => {
      const { position } = JSON.parse(event.content);
      players.set(event.pubkey, position);
    });
    const loop = setInterval(async () => {
      moveSnake();
      if (snake[0].x === food.x && snake[0].y === food.y) {
        setScore(s => s + 10);
        spawnFood();
        snake.push({ ...snake[snake.length - 1] });
        if (score % 25 === 0) updateSnakes();
      }
      await axios.post('/api/multiplayer', { position: snake, pubkey: user.pubkey });
      draw(ctx, Array.from(players.values()));
    }, 100);
  }

  function changeDirection(event) {
    const key = event.keyCode;
    if (key === 37 && direction.x !== 1) direction = { x: -1, y: 0 };
    else if (key === 38 && direction.y !== 1) direction = { x: 0, y: -1 };
    else if (key === 39 && direction.x !== -1) direction = { x: 1, y: 0 };
    else if (key === 40 && direction.y !== -1) direction = { x: 0, y: 1 };
  }

  async function notifyOpponent() {
    const opponentPubkey = 'some-opponent-pubkey';
    const encrypted = nip44.encrypt(user.privkey, opponentPubkey, 'Your turn!');
    await relay.publish({
      kind: 4,
      content: encrypted,
      tags: [['p', opponentPubkey]],
      pubkey: user.pubkey,
      created_at: Math.floor(Date.now() / 1000),
    });
  }

  function updateSnakes() {
    const unlocked = JSON.parse(localStorage.getItem('unlockedSnakes')) || ['default'];
    const snakes = ['default', 'blue', 'red', 'green', 'purple'];
    const newSkin = snakes[Math.floor(score / 25)];
    if (newSkin && !unlocked.includes(newSkin)) unlocked.push(newSkin);
    localStorage.setItem('unlockedSnakes', JSON.stringify(unlocked));
  }

  return <canvas ref={canvasRef} width={gridSize * tileCount} height={gridSize * tileCount} />;
}