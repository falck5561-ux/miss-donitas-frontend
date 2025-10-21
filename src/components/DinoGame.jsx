import React, { useRef, useEffect } from 'react';

// El nombre del componente se mantiene como DinoGame
function DinoGame() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // === RESPONSIVE ===
    function resizeCanvas() {
      canvas.width = Math.min(window.innerWidth * 0.9, 600);
      canvas.height = Math.min(window.innerHeight * 0.3, 200);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // === VARIABLES ===
    let GAME_WIDTH = canvas.width;
    let GAME_HEIGHT = canvas.height;
    let score = 0;
    let gameSpeed = 3;
    let isGameOver = false;
    let player, obstacles; // 'player' sigue usando la clase Player
    let keys = {};

    // === EVENTOS ===
    const keyDown = (e) => (keys[e.code] = true);
    const keyUp = (e) => (keys[e.code] = false);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Evitar el scroll en móviles
        if (isGameOver) init();
        else if (player.isGrounded) player.jump();
    });

    canvas.addEventListener('click', () => {
        if (isGameOver) init();
        else if (player.isGrounded) player.jump();
    });

    // === JUGADOR (AHORA ES UNA DONA) ===
    // La clase se sigue llamando 'Player' para no romper nada
    class Player {
        constructor(x, y, size) { // Usamos 'size' (radio) para la dona
            this.x = x;
            this.y = y;
            this.size = size; // El tamaño es el radio exterior
            this.w = size * 2; // Ancho para colisiones
            this.h = size * 2; // Alto para colisiones
            this.dy = 0;
            this.jumpForce = 9;
            this.gravity = 0.4;
            this.isGrounded = true;
            this.originalY = y;
        }

        jump() {
            this.dy = -this.jumpForce;
            this.isGrounded = false;
        }

        // --- ESTÉTICA CAMBIADA ---
        draw() {
            const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const donutColor = dark ? '#A6895C' : '#FFDDC1'; // Color masa
            const glazeColor = dark ? '#D9A4A4' : '#FF99AA'; // Glaseado rosa
            const sprinklesColors = ['#A3D9FF', '#FFD479', '#B7FF7C', '#FF7C85'];
            const holeSize = this.size * 0.4; // Tamaño del agujero
            const cx = this.x + this.size; // Centro X
            const cy = this.y + this.size; // Centro Y

            // Dibuja el cuerpo de la donita
            ctx.beginPath();
            ctx.arc(cx, cy, this.size, 0, Math.PI * 2);
            ctx.fillStyle = donutColor;
            ctx.fill();

            // Dibuja el glaseado
            ctx.beginPath();
            ctx.arc(cx, cy, this.size * 0.9, 0, Math.PI * 2);
            ctx.fillStyle = glazeColor;
            ctx.fill();

            // Dibuja los sprinkles
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * (this.size * 0.7 - holeSize) + holeSize + (this.size * 0.1);
                const sx = cx + Math.cos(angle) * radius;
                const sy = cy + Math.sin(angle) * radius;
                ctx.fillStyle = sprinklesColors[Math.floor(Math.random() * sprinklesColors.length)];
                ctx.beginPath();
                ctx.ellipse(sx, sy, 3, 1.5, angle, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dibuja el agujero
            ctx.beginPath();
            ctx.arc(cx, cy, holeSize, 0, Math.PI * 2);
            ctx.fillStyle = dark ? '#2B2B2B' : '#F7F3EF'; // Color del fondo
            ctx.fill();
        }

        update() {
            if ((keys['Space'] || keys['Enter'] || keys['ArrowUp']) && this.isGrounded) {
            this.jump();
            }

            this.dy += this.gravity;
            this.y += this.dy;

            // Ajustar la posición al suelo
            if (this.y + this.size * 2 >= this.originalY) {
                this.y = this.originalY - this.size * 2;
                this.dy = 0;
                this.isGrounded = true;
            }

            this.draw();
        }

        get hitbox() {
            // La hitbox es un círculo para la donita
            return {
                x: this.x,
                y: this.y,
                w: this.size * 2,
                h: this.size * 2,
                radius: this.size
            };
        }
    }

    // === OBSTÁCULOS ===
    class Obstacle {
        constructor(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }

        // --- ESTÉTICA CAMBIADA ---
        draw() {
            const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            ctx.fillStyle = dark ? '#70513D' : '#8B5E3C'; // Color del tronco
            ctx.fillRect(this.x, this.y, this.w, this.h);

            // Detalle superior
            ctx.fillStyle = dark ? '#5C3B25' : '#5C3B25';
            ctx.fillRect(this.x, this.y, this.w, 3);
        }

        update() {
            this.x -= gameSpeed;
            this.draw();
        }

        get hitbox() {
            return { x: this.x, y: this.y, w: this.w, h: this.h };
        }
    }

    // === FUNCIONES ===
    function spawnObstacle() {
        const size = Math.random() > 0.5 ? 25 : 40; // Tamaños originales
        const obstacle = new Obstacle(GAME_WIDTH, GAME_HEIGHT - size - 2, 15, size);
        obstacles.push(obstacle);
    }

    // --- LÓGICA DE COLISIÓN AJUSTADA ---
    function checkCollision(player, obstacle) {
        // Colisión de círculo (donita) con rectángulo (obstáculo)
        const circle = { x: player.x + player.size, y: player.y + player.size, r: player.size * 0.8 }; // Radio indulgente

        const closestX = Math.max(obstacle.x, Math.min(circle.x, obstacle.x + obstacle.w));
        const closestY = Math.max(obstacle.y, Math.min(circle.y, obstacle.y + obstacle.h));

        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;

        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (circle.r * circle.r);
    }


    function drawScore() {
      ctx.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#E0E0E0' : '#333';
      ctx.font = `${Math.floor(canvas.height / 10)}px Poppins, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`Puntos: ${Math.floor(score / 5)}`, GAME_WIDTH - 10, 25);
    }

    // === LOOP ===
    let animationFrameId;
    let obstacleTimer = 100;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      GAME_WIDTH = canvas.width;
      GAME_HEIGHT = canvas.height;

      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      ctx.fillStyle = dark ? '#2B2B2B' : '#F7F3EF'; // Fondo suave
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = dark ? '#A6895C' : '#D9C7A4'; // Tierra
      ctx.fillRect(0, GAME_HEIGHT - 2, GAME_WIDTH, 2);

      player.update();

      if (isGameOver) {
        // --- ESTÉTICA CAMBIADA ---
        ctx.fillStyle = dark ? '#FFDDC1' : '#FF99AA'; // Color de texto de donita
        ctx.font = '24px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍩 Game Over 🍩', GAME_WIDTH / 2, GAME_HEIGHT / 2); // Mensaje de donita
        ctx.font = '16px Poppins, sans-serif';
        ctx.fillText('Presiona Espacio, Enter o toca para reiniciar', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        return;
      }

      obstacleTimer--;
      if (obstacleTimer <= 0) {
        spawnObstacle();
        obstacleTimer = 100 + Math.random() * 150 - gameSpeed * 10;
        obstacleTimer = Math.max(50, obstacleTimer); // Evitar timers negativos
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.update();
        if (o.x + o.w < 0) obstacles.splice(i, 1);
        if (checkCollision(player, o)) isGameOver = true;
      }

      drawScore();
      score++;
      gameSpeed += 0.001;
    }

    function init() {
      isGameOver = false;
      score = 0;
      gameSpeed = 3;
      obstacles = [];
      // Aquí creamos la instancia de 'Player' usando el nuevo constructor
      const playerSize = 15; // Radio de la donita (30px de diámetro)
      player = new Player(25, GAME_HEIGHT - playerSize * 2, playerSize);


      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();
    }

    init();

    // === LIMPIEZA ===
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
    };
  }, []);

  return (
    <div
      className="text-center"
      style={{
        paddingTop: '4rem',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* --- ESTÉTICA CAMBIADA --- */}
      <h2>¡Oops! Parece que no hay conexión.</h2>
      <p className="lead">Mientras vuelve el internet, ¡juega con la Donita Saltarina! 🍩</p>
      <div className="mt-4 d-flex justify-content-center">
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: '12px',
            border: '2px solid #FF99AA', // Borde rosa
            background: 'transparent',
            touchAction: 'none',
          }}
        />
      </div>
      <p style={{ marginTop: '10px', opacity: 0.7 }}>
        Presiona o toca para saltar
      </p>
    </div>
  );
}

// El export default se mantiene como DinoGame
export default DinoGame;    