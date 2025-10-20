import React, { useRef, useEffect } from 'react';

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
    let player, obstacles;
    let keys = {};

    // === EVENTOS ===
    const keyDown = (e) => (keys[e.code] = true);
    const keyUp = (e) => (keys[e.code] = false);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    canvas.addEventListener('touchstart', () => {
      if (isGameOver) init();
      else if (player.isGrounded) player.jump();
    });

    canvas.addEventListener('click', () => {
      if (isGameOver) init();
      else if (player.isGrounded) player.jump();
    });

    // === ERIZO ===
    class Player {
      constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
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

      draw() {
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        // Detecta modo oscuro/claro
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Cuerpo
        const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, this.w / 1.5);
        grad.addColorStop(0, dark ? '#70513D' : '#8B5E3C');
        grad.addColorStop(1, dark ? '#3E2A1F' : '#5C3B25');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Carita
        ctx.fillStyle = dark ? '#E8DCC5' : '#FFF9EE';
        ctx.beginPath();
        ctx.ellipse(cx + this.w / 4, cy, this.w / 3.5, this.h / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ojo
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx + this.w / 3, cy - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Nariz
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx + this.w / 2.1, cy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        if ((keys['Space'] || keys['Enter'] || keys['ArrowUp']) && this.isGrounded) {
          this.jump();
        }

        this.dy += this.gravity;
        this.y += this.dy;

        if (this.y + this.h >= this.originalY) {
          this.y = this.originalY - this.h;
          this.dy = 0;
          this.isGrounded = true;
        }

        this.draw();
      }

      get hitbox() {
        // Caja de colisión más ajustada al cuerpo visible
        return {
          x: this.x + this.w * 0.15,
          y: this.y + this.h * 0.15,
          w: this.w * 0.7,
          h: this.h * 0.7,
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

      draw() {
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.fillStyle = dark ? '#8b6f56' : '#c8a478';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Detalle superior
        ctx.fillStyle = dark ? '#a78b73' : '#e2c6a4';
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
      const size = Math.random() > 0.5 ? 25 : 40;
      const obstacle = new Obstacle(GAME_WIDTH, GAME_HEIGHT - size - 2, 15, size);
      obstacles.push(obstacle);
    }

    function checkCollision(p, o) {
      const a = p.hitbox;
      const b = o.hitbox;
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
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
      ctx.fillStyle = dark ? '#1E1E1E' : '#F7F3EF';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = dark ? '#A6895C' : '#D9C7A4';
      ctx.fillRect(0, GAME_HEIGHT - 2, GAME_WIDTH, 2);

      player.update();

      if (isGameOver) {
        ctx.fillStyle = dark ? '#FFF9EE' : '#2B2B2B';
        ctx.font = '24px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦔 Game Over 🦔', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '16px Poppins, sans-serif';
        ctx.fillText('Presiona Espacio, Enter o toca para reiniciar', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        return;
      }

      obstacleTimer--;
      if (obstacleTimer <= 0) {
        spawnObstacle();
        obstacleTimer = 100 + Math.random() * 150 - gameSpeed * 10;
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
      player = new Player(25, GAME_HEIGHT - 30, 30, 30);

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
      <h2>¡Oops! Parece que no hay conexión.</h2>
      <p className="lead">Mientras vuelve el internet, ¡juega con el erizo! 🦔</p>
      <div className="mt-4 d-flex justify-content-center">
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: '12px',
            border: '2px solid #bca788',
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

export default DinoGame;
