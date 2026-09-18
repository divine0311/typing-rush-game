import { Enemy, GameStateType, Laser, Particle, Player, Powerup, UIState } from '../types';
import { getRandomWord, getBossWord } from './dictionary';
import { audio } from './audio';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private onUIUpdate: (ui: UIState) => void;

  // Game State
  public state: GameStateType = 'START';
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  private combo: number = 0;
  
  // Stats for accuracy/wpm
  private totalKeystrokes: number = 0;
  private correctKeystrokes: number = 0;
  private startTime: number = 0;
  private playTimeMs: number = 0;

  // Entities
  private player: Player;
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private lasers: Laser[] = [];
  private powerups: Powerup[] = [];

  // Active Target
  private targetEnemyId: string | null = null;
  private targetPowerupId: string | null = null;

  // Spawning
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 2000;
  private enemiesSpawnedThisLevel: number = 0;
  private enemiesToAdvance: number = 10;
  
  // Powerup Effects
  private freezeTimeRemaining: number = 0;
  private doubleDamageRemaining: number = 0;
  private hasShield: boolean = false;
  
  // Screen shake
  private shakeTime: number = 0;

  // Input
  private boundKeyDown: (e: KeyboardEvent) => void;
  
  private lastTime: number = 0;
  private width: number;
  private height: number;
  private bottomPadding: number = 60;

  constructor(canvas: HTMLCanvasElement, onUIUpdate: (ui: UIState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onUIUpdate = onUIUpdate;
    this.width = canvas.width;
    this.height = canvas.height;

    this.player = {
      x: this.width / 2,
      y: this.height - this.bottomPadding,
      radius: 20,
      color: '#0ff'
    };

    this.boundKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);

    this.syncUI();
    this.drawStartScreen();
  }

  public destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public setBottomPadding(padding: number) {
    this.bottomPadding = padding;
    this.player.y = Math.max(80, this.height - padding);
  }

  public resize(width: number, height: number, bottomPadding?: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    if (bottomPadding !== undefined) {
      this.bottomPadding = bottomPadding;
    }
    this.player.x = width / 2;
    this.player.y = Math.max(80, height - this.bottomPadding);
    
    if (this.state === 'START' || this.state === 'LEVEL_SELECT') this.drawStartScreen();
    if (this.state === 'PAUSED') this.drawPauseScreen();
  }

  public setLevelSelect() {
    this.state = 'LEVEL_SELECT';
    this.syncUI();
    this.drawStartScreen();
  }

  public setStartScreen() {
    this.state = 'START';
    this.syncUI();
    this.drawStartScreen();
  }

  public startGame(startLevel: number = 1) {
    this.state = 'PLAYING';
    this.score = 0;
    this.lives = 3;
    this.level = startLevel;
    this.combo = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.startTime = performance.now();
    this.playTimeMs = 0;
    this.enemies = [];
    this.particles = [];
    this.lasers = [];
    this.powerups = [];
    this.targetEnemyId = null;
    this.targetPowerupId = null;
    this.lastSpawnTime = performance.now();
    this.enemiesSpawnedThisLevel = 0;
    
    this.updateLevelParameters();
    
    this.lastTime = performance.now();
    this.hasShield = false;
    
    this.syncUI({ message: `MISSION SECTOR ${this.level}` });
    setTimeout(() => this.syncUI({ message: undefined }), 3000);
    
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.loop(performance.now());
  }

  public startNextLevel() {
    this.level++;
    this.lives = 3;
    this.state = 'PLAYING';
    this.combo = 0;
    this.enemies = [];
    this.particles = [];
    this.lasers = [];
    this.powerups = [];
    this.targetEnemyId = null;
    this.targetPowerupId = null;
    this.lastSpawnTime = performance.now();
    this.enemiesSpawnedThisLevel = 0;
    
    this.updateLevelParameters();
    
    this.lastTime = performance.now();
    this.syncUI({ message: `MISSION SECTOR ${this.level}` });
    setTimeout(() => this.syncUI({ message: undefined }), 3000);
    
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.loop(performance.now());
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.syncUI();
      this.drawPauseScreen();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      this.syncUI();
      this.loop(performance.now());
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.togglePause();
      return;
    }

    if (this.state !== 'PLAYING') return;
    
    // Ignore meta keys
    if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;

    this.typeLetter(e.key);
  }

  public typeLetter(letter: string) {
    if (this.state !== 'PLAYING') return;

    const char = letter.toLowerCase();
    // only letters
    if (!/^[a-z]$/.test(char)) return;

    this.totalKeystrokes++;
    let hit = false;

    // Check targeted powerup first
    if (this.targetPowerupId) {
      const p = this.powerups.find(p => p.id === this.targetPowerupId);
      if (p) {
        const nextChar = p.word[p.typed.length];
        if (char === nextChar) {
          p.typed += char;
          hit = true;
          this.fireLaser(p.x, p.y, p.color, p.id, true);
          if (p.typed.length === p.word.length) {
            this.activatePowerup(p);
            this.powerups = this.powerups.filter(x => x.id !== p.id);
            this.targetPowerupId = null;
            this.createExplosion(p.x, p.y, p.color, 20);
          }
        }
      } else {
        this.targetPowerupId = null;
      }
    }

    // Check targeted enemy
    if (!hit && this.targetEnemyId) {
      const e = this.enemies.find(en => en.id === this.targetEnemyId);
      if (e) {
        const nextChar = e.word[e.typed.length];
        if (char === nextChar) {
          e.typed += char;
          hit = true;
          const damage = this.doubleDamageRemaining > 0 ? 2 : 1;
          
          for(let i=0; i<damage; i++) {
             if (e.typed.length < e.word.length && i > 0) {
                 e.typed += e.word[e.typed.length];
             }
             this.fireLaser(e.x, e.y, e.color, e.id, false);
          }

          if (e.typed.length >= e.word.length) {
            this.destroyEnemy(e);
            this.targetEnemyId = null;
          }
        }
      } else {
        this.targetEnemyId = null;
      }
    }

    // If no target, try to lock onto a new target
    if (!hit && !this.targetEnemyId && !this.targetPowerupId) {
      // Find enemies that start with the typed letter
      const matchingEnemies = this.enemies.filter(e => e.word.startsWith(char) && e.typed.length === 0);
      const matchingPowerups = this.powerups.filter(p => p.word.startsWith(char) && p.typed.length === 0);

      if (matchingPowerups.length > 0) {
        // Prefer powerups
        const p = matchingPowerups[0];
        p.typed += char;
        hit = true;
        this.targetPowerupId = p.id;
        this.fireLaser(p.x, p.y, p.color, p.id, true);
      } else if (matchingEnemies.length > 0) {
        // Lock onto closest enemy
        let closest = matchingEnemies[0];
        let minDist = closest.y;
        for (let i = 1; i < matchingEnemies.length; i++) {
          if (matchingEnemies[i].y > minDist) {
            closest = matchingEnemies[i];
            minDist = closest.y;
          }
        }
        closest.typed += char;
        hit = true;
        this.targetEnemyId = closest.id;
        this.fireLaser(closest.x, closest.y, closest.color, closest.id, false);
        
        if (this.doubleDamageRemaining > 0 && closest.typed.length < closest.word.length) {
             closest.typed += closest.word[closest.typed.length];
             this.fireLaser(closest.x, closest.y, closest.color, closest.id, false);
        }

        if (closest.typed.length >= closest.word.length) {
            this.destroyEnemy(closest);
            this.targetEnemyId = null;
        }
      }
    }

    if (hit) {
      this.correctKeystrokes++;
      this.combo++;
      this.score += 10 * Math.min(this.combo, 10);
      audio.playTypeHit(this.combo);
    } else {
      this.combo = 0;
      this.shakeTime = 100; // Small screen shake on miss
      audio.playTypeMiss();
    }

    this.syncUI();
  }

  private fireLaser(targetX: number, targetY: number, color: string, targetId: string, isPowerup: boolean) {
    this.lasers.push({
      id: Math.random().toString(),
      x: this.player.x,
      y: this.player.y - this.player.radius,
      targetX,
      targetY,
      speed: 1.5,
      color,
      enemyId: targetId
    });
  }

  private destroyEnemy(enemy: Enemy) {
    audio.playEnemyDestroyed();
    this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'Boss' ? 100 : 30);
    this.enemies = this.enemies.filter(e => e.id !== enemy.id);
    this.score += enemy.maxHealth * 50;
    this.shakeTime = enemy.type === 'Boss' ? 500 : 150;
    
    // Check level up
    if (this.enemiesSpawnedThisLevel >= this.enemiesToAdvance && this.enemies.length === 0) {
      if (this.level >= 50) {
        this.state = 'VICTORY';
      } else {
        this.state = 'LEVEL_COMPLETE';
      }
      audio.playLevelUp(this.level);
      this.syncUI();
    }
  }

  private updateLevelParameters() {
    this.enemiesToAdvance = Math.min(Math.floor(10 + this.level * 1.5), 50);
    this.spawnInterval = Math.max(3500 - (this.level * 60), 600);
  }

  private activatePowerup(p: Powerup) {
    audio.playPowerup(p.type.toLowerCase());
    switch (p.type) {
      case 'Freeze':
        this.freezeTimeRemaining = 5000;
        break;
      case 'Bomb':
        this.enemies.forEach(e => this.createExplosion(e.x, e.y, e.color, 30));
        this.score += this.enemies.length * 100;
        this.enemies = [];
        this.targetEnemyId = null;
        this.shakeTime = 800;
        break;
      case 'Double':
        this.doubleDamageRemaining = 10000;
        break;
      case 'Shield':
        this.hasShield = true;
        break;
    }
    this.syncUI({ message: `${p.type} Activated!` });
    setTimeout(() => this.syncUI({ message: undefined }), 2000);
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 500 + 300,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }

  private spawnEnemy() {
    const isBoss = this.level % 10 === 0 && this.enemiesSpawnedThisLevel === 0;
    
    let type: Enemy['type'] = 'Scout';
    let word = '';
    let radius = 15;
    let color = '#f0f';
    let health = 1;
    
    // Smooth, progressive speed base adjusted from easy to hard
    let speedMult = 0.65 + (this.level * 0.08); 

    if (isBoss) {
      type = 'Boss';
      word = getBossWord();
      radius = 40;
      color = '#f00';
      health = word.length;
      speedMult = Math.min(0.25 + (this.level * 0.02), 0.9); // Boss gets slightly faster as levels increase
    } else {
      const rand = Math.random();
      const tier = Math.ceil(this.level / 10);
      let difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy';
      
      if (tier === 1) {
        // Tier 1 (1-10): Mostly Scouts (easy/medium), some Fighters
        if (rand < 0.7) {
          type = 'Scout';
          difficulty = 'easy';
          color = '#00ffcc'; // Cool neon teal
        } else {
          type = 'Fighter';
          difficulty = 'medium';
          color = '#00ff66'; // Cool neon green
          radius = 18;
        }
      } else if (tier === 2) {
        // Tier 2 (11-20): Scouts (medium), Fighters (medium), Bombers (hard)
        if (rand < 0.3) {
          type = 'Scout';
          difficulty = 'medium';
          color = '#ffbb00'; // Neon amber
        } else if (rand < 0.8) {
          type = 'Fighter';
          difficulty = 'medium';
          color = '#ffff00'; // Neon yellow
          radius = 20;
        } else {
          type = 'Bomber';
          difficulty = 'hard';
          color = '#ff6600'; // Neon orange
          radius = 24;
        }
      } else if (tier === 3) {
        // Tier 3 (21-30): Less Scouts, more Fighters and Bombers
        if (rand < 0.15) {
          type = 'Scout';
          difficulty = 'medium';
          color = '#ff3366'; // Neon pink
        } else if (rand < 0.5) {
          type = 'Fighter';
          difficulty = 'hard';
          color = '#ff00ff'; // Neon magenta
          radius = 20;
        } else {
          type = 'Bomber';
          difficulty = 'expert';
          color = '#9933ff'; // Neon purple
          radius = 25;
        }
      } else if (tier === 4) {
        // Tier 4 (31-40): Expert levels
        if (rand < 0.3) {
          type = 'Fighter';
          difficulty = 'hard';
          color = '#ff00ff';
          radius = 20;
        } else {
          type = 'Bomber';
          difficulty = 'expert';
          color = '#ff3333'; // Hot red
          radius = 26;
        }
      } else {
        // Tier 5 (41-50): Master levels
        if (rand < 0.5) {
          type = 'Fighter';
          difficulty = 'expert';
          color = '#ff3333';
          radius = 22;
        } else {
          type = 'Bomber';
          difficulty = 'expert';
          color = '#ff0000'; // Pure red
          radius = 28;
        }
      }
      word = getRandomWord(difficulty);

      // Apply speed modifier based on difficulty to maintain balance
      if (difficulty === 'easy') {
        speedMult *= 1.1;
      } else if (difficulty === 'medium') {
        speedMult *= 0.9;
      } else if (difficulty === 'hard') {
        speedMult *= 0.75;
      } else if (difficulty === 'expert') {
        speedMult *= 0.6;
      }
    }

    // Avoid duplicate starting letters on screen if possible, but don't strictly enforce if many enemies
    let finalWord = word;
    let attempts = 0;
    const existingInitialChars = this.enemies.map(e => e.word[0]).concat(this.powerups.map(p => p.word[0]));
    let fallbackDifficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy';
    if (!isBoss) {
      const tier = Math.ceil(this.level / 10);
      if (tier === 1) fallbackDifficulty = type === 'Scout' ? 'easy' : 'medium';
      else if (tier === 2) fallbackDifficulty = type === 'Scout' ? 'medium' : type === 'Fighter' ? 'medium' : 'hard';
      else if (tier === 3) fallbackDifficulty = type === 'Scout' ? 'medium' : type === 'Fighter' ? 'hard' : 'expert';
      else fallbackDifficulty = type === 'Scout' ? 'hard' : 'expert';
    }
    
    while (existingInitialChars.includes(finalWord[0]) && attempts < 10 && !isBoss) {
      finalWord = getRandomWord(fallbackDifficulty);
      attempts++;
    }

    this.enemies.push({
      id: Math.random().toString(),
      word: finalWord,
      typed: '',
      x: Math.random() * (this.width - radius * 2) + radius,
      y: -radius * 2,
      vx: (Math.random() - 0.5) * speedMult * 0.05,
      vy: speedMult * 0.05,
      type,
      radius,
      maxHealth: finalWord.length,
      color
    });

    this.enemiesSpawnedThisLevel++;
  }

  private spawnPowerup() {
    if (Math.random() > 0.1) return; // 10% chance when called
    const types: Powerup['type'][] = ['Freeze', 'Bomb', 'Double', 'Shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    const wordNames = {
      'Freeze': 'freeze',
      'Bomb': 'bomb',
      'Double': 'double',
      'Shield': 'shield'
    };
    const word = wordNames[type];
    
    // Check if starting char conflicts
    const existingInitialChars = this.enemies.map(e => e.word[0]).concat(this.powerups.map(p => p.word[0]));
    if (existingInitialChars.includes(word[0])) return; // Skip spawn if conflict

    this.powerups.push({
      id: Math.random().toString(),
      type,
      word,
      typed: '',
      x: Math.random() * (this.width - 40) + 20,
      y: -20,
      vy: 0.03,
      radius: 12,
      color: '#fff'
    });
  }

  private loop(timestamp: number) {
    if (this.state !== 'PLAYING') return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.playTimeMs += dt;

    this.update(dt);
    this.draw();

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number) {
    // Timers
    if (this.freezeTimeRemaining > 0) this.freezeTimeRemaining -= dt;
    if (this.doubleDamageRemaining > 0) this.doubleDamageRemaining -= dt;
    if (this.shakeTime > 0) this.shakeTime -= dt;

    // Spawning
    const now = performance.now();
    if (now - this.lastSpawnTime > this.spawnInterval && this.enemiesSpawnedThisLevel < this.enemiesToAdvance) {
        this.spawnEnemy();
        this.lastSpawnTime = now;
        if (Math.random() < 0.15) this.spawnPowerup();
    }

    const speedMultiplier = this.freezeTimeRemaining > 0 ? 0.2 : 1;

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt * speedMultiplier;
      e.y += e.vy * dt * speedMultiplier;

      // Bounce off walls
      if (e.x < e.radius || e.x > this.width - e.radius) {
        e.vx *= -1;
        e.x = Math.max(e.radius, Math.min(e.x, this.width - e.radius));
      }

      // Collision with player / defense baseline
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const defenseThreshold = this.player.y + this.player.radius;
      
      if (dist < e.radius + this.player.radius || e.y >= defenseThreshold) {
        if (this.hasShield) {
          this.hasShield = false;
          this.createExplosion(e.x, e.y, '#00f', 50);
          this.syncUI({ message: 'Shield Broken!' });
          setTimeout(() => this.syncUI({ message: undefined }), 2000);
        } else {
          this.lives--;
          this.combo = 0;
          this.shakeTime = 1000;
          if (this.lives <= 0) {
            audio.playGameOver();
            this.state = 'GAME_OVER';
            this.syncUI();
            return;
          }
        }
        
        if (this.targetEnemyId === e.id) this.targetEnemyId = null;
        this.enemies.splice(i, 1);
        this.syncUI();
      }
    }

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy * dt * speedMultiplier;
      if (p.y > this.height + p.radius) {
        if (this.targetPowerupId === p.id) this.targetPowerupId = null;
        this.powerups.splice(i, 1);
      }
    }

    // Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      
      // Update target pos if target still exists
      let target = this.enemies.find(e => e.id === l.enemyId) as any || this.powerups.find(p => p.id === l.enemyId);
      if (target) {
        l.targetX = target.x;
        l.targetY = target.y;
      }
      
      const dx = l.targetX - l.x;
      const dy = l.targetY - l.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 10) {
        this.lasers.splice(i, 1);
        this.createExplosion(l.targetX, l.targetY, l.color, 3);
      } else {
        l.x += (dx / dist) * l.speed * dt;
        l.y += (dy / dist) * l.speed * dt;
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 0.1;
      p.y += p.vy * dt * 0.1;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private draw() {
    const ctx = this.ctx as CanvasRenderingContext2D;
    
    // Clear canvas to let CSS background show through
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    
    // Screen shake
    if (this.shakeTime > 0) {
      const intensity = (this.shakeTime / 1000) * 10;
      ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
    }

    // Draw Particles
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Lasers
    ctx.lineWidth = 3;
    for (const l of this.lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      const angle = Math.atan2(l.targetY - l.y, l.targetX - l.x);
      ctx.lineTo(l.x - Math.cos(angle) * 15, l.y - Math.sin(angle) * 15);
      ctx.strokeStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Powerups
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.powerups) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw symbol inside
      ctx.fillStyle = p.color;
      const symbol = p.type === 'Freeze' ? '❄' : p.type === 'Bomb' ? '💣' : p.type === 'Double' ? 'x2' : '🛡';
      ctx.fillText(symbol, p.x, p.y);

      // Draw word below
      this.drawWord(ctx, p.word, p.typed, p.x, p.y + p.radius + 15, p.color, this.targetPowerupId === p.id);
    }

    // Draw Enemies
    for (const e of this.enemies) {
      // Body
      ctx.beginPath();
      if (e.type === 'Boss') {
        ctx.moveTo(e.x, e.y - e.radius);
        ctx.lineTo(e.x + e.radius, e.y);
        ctx.lineTo(e.x, e.y + e.radius);
        ctx.lineTo(e.x - e.radius, e.y);
      } else if (e.type === 'Bomber') {
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      } else if (e.type === 'Fighter') {
        ctx.moveTo(e.x, e.y + e.radius);
        ctx.lineTo(e.x + e.radius, e.y - e.radius);
        ctx.lineTo(e.x - e.radius, e.y - e.radius);
      } else {
        // Scout
        ctx.moveTo(e.x, e.y + e.radius);
        ctx.lineTo(e.x + e.radius / 2, e.y - e.radius);
        ctx.lineTo(e.x - e.radius / 2, e.y - e.radius);
      }
      ctx.closePath();
      
      const isTarget = this.targetEnemyId === e.id;
      
      ctx.strokeStyle = e.color;
      ctx.lineWidth = isTarget ? 3 : 2;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = isTarget ? 15 : 5;
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(10, 8, 28, 0.75)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Word
      this.drawWord(ctx, e.word, e.typed, e.x, e.y + e.radius + 15, e.color, isTarget);
    }

    // Draw Player
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y - this.player.radius);
    ctx.lineTo(this.player.x + this.player.radius, this.player.y + this.player.radius);
    ctx.lineTo(this.player.x, this.player.y + this.player.radius / 2);
    ctx.lineTo(this.player.x - this.player.radius, this.player.y + this.player.radius);
    ctx.closePath();
    
    ctx.strokeStyle = this.hasShield ? '#00f' : this.player.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.fillStyle = 'rgba(10, 8, 28, 0.75)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shield effect
    if (this.hasShield) {
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    
    // Double damage aura
    if (this.doubleDamageRemaining > 0) {
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawWord(ctx: CanvasRenderingContext2D, word: string, typed: string, x: number, y: number, color: string, isTarget: boolean) {
    ctx.font = (isTarget ? 'bold 18px' : '16px') + ' "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    
    const textWidth = ctx.measureText(word).width;
    const padX = 8;
    const padY = 4;
    const boxHeight = 24;
    const boxWidth = textWidth + padX * 2;
    const halfBox = boxWidth / 2;

    // Clamp word box so it never clips off mobile screen borders
    const clampedX = Math.max(halfBox + 8, Math.min(this.width - halfBox - 8, x));
    let startX = clampedX - textWidth / 2;
    
    // Draw beautiful transparent dark background box for perfect readability
    ctx.fillStyle = 'rgba(6, 4, 21, 0.8)';
    ctx.strokeStyle = isTarget ? 'rgba(0, 242, 255, 0.45)' : 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 1.5;
    
    const rx = clampedX - halfBox;
    const ry = y - 14;
    
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(rx, ry, boxWidth, boxHeight, 5);
    } else {
      ctx.rect(rx, ry, boxWidth, boxHeight);
    }
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const charWidth = ctx.measureText(char).width;
      
      if (i < typed.length) {
        // Typed (Glowing Cyan-White)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 8;
      } else if (i === typed.length && isTarget) {
        // Next char (Hot glowing magenta/pink to guide user)
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 10;
      } else {
        // Untyped (Bright neon enemy-themed color)
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 0;
      }
      
      ctx.fillText(char, startX + charWidth / 2, y + 2);
      startX += charWidth;
      ctx.globalAlpha = 1.0;
    }
    ctx.shadowBlur = 0;
  }

  private drawStartScreen() {
    const ctx = this.ctx as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.width, this.height);
    // UI layer handles the actual text
  }

  private drawPauseScreen() {
    const ctx = this.ctx as CanvasRenderingContext2D;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private syncUI(extra?: Partial<UIState>) {
    const minutes = this.playTimeMs / 60000;
    const wpm = minutes > 0 ? Math.round((this.correctKeystrokes / 5) / minutes) : 0;
    const accuracy = this.totalKeystrokes > 0 ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100) : 100;

    let targetWord = undefined;
    let typedWord = undefined;
    if (this.targetEnemyId) {
      const e = this.enemies.find(en => en.id === this.targetEnemyId);
      if (e) {
        targetWord = e.word;
        typedWord = e.typed;
      }
    } else if (this.targetPowerupId) {
      const p = this.powerups.find(po => po.id === this.targetPowerupId);
      if (p) {
        targetWord = p.word;
        typedWord = p.typed;
      }
    }

    this.onUIUpdate({
      state: this.state,
      score: this.score,
      lives: this.lives,
      level: this.level,
      combo: this.combo,
      accuracy,
      wpm,
      targetWord,
      typedWord,
      activeBuffs: {
        freeze: this.freezeTimeRemaining,
        double: this.doubleDamageRemaining,
        shield: this.hasShield
      },
      ...extra
    });
  }
}
