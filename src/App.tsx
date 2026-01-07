import React, { useState, useRef, useEffect, useCallback } from 'react';

interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player extends GameObject {
  speed: number;
  lives: number;
}

interface Bullet extends GameObject {
  velocity: number;
  owner: 'player' | 'enemy';
}

interface Enemy extends GameObject {
  health: number;
  type: 'basic' | 'fast' | 'tank';
  points: number;
}

interface Particle extends GameObject {
  velocityX: number;
  velocityY: number;
  life: number;
  color: string;
}

interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  score: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  highScore: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const SpaceInvadersGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    player: { id: 'player', x: CANVAS_WIDTH / 2 - 25, y: CANVAS_HEIGHT - 80, width: 50, height: 40, speed: 5, lives: 3 },
    bullets: [],
    enemies: [],
    particles: [],
    score: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    isPlaying: false,
    highScore: parseInt(localStorage.getItem('spaceInvadersHighScore') || '0'),
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const animationRef = useRef<number>();
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvasContextRef.current = canvas.getContext('2d');
    }
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' && gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
        e.preventDefault();
        shoot();
      }
      if (e.key === 'Escape' && gameState.isPlaying) {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
      }
      if (e.key === 'Enter' && (gameState.isGameOver || !gameState.isPlaying)) {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isPaused]);

  const startGame = useCallback(() => {
    setGameState({
      player: { id: 'player', x: CANVAS_WIDTH / 2 - 25, y: CANVAS_HEIGHT - 80, width: 50, height: 40, speed: 5, lives: 3 },
      bullets: [],
      enemies: [],
      particles: [],
      score: 0,
      level: 1,
      isGameOver: false,
      isPaused: false,
      isPlaying: true,
      highScore: parseInt(localStorage.getItem('spaceInvadersHighScore') || '0'),
    });
  }, []);

  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotRef.current < 300) return; // Rate limiting
    lastShotRef.current = now;

    setGameState(prev => {
      const newBullet: Bullet = {
        id: `bullet-${now}`,
        x: prev.player.x + prev.player.width / 2 - 2,
        y: prev.player.y,
        width: 4,
        height: 12,
        velocity: -8,
        owner: 'player',
      };
      return { ...prev, bullets: [...prev.bullets, newBullet] };
    });
  }, []);

  const spawnEnemy = useCallback((level: number) => {
    const now = Date.now();
    if (now - lastEnemySpawnRef.current < Math.max(800 - level * 50, 300)) return;
    lastEnemySpawnRef.current = now;

    const types = ['basic', 'fast', 'tank'] as const;
    const type = types[Math.floor(Math.random() * Math.min(types.length, 1 + Math.floor(level / 3)))];
    
    const enemyConfig = {
      basic: { health: 1, width: 40, height: 30, speed: 1, points: 10, color: '#ef4444' },
      fast: { health: 1, width: 30, height: 25, speed: 2, points: 20, color: '#f59e0b' },
      tank: { health: 3, width: 50, height: 40, speed: 0.5, points: 50, color: '#8b5cf6' },
    }[type];

    const newEnemy: Enemy = {
      id: `enemy-${now}`,
      x: Math.random() * (CANVAS_WIDTH - enemyConfig.width),
      y: -enemyConfig.height,
      width: enemyConfig.width,
      height: enemyConfig.height,
      health: enemyConfig.health,
      type,
      points: enemyConfig.points,
    };

    setGameState(prev => ({ ...prev, enemies: [...prev.enemies, newEnemy] }));
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    setGameState(prev => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: `particle-${Date.now()}-${i}`,
          x,
          y,
          width: 3,
          height: 3,
          velocityX: (Math.random() - 0.5) * 6,
          velocityY: (Math.random() - 0.5) * 6,
          life: 1,
          color,
        });
      }
      return { ...prev, particles: [...prev.particles, ...newParticles] };
    });
  }, []);

  const updateGame = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;

    setGameState(prev => {
      let { player, bullets, enemies, particles, score, level, lives } = prev;

      // Move player
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
        player.x = Math.max(0, player.x - player.speed);
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
      }

      // Update bullets
      bullets = bullets
        .map(b => ({ ...b, y: b.y + b.velocity }))
        .filter(b => b.y > -20 && b.y < CANVAS_HEIGHT + 20);

      // Update enemies
      enemies = enemies
        .map(e => ({ ...e, y: e.y + (e.type === 'fast' ? 2 : e.type === 'tank' ? 0.5 : 1) }))
        .filter(e => e.y < CANVAS_HEIGHT + 50);

      // Update particles
      particles = particles
        .map(p => ({
          ...p,
          x: p.x + p.velocityX,
          y: p.y + p.velocityY,
          life: p.life - 0.02,
          velocityY: p.velocityY + 0.1,
        }))
        .filter(p => p.life > 0);

      // Collision detection: Player bullets vs Enemies
      bullets.forEach(bullet => {
        if (bullet.owner === 'player') {
          enemies.forEach(enemy => {
            if (
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y
            ) {
              enemy.health -= 1;
              bullet.y = -100; // Mark for removal
              createParticles(bullet.x, bullet.y, '#ffffff', 5);

              if (enemy.health <= 0) {
                score += enemy.points;
                createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 
                  enemy.type === 'tank' ? '#8b5cf6' : enemy.type === 'fast' ? '#f59e0b' : '#ef4444', 15);
                enemy.y = CANVAS_HEIGHT + 100; // Mark for removal
              }
            }
          });
        }
      });

      // Collision detection: Enemies vs Player
      enemies.forEach(enemy => {
        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          lives -= 1;
          createParticles(player.x + player.width / 2, player.y + player.height / 2, '#38bdf8', 20);
          enemy.y = CANVAS_HEIGHT + 100; // Remove enemy
          
          if (lives <= 0) {
            const newHighScore = Math.max(prev.highScore, score);
            localStorage.setItem('spaceInvadersHighScore', newHighScore.toString());
            return { ...prev, isGameOver: true, isPlaying: false, lives: 0, highScore: newHighScore };
          }
        }
      });

      // Level progression
      if (enemies.length === 0 && score > 0) {
        level += 1;
      }

      // Spawn enemies
      if (enemies.length < 3 + level) {
        // We need to call spawnEnemy, but we can't do it directly here
        // We'll handle this in the effect
      }

      // Filter out destroyed entities
      bullets = bullets.filter(b => b.y > -50);
      enemies = enemies.filter(e => e.y < CANVAS_HEIGHT + 50);

      return { ...prev, player, bullets, enemies, particles, score, level, lives };
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, createParticles]);

  // Spawn enemies effect
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
      const interval = setInterval(() => {
        if (gameState.enemies.length < 3 + gameState.level) {
          spawnEnemy(gameState.level);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.enemies.length, gameState.level, spawnEnemy]);

  // Main game loop
  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, updateGame]);

  const render = useCallback(() => {
    const ctx = canvasContextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 123) % CANVAS_WIDTH;
      const y = ((i * 456) + Date.now() * 0.02) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw player
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width / 2, gameState.player.y);
    ctx.lineTo(gameState.player.x, gameState.player.y + gameState.player.height);
    ctx.lineTo(gameState.player.x + gameState.player.width, gameState.player.y + gameState.player.height);
    ctx.closePath();
    ctx.fill();

    // Draw player wings
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(gameState.player.x - 5, gameState.player.y + gameState.player.height - 5, 10, 5);
    ctx.fillRect(gameState.player.x + gameState.player.width - 5, gameState.player.y + gameState.player.height - 5, 10, 5);

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 'player' ? '#fbbf24' : '#ef4444';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      if (bullet.owner === 'player') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(bullet.x - 1, bullet.y + 2, bullet.width + 2, 3);
      }
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const colors = {
        basic: '#ef4444',
        fast: '#f59e0b',
        tank: '#8b5cf6',
      };
      ctx.fillStyle = colors[enemy.type];
      
      // Alien shape
      ctx.fillRect(enemy.x + 5, enemy.y, enemy.width - 10, 5);
      ctx.fillRect(enemy.x, enemy.y + 5, enemy.width, 10);
      ctx.fillRect(enemy.x + 5, enemy.y + 15, enemy.width - 10, 5);
      
      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4);
      ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4);

      // Health bar for tank
      if (enemy.type === 'tank') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x, enemy.y - 6, enemy.width, 3);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(enemy.x, enemy.y - 6, (enemy.health / 3) * enemy.width, 3);
      }
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
      ctx.globalAlpha = 1;
    });

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Level: ${gameState.level}`, 20, 55);
    
    // Lives
    ctx.fillText('Lives:', CANVAS_WIDTH - 120, 30);
    for (let i = 0; i < gameState.player.lives; i++) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      const x = CANVAS_WIDTH - 60 + i * 15;
      const y = 20;
      ctx.moveTo(x + 5, y);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x + 10, y + 8);
      ctx.closePath();
      ctx.fill();
    }

    // High Score
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`High: ${gameState.highScore}`, CANVAS_WIDTH - 140, 55);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2">
            SPACE INVADERS
          </h1>
          <p className="text-slate-300 text-sm">Defend Earth from the alien invasion!</p>
        </div>

        {/* Game Canvas Container */}
        <div className="relative bg-slate-950 rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Overlay UI */}
          {!gameState.isPlaying && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center p-8">
                {gameState.isGameOver ? (
                  <>
                    <h2 className="text-5xl font-bold text-red-400 mb-4">GAME OVER</h2>
                    <p className="text-2xl text-white mb-2">Final Score: {gameState.score}</p>
                    <p className="text-xl text-yellow-400 mb-6">High Score: {gameState.highScore}</p>
                  </>
                ) : (
                  <h2 className="text-4xl font-bold text-cyan-400 mb-4">READY?</h2>
                )}
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-lg hover:shadow-purple-500/50"
                >
                  {gameState.isGameOver ? 'PLAY AGAIN' : 'START GAME'}
                </button>
                <div className="mt-6 text-slate-400 text-sm space-y-2">
                  <p>← → or A D : Move</p>
                  <p>SPACE : Shoot</p>
                  <p>ESC : Pause</p>
                </div>
              </div>
            </div>
          )}

          {gameState.isPaused && gameState.isPlaying && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center p-8">
                <h2 className="text-4xl font-bold text-yellow-400 mb-4">PAUSED</h2>
                <p className="text-white mb-4">Press ESC to resume</p>
                <button
                  onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
                  className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition-colors"
                >
                  RESUME
                </button>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto block"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Stats Bar */}
        {gameState.isPlaying && !gameState.isGameOver && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900/50 backdrop-blur rounded-lg p-3 border border-purple-500/20">
              <div className="text-slate-400 text-xs uppercase tracking-wider">Score</div>
              <div className="text-2xl font-bold text-cyan-400">{gameState.score}</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur rounded-lg p-3 border border-purple-500/20">
              <div className="text-slate-400 text-xs uppercase tracking-wider">Level</div>
              <div className="text-2xl font-bold text-purple-400">{gameState.level}</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur rounded-lg p-3 border border-purple-500/20">
              <div className="text-slate-400 text-xs uppercase tracking-wider">Lives</div>
              <div className="text-2xl font-bold text-pink-400">{gameState.player.lives}</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="mt-4 bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-purple-500/20">
            <h3 className="text-purple-400 font-bold mb-2">How to Play</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Use ← → or A D to move your ship</li>
              <li>• Press SPACE to shoot</li>
              <li>• Press ESC to pause during gameplay</li>
              <li>• Destroy all aliens to advance to the next level</li>
              <li>• Tank enemies (purple) require 3 hits</li>
              <li>• Fast enemies (orange) move twice as fast</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceInvadersGame;
