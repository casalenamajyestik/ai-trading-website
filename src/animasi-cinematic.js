/**
 * Cinematic Particle Animation - Wide Horizontal Format
 * Glowing particles with sequential sparkles, cinematic depth
 * Designed for 2/3 width container (~1200x350px at desktop)
 */

export class CinematicParticleAnimation {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      console.error('[CinematicAnimation] Container not found:', container);
      return;
    }

    this.options = {
      width: options.width || this.container.clientWidth || 1200,
      height: options.height || this.container.clientHeight || 350,
      particleCount: options.particleCount || 400,
      maxSparkleCount: options.maxSparkleCount || 3, // max simultaneous sparkles
      sparkleInterval: options.sparkleInterval || 150, // ms between sparkle triggers
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.lastTime = 0;
    this.sparkleTimer = 0;
    this.cameraOffset = { x: 0, y: 0 };
    this.cameraTarget = { x: 0, y: 0 };

    // Expanded crypto coin names and wallet address prefixes for text labels
    this.cryptoLabels = [
      // Major coins (Top 100+)
      'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'AVAX',
      'LINK', 'UNI', 'LTC', 'BCH', 'ATOM', 'NEAR', 'ALGO', 'ICP', 'VET', 'FIL',
      'THETA', 'XTZ', 'EOS', 'AAVE', 'MKR', 'COMP', 'SNX', 'YFI', 'SUSHI', 'CRV',
      '1INCH', 'BAL', 'REN', 'KNC', 'ZRX', 'BAT', 'MANA', 'SAND', 'AXS', 'GALA',
      'ENJ', 'CHZ', 'HOT', 'ANKR', 'CRO', 'FTM', 'ONE', 'HBAR', 'EGLD', 'FLOW',
      'RUNE', 'KSM', 'DASH', 'ZEC', 'XMR', 'ETC', 'QTUM', 'ZIL', 'ONT', 'IOST',
      'WAVES', 'LSK', 'STEEM', 'HIVE', 'SC', 'DGB', 'RVN', 'NANO', 'BTT', 'WIN',
      'TRX', 'SUN', 'JST', 'BTT', 'WIN', 'SEED', 'CRO', 'VRA', 'TVK', 'REEF',
      'BAKE', 'BURGER', 'SUSHI', 'UNI', 'COMP', 'AAVE', 'MKR', 'SNX', 'YFI', 'CRV',
      'SUSHI', 'BAL', 'REN', 'KNC', 'ZRX', 'BAT', 'UMA', 'NMR', 'MLN', 'REP',
      'GNO', 'DXD', 'RAI', 'FEI', 'TRIBE', 'INDEX', 'DPI', 'MVI', 'DEFI', 'YFL',
      
      // Wallet address prefixes (0x + 4-8 chars) - more variety
      '0x7a3f', '0x9b2e', '0x1c4d', '0x8f6a', '0x3d9e', '0x5b1c', '0x2e8f', '0x4a7d',
      '0x6f3b', '0x9c1e', '0xad5f', '0x7e2a', '0x3b9c', '0x5d8f', '0x1a6e', '0x4f2b',
      '0x8c9d', '0x2e7a', '0x6b3f', '0x9d4c', '0x1e8a', '0x5f2d', '0x3a7b', '0x7c9e',
      '0x4b1f', '0x8d6a', '0x2c5e', '0x6f9b', '0x1a3d', '0x5e8c', '0x9f2a', '0x3d7b',
      '0xa1b2', '0xc3d4', '0xe5f6', '0x7890', '0x1234', '0x5678', '0x9abc', '0xdef0',
      '0x1357', '0x2468', '0x9753', '0x8642', '0xabcd', '0xef12', '0x3456', '0x789a',
      '0xbcde', '0xf012', '0x3456', '0x7890', '0xabcd', '0xef12', '0x3456', '0x7890',
      '0xdead', '0xbeef', '0xcafe', '0xbabe', '0xfeed', '0xface', '0xfade', '0xc0de',
      '0x1bad', '0xfood', '0xbed', '0xdada', '0xbead', '0xseed', '0xneed', '0xfeel',
      '0xcool', '0xwarm', '0xfire', '0xice', '0xwind', '0xrain', '0xstorm', '0xcalm',
      '0xmoon', '0xmars', '0xstar', '0xsky', '0xcloud', '0xsun', '0xdawn', '0xdusk',
    ];

    // Shuffle labels for random distribution
    this.shuffledLabels = this.shuffleArray([...this.cryptoLabels]);
    this.labelIndex = 0;
    this.cyclesCompleted = 0;
    this.lastLabelReassignTime = 0;
    this.labelReassignInterval = 15000; // Reassign labels every 15 seconds

    // Color palette - cinematic tech colors - EXTENDED VARIETY
    this.colorPalette = [
      // Blues & Cyans
      { base: '#00ffff', glow: '#00ffff', name: 'electric-cyan' },
      { base: '#00ddff', glow: '#44eeff', name: 'bright-cyan' },
      { base: '#00bbff', glow: '#55ccff', name: 'sky-cyan' },
      { base: '#0099ff', glow: '#44aaff', name: 'electric-blue' },
      { base: '#0077ff', glow: '#5599ff', name: 'deep-blue' },
      { base: '#0055ff', glow: '#6688ff', name: 'royal-blue' },
      { base: '#2288ff', glow: '#66aaff', name: 'azure' },
      { base: '#44aaff', glow: '#88ccff', name: 'light-blue' },
      
      // Purples & Violets
      { base: '#8844ff', glow: '#aa66ff', name: 'purple' },
      { base: '#aa22ff', glow: '#cc66ff', name: 'vivid-purple' },
      { base: '#bb00ff', glow: '#dd44ff', name: 'electric-purple' },
      { base: '#9933ff', glow: '#bb66ff', name: 'amethyst' },
      { base: '#7700ff', glow: '#9944ff', name: 'deep-violet' },
      { base: '#aa44ff', glow: '#cc88ff', name: 'lavender' },
      { base: '#cc66ff', glow: '#dd99ff', name: 'light-purple' },
      
      // Magentas & Pinks
      { base: '#cc00ff', glow: '#dd66ff', name: 'magenta' },
      { base: '#ff00cc', glow: '#ff44dd', name: 'hot-magenta' },
      { base: '#ff3388', glow: '#ff66aa', name: 'pink' },
      { base: '#ff1177', glow: '#ff5599', name: 'deep-pink' },
      { base: '#ff55aa', glow: '#ff88cc', name: 'rose' },
      { base: '#ff77bb', glow: '#ff99dd', name: 'light-pink' },
      { base: '#ff0088', glow: '#ff44aa', name: 'fuchsia' },
      
      // Reds & Oranges
      { base: '#ff4422', glow: '#ff6644', name: 'red' },
      { base: '#ff3300', glow: '#ff5533', name: 'vermilion' },
      { base: '#ff6600', glow: '#ff8833', name: 'orange-red' },
      { base: '#ff8800', glow: '#ffaa33', name: 'orange' },
      { base: '#ffaa00', glow: '#ffcc33', name: 'amber' },
      { base: '#ffcc00', glow: '#ffdd44', name: 'gold' },
      
      // Yellows & Greens
      { base: '#ffdd00', glow: '#ffee44', name: 'yellow' },
      { base: '#ffee00', glow: '#ffff44', name: 'bright-yellow' },
      { base: '#ccff00', glow: '#ddff44', name: 'lime' },
      { base: '#aaff00', glow: '#ccff44', name: 'neon-green' },
      { base: '#88ff44', glow: '#aaff66', name: 'spring-green' },
      { base: '#44ff88', glow: '#66ffaa', name: 'green' },
      { base: '#00ff88', glow: '#44ffaa', name: 'emerald' },
      { base: '#00ffaa', glow: '#44ffcc', name: 'mint' },
      
      // Teals & Aquas
      { base: '#00ffcc', glow: '#44ffdd', name: 'teal' },
      { base: '#00ffaa', glow: '#44ffcc', name: 'aqua' },
      { base: '#00ccaa', glow: '#44ddcc', name: 'turquoise' },
      { base: '#00aa88', glow: '#33ccaa', name: 'sea-green' },
    ];

    this.init();
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Periodically reassign labels to different particles for more randomness
  reassignLabels(time) {
    if (time - this.lastLabelReassignTime > this.labelReassignInterval) {
      this.lastLabelReassignTime = time;
      
      // Reshuffle the label pool
      this.shuffledLabels = this.shuffleArray([...this.cryptoLabels]);
      this.labelIndex = 0;
      
      // Reassign labels to visible particles
      this.particles.forEach(p => {
        if (p.labelVisible) {
          // 30% chance to get a new label
          if (Math.random() < 0.3) {
            p.label = this.getNextLabel();
          }
        } else {
          // 15% chance for a previously unlabeled particle to get a label
          if (Math.random() < 0.15) {
            p.label = this.getNextLabel();
            p.labelVisible = true;
            p.labelAlpha = 0;
            p.labelTargetAlpha = 0.3 + Math.random() * 0.4;
            p.labelScale = 1;
          }
        }
      });
    }
  }

  getNextLabel() {
    const label = this.shuffledLabels[this.labelIndex];
    this.labelIndex = (this.labelIndex + 1) % this.shuffledLabels.length;
    if (this.labelIndex === 0) {
      this.cyclesCompleted++;
      // Reshuffle after each full cycle for more randomness
      this.shuffledLabels = this.shuffleArray([...this.cryptoLabels]);
    }
    return label;
  }

  init() {
    this.createCanvas();
    this.createParticles();
    this.bindResize();
    this.animate(0);
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.borderRadius = 'var(--radius-lg, 16px)';
    this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    
    this.resize();
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.options.width = rect.width;
    this.options.height = rect.height;
    
    this.canvas.width = this.options.width * dpr;
    this.canvas.height = this.options.height * dpr;
    this.canvas.style.width = this.options.width + 'px';
    this.canvas.style.height = this.options.height + 'px';
    
    this.ctx.scale(dpr, dpr);
    
    // Recreate particles if significant size change
    if (this.particles.length > 0) {
      this.particles.forEach(p => p.onResize(this.options.width, this.options.height));
    }
  }

  bindResize() {
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.container);
    this.resizeObserver = ro;
  }

  createParticles() {
    this.particles = [];
    const { width, height } = this.options;
    
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push(this.createParticle(width, height, i));
    }
    
    // Sort by depth (z) for proper rendering order - far to near
    this.particles.sort((a, b) => a.z - b.z);
  }

  createParticle(width, height, index) {
      const color = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
      const isForeground = Math.random() < 0.15; // 15% foreground particles
    
      // Depth layer: 0 = far, 1 = near
      const z = isForeground ? 0.7 + Math.random() * 0.3 : Math.random() * 0.7;
    
      // Size based on depth
      const baseSize = isForeground ? 2.5 + Math.random() * 3 : 0.5 + Math.random() * 2;
    
      // Position - distribute across full width, slight bias to center vertically
      const x = -width * 0.1 + Math.random() * width * 1.2;
      const y = height * 0.15 + Math.random() * height * 0.7;
    
      // Movement
      const angle = Math.random() * Math.PI * 2;
      const speed = (isForeground ? 0.3 + Math.random() * 0.5 : 0.05 + Math.random() * 0.2) * (0.5 + z * 0.5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed * 0.5; // less vertical movement
    
      // Sparkle timing - each particle has its own cycle
      const sparklePhase = Math.random() * Math.PI * 2;
      const sparkleInterval = 3000 + Math.random() * 7000; // 3-10 seconds between sparkles
      const sparkleDuration = 800 + Math.random() * 1200; // 0.8-2s sparkle duration
    
      // Assign label to this particle (more particles get labels)
      const hasLabel = Math.random() < 0.25; // ~25% of particles get labels (increased from 12%)
      const label = hasLabel ? this.getNextLabel() : null;
    
      return {
        // Position
        x, y,
        baseX: x,
        baseY: y,
        index: index,
      
        // Velocity
        vx, vy,
      
        // Visual
        size: baseSize,
        baseSize: baseSize,
        color: color,
        brightness: 0.2 + Math.random() * 0.4, // base brightness 0.2-0.6
        z: z,
      
        // Label
        label: label,
        labelScale: 1,
        labelAlpha: 0,
        labelTargetAlpha: hasLabel ? 0.3 + Math.random() * 0.4 : 0,
        labelVisible: hasLabel,
      
        // Sparkle state
        isSparkling: false,
        sparkleProgress: 0,
        sparklePhase: sparklePhase,
        sparkleInterval: sparkleInterval,
        sparkleDuration: sparkleDuration,
        lastSparkleTime: -sparkleInterval * Math.random(), // stagger initial
      
        // Glow
        glowIntensity: 0.3 + Math.random() * 0.5,
      
        // Motion blur trail
        trail: [],
        maxTrailLength: isForeground ? 8 : 4,
      
        // Camera parallax
        parallaxFactor: 0.5 + z * 1.5, // near particles move more
      
        // Methods
        onResize(newWidth, newHeight) {
          const scaleX = newWidth / width;
          const scaleY = newHeight / height;
          this.x *= scaleX;
          this.y *= scaleY;
          this.baseX *= scaleX;
          this.baseY *= scaleY;
        },
      
      update(deltaTime, cameraOffset, time) {
        // Camera parallax movement
        this.x += -cameraOffset.x * this.parallaxFactor * 0.01;
        this.y += -cameraOffset.y * this.parallaxFactor * 0.01;
        
        // Natural drift
        this.x += this.vx * deltaTime * 0.06;
        this.y += this.vy * deltaTime * 0.06;
        
        // Subtle oscillation
        this.x += Math.sin(time * 0.001 + this.sparklePhase) * 0.05 * deltaTime;
        this.y += Math.cos(time * 0.0015 + this.sparklePhase) * 0.03 * deltaTime;
        
        // Wrap around horizontally (infinite field)
        const margin = 100;
        if (this.x < -margin) this.x = this.options?.width + margin;
        if (this.x > this.options?.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = this.options?.height + margin;
        if (this.y > this.options?.height + margin) this.y = -margin;
        
        // Update trail for motion blur
        this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) this.trail.pop();
        
        // Sparkle logic
        const timeSinceSparkle = time - this.lastSparkleTime;
        
        if (!this.isSparkling && timeSinceSparkle > this.sparkleInterval) {
          // Trigger sparkle
          this.isSparkling = true;
          this.sparkleProgress = 0;
          this.lastSparkleTime = time;
        }
        
        if (this.isSparkling) {
          this.sparkleProgress += deltaTime / this.sparkleDuration;
          if (this.sparkleProgress >= 1) {
            this.isSparkling = false;
            this.sparkleProgress = 0;
            // Randomize next interval
            this.sparkleInterval = 3000 + Math.random() * 7000;
            this.sparkleDuration = 800 + Math.random() * 1200;
          }
        }
        
        // Label animation - sync with sparkle
        if (this.labelVisible) {
          const targetAlpha = this.isSparkling ? 1.0 : this.labelTargetAlpha;
          this.labelAlpha += (targetAlpha - this.labelAlpha) * 0.08;
          
          // Scale pulse during sparkle
          if (this.isSparkling) {
            const p = this.sparkleProgress;
            if (p < 0.35) {
              this.labelScale = 1 + p * 1.2; // grow during flash
            } else {
              this.labelScale = 1.5 - (p - 0.35) / 0.65 * 0.5; // shrink back
            }
          } else {
            this.labelScale += (1 - this.labelScale) * 0.05; // return to 1
          }
        }
      },
      
      getCurrentBrightness() {
        if (!this.isSparkling) return this.brightness;
        
        // Sparkle curve: ease in → peak → ease out
        const p = this.sparkleProgress;
        let sparkleMult;
        if (p < 0.15) {
          // Quick ramp up
          sparkleMult = 1 + (p / 0.15) * 8; // 1x to 9x
        } else if (p < 0.35) {
          // Peak flash
          sparkleMult = 9 - (p - 0.15) / 0.2 * 3; // 9x to 6x
        } else if (p < 0.65) {
          // Expanding halo
          sparkleMult = 6 - (p - 0.35) / 0.3 * 4; // 6x to 2x
        } else {
          // Fade out
          sparkleMult = 2 - (p - 0.65) / 0.35 * 1; // 2x to 1x
        }
        return Math.min(this.brightness * sparkleMult, 1.0);
      },
      
      getCurrentSize() {
        if (!this.isSparkling) return this.size;
        const p = this.sparkleProgress;
        if (p < 0.35) {
          return this.size * (1 + p * 1.5); // expand during flash
        } else if (p < 0.65) {
          return this.size * (1.5 - (p - 0.35) / 0.3 * 0.5); // halo expand
        }
        return this.size;
      },
      
      getGlowRadius() {
        const baseGlow = this.size * this.glowIntensity * 8;
        if (!this.isSparkling) return baseGlow;
        const p = this.sparkleProgress;
        if (p < 0.35) return baseGlow * (1 + p * 6);
        if (p < 0.65) return baseGlow * (4 - (p - 0.35) / 0.3 * 2);
        return baseGlow * (1 + (1 - p) * 0.5);
      }
    };
  }

  animate(time) {
    if (!this.ctx) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    // Subtle camera movement - slow float
    const cameraSpeed = 0.00008;
    this.cameraTarget.x = Math.sin(time * cameraSpeed) * 40;
    this.cameraTarget.y = Math.cos(time * cameraSpeed * 0.7) * 20;
    
    // Smooth camera follow
    this.cameraOffset.x += (this.cameraTarget.x - this.cameraOffset.x) * 0.02;
    this.cameraOffset.y += (this.cameraTarget.y - this.cameraOffset.y) * 0.02;
    
    // Reassign labels periodically for more randomness
    this.reassignLabels(time);
    
    // Clear with dark background
    this.ctx.fillStyle = '#03050a'; // very dark charcoal
    this.ctx.fillRect(0, 0, this.options.width, this.options.height);
    
    // Update and draw particles (far to near for depth)
    this.particles.forEach(p => {
      p.options = this.options; // for wrap bounds
      p.update(deltaTime, this.cameraOffset, time);
      this.drawParticle(p);
    });
    
    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  drawParticle(p) {
    const ctx = this.ctx;
    const brightness = p.getCurrentBrightness();
    const size = p.getCurrentSize();
    const glowRadius = p.getGlowRadius();
    const alpha = brightness * (0.4 + p.z * 0.6); // far = more transparent
    
    const x = p.x + this.cameraOffset.x * p.parallaxFactor;
    const y = p.y + this.cameraOffset.y * p.parallaxFactor;
    
    // Draw trail (motion blur)
    if (p.trail.length > 1) {
      p.trail.forEach((pos, i) => {
        const trailAlpha = alpha * (1 - i / p.trail.length) * 0.15;
        const trailSize = size * (1 - i / p.trail.length) * 0.7;
        if (trailAlpha > 0.01) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = this.hexToRgba(p.color.base, trailAlpha);
          ctx.fill();
        }
      });
    }
    
    // Draw glow (soft bloom)
    if (glowRadius > 1 && alpha > 0.05) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
      const glowAlpha = alpha * 0.6;
      gradient.addColorStop(0, this.hexToRgba(p.color.glow, glowAlpha * 0.8));
      gradient.addColorStop(0.3, this.hexToRgba(p.color.glow, glowAlpha * 0.4));
      gradient.addColorStop(0.7, this.hexToRgba(p.color.glow, glowAlpha * 0.1));
      gradient.addColorStop(1, this.hexToRgba(p.color.glow, 0));
      
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    // Draw core particle
    if (size > 0.3 && alpha > 0.02) {
      // Bright core during sparkle
      if (p.isSparkling && p.sparkleProgress < 0.35) {
        // Intense white-hot core
        const coreAlpha = Math.min(alpha * 2, 1);
        const coreSize = size * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
        ctx.fill();
      }
      
      // Main colored particle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = this.hexToRgba(p.color.base, alpha);
      ctx.fill();
      
      // Sparkle halo ring (during flash peak)
      if (p.isSparkling && p.sparkleProgress > 0.15 && p.sparkleProgress < 0.5) {
        const ringAlpha = alpha * (1 - (p.sparkleProgress - 0.15) / 0.35) * 0.8;
        const ringSize = size * (1 + (p.sparkleProgress - 0.15) / 0.35 * 3);
        ctx.beginPath();
        ctx.arc(x, y, ringSize, 0, Math.PI * 2);
        ctx.strokeStyle = this.hexToRgba(p.color.glow, ringAlpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    
    // Draw label text (below particle, synced with sparkle)
    if (p.labelVisible && p.label && p.labelAlpha > 0.02) {
      this.drawLabel(ctx, x, y + size + 8, p);
    }
  }
  
  drawLabel(ctx, x, y, p) {
    const ctx2 = ctx;
    const scale = p.labelScale || 1;
    const alpha = Math.min(p.labelAlpha * (0.4 + p.z * 0.6), 1);
    
    if (alpha < 0.02) return;
    
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.scale(scale, scale);
    
    // Text style based on particle depth - SMALLER FONT
    const fontSize = Math.max(8, Math.min(11, 9 * (0.5 + p.z * 0.5)));
    ctx2.font = `500 ${fontSize}px 'Geist', 'SF Pro Display', -apple-system, sans-serif`;
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'top';
    
    // Text color matches particle color
    const textColor = this.hexToRgba(p.color.glow, alpha);
    const shadowColor = this.hexToRgba(p.color.glow, alpha * 0.5);
    
    // Glow/shadow for readability
    ctx2.shadowColor = shadowColor;
    ctx2.shadowBlur = 8 * scale;
    ctx2.shadowOffsetX = 0;
    ctx2.shadowOffsetY = 0;
    
    ctx2.fillStyle = textColor;
    ctx2.fillText(p.label, 0, 0);
    
    // Additional bright core during sparkle
    if (p.isSparkling && p.sparkleProgress < 0.5) {
      const sparkleAlpha = alpha * (1 - p.sparkleProgress / 0.5) * 0.8;
      ctx2.shadowColor = `rgba(255, 255, 255, ${sparkleAlpha})`;
      ctx2.shadowBlur = 16 * scale;
      ctx2.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      ctx2.fillText(p.label, 0, 0);
    }
    
    ctx2.restore();
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.particles = [];
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CinematicParticleAnimation;
}

// Global for direct script usage
window.CinematicParticleAnimation = CinematicParticleAnimation;