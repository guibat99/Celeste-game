
import React, { useRef, useEffect } from 'react';
import { Player, GameLevel, TileType, AbilityType } from '../types';
import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED, JUMP_FORCE, DASH_SPEED, DASH_DURATION, MOVE_SPEED_BASE, FRICTION, COYOTE_TIME_MAX, JUMP_BUFFER_MAX, WALL_JUMP_X, WALL_JUMP_Y } from '../constants';

interface GameCanvasProps {
  isPlaying: boolean;
  level: GameLevel;
  input: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
    dash: boolean;
  };
  onLevelComplete: () => void;
  onDeath: () => void;
  onShardCollected: () => void;
  abilities: AbilityType[];
}

interface TrailGhost {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  isPlaying, 
  level, 
  input, 
  onLevelComplete, 
  onDeath, 
  onShardCollected,
  abilities 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridStateRef = useRef<TileType[][]>([]);
  
  const playerRef = useRef<Player>({
    pos: { x: level.spawn.x * TILE_SIZE, y: level.spawn.y * TILE_SIZE },
    vel: { x: 0, y: 0 },
    width: 22,
    height: 28,
    dashes: 1,
    maxDashes: 1,
    airJumps: 0,
    maxAirJumps: 0,
    isDashing: false,
    dashTimer: 0,
    dashDir: { x: 0, y: 0 },
    onGround: false,
    onWall: null,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    state: 'idle',
    facing: 1,
    lastSafePos: { x: level.spawn.x * TILE_SIZE, y: level.spawn.y * TILE_SIZE },
    abilities: []
  });

