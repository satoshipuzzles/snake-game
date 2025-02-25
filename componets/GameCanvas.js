import { useRef, useEffect } from 'react';
import { connectToRelay, publishEvent, subscribe } from '../lib/nostr';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  let relay, playerPubkey, profilePic, snakes = {}, pellets = [], hostPubkey;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const speed = 2, segmentSize = 20;

    let snake = {
      head: { x: 400, y: 300 },
      direction: 0,
      segments: [],
      length: 5
    };

    async function init() {
      relay = await connectToRelay();
      if (window.nostr) {
        playerPubkey = await window.nostr.getPublicKey();
      } else {
        alert('Please install a Nostr extension like Alby or Nos2x.');
        return;
      }

      subscribe(relay, [{ kinds: [0], authors: [playerPubkey] }], (event) => {
        const profile = JSON.parse(event.content);
        profilePic = new Image();
        profilePic.src = profile.picture;
      });

      const joinEvent = {
        kind: 10000,
        content: 'Joined snake game',
        tags: [['game', 'snake']],
        pubkey: playerPubkey,
        created_at: Math.floor(Date.now() / 1000)
      };
      publishEvent(relay, await window.nostr.signEvent(joinEvent));

      subscribe(relay, [{ kinds: [10000], '#game': ['snake'] }], (event) => {
        snakes[event.pubkey] = { head: { x: 400, y: 300 }, direction: 0, segments: [], length: 5, pic: null };
        if (!hostPubkey || event.pubkey < hostPubkey) hostPubkey = event.pubkey;
        subscribe(relay, [{ kinds: [0], authors: [event.pubkey] }], (e) => {
          const p = JSON.parse(e.content);
          snakes[event.pubkey].pic = new Image();
          snakes[event.pubkey].pic.src = p.picture;
        });
      });

      subscribe(relay, [{ kinds: [10001], '#game': ['snake'] }], (event) => {
        const data = JSON.parse(event.content);
        if (event.pubkey !== playerPubkey) {
          snakes[event.pubkey] = snakes[event.pubkey] || { segments: [], length: 5 };
          snakes[event.pubkey].head = data.head;
          snakes[event.pubkey].direction = data.direction;
        }
      });

      subscribe(relay, [{ kinds: [10002], '#game': ['snake'] }], (event) => {
        pellets = JSON.parse(event.content);
      });
    }
    init();

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight': snake.direction = 0; break;
        case 'ArrowDown': snake.direction = 90; break;
        case 'ArrowLeft': snake.direction = 180; break;
        case 'ArrowUp': snake.direction = 270; break;
      }
    });

    let lastUpdate = 0;
    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snake.head.x += speed * Math.cos(snake.direction * Math.PI / 180);
      snake.head.y += speed * Math.sin(snake.direction * Math.PI / 180);

      if (snake.head.x < 0 || snake.head.x > canvas.width || snake.head.y < 0 || snake.head.y > canvas.height) {
        snake = { head: { x: 400, y: 300 }, direction: 0, segments: [], length: 5 };
      }

      if (Date.now() - lastUpdate > 100 && relay) {
        const stateEvent = {
          kind: 10001,
          content: JSON.stringify({ head: snake.head, direction: snake.direction }),
          tags: [['game', 'snake']],
          pubkey: playerPubkey,
          created_at: Math.floor(Date.now() / 1000)
        };
        window.nostr.signEvent(stateEvent).then(signed => publishEvent(relay, signed));
        lastUpdate = Date.now();
      }

      if (playerPubkey === hostPubkey && relay) {
        if (pellets.length < 10) pellets.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
        const pelletEvent = {
          kind: 10002,
          content: JSON.stringify(pellets),
          tags: [['game', 'snake']],
          pubkey: playerPubkey,
          created_at: Math.floor(Date.now() / 1000)
        };
        window.nostr.signEvent(pelletEvent).then(signed => publishEvent(relay, signed));
      }

      pellets = pellets.filter(p => {
        const dx = snake.head.x - p.x, dy = snake.head.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < segmentSize) {
          snake.length++;
          return false;
        }
        return true;
      });

      ctx.fillStyle = 'yellow';
      pellets.forEach(p => ctx.fillRect(p.x - 5, p.y - 5, 10, 10));

      Object.entries(snakes).forEach(([pubkey, s]) => {
        ctx.fillStyle = 'green';
        let pos = { ...s.head }, len = s.length;
        while (len > 0) {
          if (pubkey === playerPubkey && profilePic && len === s.length) {
            ctx.drawImage(profilePic, pos.x - segmentSize / 2, pos.y - segmentSize / 2, segmentSize, segmentSize);
          } else if (pubkey !== playerPubkey && s.pic && len === s.length) {
            ctx.drawImage(s.pic, pos.x - segmentSize / 2, pos.y - segmentSize / 2, segmentSize, segmentSize);
          } else {
            ctx.fillRect(pos.x - segmentSize / 2, pos.y - segmentSize / 2, segmentSize, segmentSize);
          }
          pos.x -= segmentSize * Math.cos(s.direction * Math.PI / 180);
          pos.y -= segmentSize * Math.sin(s.direction * Math.PI / 180);
          len--;
        }
        if (pubkey !== playerPubkey) {
          let checkPos = { ...s.head }, checkLen = s.length;
          while (checkLen > 0) {
            const dx = snake.head.x - checkPos.x, dy = snake.head.y - checkPos.y;
            if (Math.sqrt(dx * dx + dy * dy) < segmentSize) {
              snake = { head: { x: 400, y: 300 }, direction: 0, segments: [], length: 5 };
              break;
            }
            checkPos.x -= segmentSize * Math.cos(s.direction * Math.PI / 180);
            checkPos.y -= segmentSize * Math.sin(s.direction * Math.PI / 180);
            checkLen--;
          }
        }
      });

      requestAnimationFrame(gameLoop);
    }
    gameLoop();

    return () => {
      if (relay) relay.close();
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black' }} />;
}