  const particlesRef = useRef<any[]>([]);
  const trailRef = useRef<TrailGhost[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, duration: 0 });
  const lastJumpInput = useRef(false);

  const resetPlayer = () => {
    playerRef.current.pos = { x: level.spawn.x * TILE_SIZE, y: level.spawn.y * TILE_SIZE };
    playerRef.current.vel = { x: 0, y: 0 };
    playerRef.current.dashes = playerRef.current.maxDashes;
    playerRef.current.airJumps = playerRef.current.maxAirJumps;
    playerRef.current.isDashing = false;
    playerRef.current.dashTimer = 0;
    playerRef.current.coyoteTimer = 0;
    playerRef.current.jumpBufferTimer = 0;
    trailRef.current = [];
    triggerShake(15);
  };

  const triggerShake = (duration: number) => {
    shakeRef.current.duration = duration;
  };

  useEffect(() => {
    gridStateRef.current = level.grid.map(row => [...row]);
    const p = playerRef.current;
    p.maxDashes = abilities.includes('multi_dash') ? 2 : 1;
    p.maxAirJumps = abilities.includes('double_jump') ? 1 : 0;
    resetPlayer();
  }, [level, abilities]);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const getPlayerColor = (p: Player) => {
      if (p.isDashing) return '#fb7185';
      if (p.dashes === 2) return '#f472b6';
      if (p.dashes === 1) return '#0ea5e9';
      return '#78716c';
    };

    const update = () => {
      const p = playerRef.current;
      const moveSpeed = MOVE_SPEED_BASE * (abilities.includes('speed_boost') ? 1.25 : 1);
      
      // Update Timers
      if (p.onGround) p.coyoteTimer = COYOTE_TIME_MAX;
      else if (p.coyoteTimer > 0) p.coyoteTimer--;

      if (input.jump && !lastJumpInput.current) p.jumpBufferTimer = JUMP_BUFFER_MAX;
      else if (p.jumpBufferTimer > 0) p.jumpBufferTimer--;

      // Horizontal Movement
      if (!p.isDashing) {
        if (input.left) {
          p.vel.x -= 0.85;
          p.facing = -1;
        } else if (input.right) {
          p.vel.x += 0.85;
          p.facing = 1;
        } else {
          p.vel.x *= FRICTION;
        }
        p.vel.x = Math.max(-moveSpeed, Math.min(moveSpeed, p.vel.x));
      }

      // Gravity & Variable Jump Height
      if (!p.onGround && !p.isDashing) {
        let currentGravity = GRAVITY;
        // Se soltar o pulo enquanto sobe, gravidade aumenta (pulo curto)
        if (!input.jump && p.vel.y < 0) currentGravity *= 2.5;
        
        p.vel.y += currentGravity;
        p.vel.y = Math.min(p.vel.y, MAX_FALL_SPEED);
      }

      // Jump Execution (Buffer + Coyote)
      if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0 && !p.isDashing) {
        p.vel.y = JUMP_FORCE;
        p.onGround = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        createParticles(p.pos.x + p.width/2, p.pos.y + p.height, '#fff', 8);
      } 
      // Air Jump (Abilities)
      else if (p.jumpBufferTimer > 0 && !p.onGround && p.airJumps > 0 && !p.isDashing) {
        p.vel.y = JUMP_FORCE * 0.85;
        p.airJumps--;
        p.jumpBufferTimer = 0;
        createParticles(p.pos.x + p.width/2, p.pos.y + p.height/2, '#bae6fd', 10);
      }

      // Wall Jump Logic
      p.onWall = null;
      if (!p.onGround && !p.isDashing) {
        if (checkCollision(p.pos.x - 2, p.pos.y, 2, p.height)) p.onWall = 'left';
        else if (checkCollision(p.pos.x + p.width, p.pos.y, 2, p.height)) p.onWall = 'right';

        if (p.onWall && p.jumpBufferTimer > 0) {
          p.vel.y = WALL_JUMP_Y;
          p.vel.x = p.onWall === 'left' ? WALL_JUMP_X : -WALL_JUMP_X;
          p.jumpBufferTimer = 0;
          p.facing = p.onWall === 'left' ? 1 : -1;
          createParticles(p.pos.x + (p.onWall === 'left' ? 0 : p.width), p.pos.y + p.height/2, '#fff', 6);
        }
      }

      lastJumpInput.current = input.jump;

      // Dash Logic
      if (input.dash && p.dashes > 0 && !p.isDashing) {
        p.isDashing = true;
        p.dashes--;
        p.dashTimer = DASH_DURATION;
        p.jumpBufferTimer = 0; // Previne pulo acidental saindo do dash
        
        let dx = 0, dy = 0;
        if (input.left) dx = -1;
        else if (input.right) dx = 1;
        if (input.up) dy = -1;
        else if (input.down) dy = 1;
        
        if (dx === 0 && dy === 0) dx = p.facing;
        const mag = Math.sqrt(dx*dx + dy*dy);
        p.dashDir = { x: dx / mag, y: dy / mag };
        p.vel.x = p.dashDir.x * DASH_SPEED;
        p.vel.y = p.dashDir.y * DASH_SPEED;
        
        triggerShake(8);
        createParticles(p.pos.x + p.width/2, p.pos.y + p.height/2, getPlayerColor(p), 15);
      }

      if (p.isDashing) {
        trailRef.current.push({
          x: p.pos.x, y: p.pos.y, w: p.width, h: p.height,
          color: getPlayerColor(p), alpha: 0.5
        });
        p.dashTimer--;
        if (p.dashTimer <= 0) {
          p.isDashing = false;
          p.vel.x *= 0.4;
          p.vel.y *= 0.4;
        }
      }

      // Movement & Collision
      const nextX = p.pos.x + p.vel.x;
      const nextY = p.pos.y + p.vel.y;
      p.onGround = false;

      if (checkCollision(nextX, p.pos.y, p.width, p.height)) {
        p.vel.x = 0;
      } else {
        p.pos.x = nextX;
      }

      if (checkCollision(p.pos.x, nextY, p.width, p.height)) {
        if (p.vel.y > 0) {
          p.onGround = true;
          p.dashes = p.maxDashes;
          p.airJumps = p.maxAirJumps;
        }
        p.vel.y = 0;
      } else {
        p.pos.y = nextY;
      }

      checkEntities();

      // Shake Logic
      if (shakeRef.current.duration > 0) {
        shakeRef.current.x = (Math.random() - 0.5) * 6;
        shakeRef.current.y = (Math.random() - 0.5) * 6;
        shakeRef.current.duration--;
      } else {
        shakeRef.current.x = 0;
        shakeRef.current.y = 0;
      }

      // Update Particles & Trail
      particlesRef.current = particlesRef.current.filter(part => {
        part.x += part.vx; part.y += part.vy; part.life -= 0.035;
        return part.life > 0;
      });
      trailRef.current = trailRef.current.filter(ghost => {
        ghost.alpha -= 0.08; return ghost.alpha > 0;
      });
    };

    const checkCollision = (x: number, y: number, w: number, h: number) => {
      const grid = gridStateRef.current;
      const left = Math.floor(x / TILE_SIZE);
      const right = Math.floor((x + w) / TILE_SIZE);
      const top = Math.floor(y / TILE_SIZE);
      const bottom = Math.floor((y + h) / TILE_SIZE);
      for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
          if (grid[r]?.[c] === 1) return true;
        }
      }
      return false;
    };

    const checkEntities = () => {
      const p = playerRef.current;
      const grid = gridStateRef.current;
      const r = Math.floor((p.pos.y + p.height/2) / TILE_SIZE);
      const c = Math.floor((p.pos.x + p.width/2) / TILE_SIZE);
      const tile = grid[r]?.[c];
      if (tile === 2) { onDeath(); resetPlayer(); }
      else if (tile === 4) { onLevelComplete(); }
      else if (tile === 3) {
        grid[r][c] = 0; onShardCollected();
        createParticles(p.pos.x + p.width/2, p.pos.y + p.height/2, '#22d3ee', 12);
      }
      if (p.pos.y > grid.length * TILE_SIZE || p.pos.y < -TILE_SIZE) { onDeath(); resetPlayer(); }
    };

    const createParticles = (x: number, y: number, color: string, count = 5) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x, y, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7,
          life: 1, color
        });
      }
    };

    const render = () => {
      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);
      ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      gridStateRef.current.forEach((row, r) => {
        row.forEach((tile, c) => {
          const x = c * TILE_SIZE; const y = r * TILE_SIZE;
          if (tile === 1) {
            ctx.fillStyle = '#44403c'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#292524'; ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          } else if (tile === 2) {
            ctx.fillStyle = '#ef4444'; ctx.beginPath();
            ctx.moveTo(x, y + TILE_SIZE); ctx.lineTo(x + TILE_SIZE / 2, y); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE); ctx.fill();
          } else if (tile === 3) {
            const time = Date.now() / 250; const floatY = Math.sin(time) * 5;
            ctx.fillStyle = '#22d3ee'; ctx.beginPath();
            ctx.moveTo(x + TILE_SIZE/2, y + 4 + floatY); ctx.lineTo(x + TILE_SIZE - 6, y + TILE_SIZE/2 + floatY);
            ctx.lineTo(x + TILE_SIZE/2, y + TILE_SIZE - 4 + floatY); ctx.lineTo(x + 6, y + TILE_SIZE/2 + floatY); ctx.fill();
          } else if (tile === 4) {
            const time = Date.now() / 400; ctx.fillStyle = '#8b5cf6';
            ctx.beginPath(); ctx.ellipse(x + TILE_SIZE/2, y + TILE_SIZE/2, 11 + Math.sin(time)*2, 15 + Math.cos(time)*2, 0, 0, Math.PI * 2); ctx.fill();
          }
        });
      });

      // Draw Trail
      trailRef.current.forEach(ghost => {
        ctx.globalAlpha = ghost.alpha; ctx.fillStyle = ghost.color; ctx.fillRect(ghost.x, ghost.y, ghost.w, ghost.h);
      });
      ctx.globalAlpha = 1.0;

      // Draw Particles
      particlesRef.current.forEach(part => {
        ctx.globalAlpha = part.life; ctx.fillStyle = part.color; ctx.fillRect(part.x, part.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Draw Player
      const p = playerRef.current;
      const pColor = getPlayerColor(p);
      ctx.fillStyle = pColor;
      
      let drawW = p.width; let drawH = p.height;
      if (Math.abs(p.vel.y) > 3) { drawW *= 0.8; drawH *= 1.2; }
      else if (p.onGround && Math.abs(p.vel.x) > 1) { drawW *= 1.1; drawH *= 0.9; }
      
      const drawX = p.pos.x + (p.width - drawW)/2;
      const drawY = p.pos.y + (p.height - drawH);
      ctx.fillRect(drawX, drawY, drawW, drawH);
      
      if (p.maxDashes > 1) {
        ctx.shadowBlur = 10; ctx.shadowColor = pColor;
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      update();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, level, input, onLevelComplete, onDeath, onShardCollected, abilities]);

  return (
    <canvas 
      ref={canvasRef} 
      width={20 * TILE_SIZE} 
      height={15 * TILE_SIZE} 
      className="w-full h-full object-contain bg-black shadow-2xl"
    />
  );
};

export default GameCanvas;
