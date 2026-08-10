/**
 * Data Robot Animation - Animated robot pulling data from multiple sources
 * Generates an interactive SVG with animated data streams
 */

export class DataRobotAnimation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 600,
      height: options.height || 280,
      sources: options.sources || [
        { id: 'market', name: 'Market Data', color: 'var(--accent-primary)', icon: '📈' },
        { id: 'exchange', name: 'Exchange API', color: 'var(--accent-secondary)', icon: '🔗' },
        { id: 'ai', name: 'AI Models', color: 'var(--accent-warm)', icon: '🧠' },
        { id: 'news', name: 'News Feed', color: '#a855f7', icon: '📰' },
        { id: 'chain', name: 'On-Chain', color: '#f97316', icon: '⛓️' },
        { id: 'social', name: 'Social Sentiment', color: '#ec4899', icon: '💬' },
        { id: 'whale', name: 'Whale Alerts', color: '#06b6d4', icon: '🐋' },
        { id: 'macro', name: 'Macro Events', color: '#84cc16', icon: '📅' }
      ],
      particleCount: options.particleCount || 120,
      ...options
    };
    
    this.svg = null;
    this.animationId = null;
    this.particles = [];
    this.time = 0;
    
    this.init();
  }
  
  init() {
    this.createSVG();
    this.buildRobot();
    this.buildDataStreams();
    this.buildProcessingCore();
    this.buildOutputDisplay();
    this.buildLegend();
    this.startAnimation();
  }
  
  createSVG() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    this.svg.setAttribute('class', 'data-robot-svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.container.appendChild(this.svg);
    
    // Add CSS styles inline for self-contained SVG
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .data-particle { opacity: 0; }
      .data-source-label { font-family: 'Geist', -apple-system, sans-serif; font-size: 10px; font-weight: 500; opacity: 0; pointer-events: none; }
      .data-connection { stroke-dasharray: 8 4; stroke-opacity: 0; }
      .processing-ring { stroke-dasharray: 30 10; stroke-opacity: 0.6; }
      .output-data { font-family: 'Geist', -apple-system, sans-serif; font-size: 11px; font-weight: 600; opacity: 0; }
      .output-data.positive { fill: var(--accent-secondary); }
      .output-data.negative { fill: var(--accent-danger); }
      .output-data.neutral { fill: var(--accent-primary); }
    `;
    this.svg.appendChild(style);
  }
  
  buildRobot() {
    const cx = this.options.width / 2;
    const cy = this.options.height / 2 + 10;
    
    const robotGroup = this.createGroup('robot-body');
    
    // Antenna
    const antenna = this.createGroup('robot-antenna');
    const antennaPath = this.createPath(
      `M${cx} ${cy - 90} Q${cx - 15} ${cy - 120} ${cx} ${cy - 130}`,
      'none',
      'var(--border-active)',
      3
    );
    antenna.appendChild(antennaPath);
    
    const antennaBall = this.createCircle(cx, cy - 130, 8, 'var(--accent-primary)', 'robot-antenna-ball');
    antennaBall.setAttribute('filter', 'drop-shadow(0 0 8px var(--accent-primary))');
    antenna.appendChild(antennaBall);
    
    // Antenna rings - more rings for visual density
    for (let i = 1; i <= 6; i++) {
      const ring = this.createCircle(cx, cy - 130, 8 + i * 5, 'none', 'processing-ring');
      ring.setAttribute('stroke', i % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)');
      ring.setAttribute('stroke-width', i <= 2 ? '1.5' : '1');
      ring.setAttribute('stroke-dasharray', i % 2 === 0 ? '20 10' : '10 10');
      ring.style.animationDelay = `${i * 1}s`; // Match faster durations
      antenna.appendChild(ring);
    }
    
    // Additional antenna decorative elements
    for (let i = 1; i <= 4; i++) {
      const decoration = this.createCircle(cx, cy - 130 - i * 8, 2 + i * 0.5, i % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-warm)');
      decoration.setAttribute('opacity', '0.4');
      decoration.style.animationDelay = `${i * 2}s`;
      antenna.appendChild(decoration);
    }
    
    robotGroup.appendChild(antenna);
    
    // Ears
    [-1, 1].forEach(side => {
      const ear = this.createGroup(`robot-ear`);
      const earX = cx + side * 35;
      const earY = cy - 65;
      
      const earShape = this.createPath(
        `M${earX} ${earY} L${earX + side * 8} ${earY - 20} L${earX + side * 18} ${earY - 5} Z`,
        'var(--bg-card-solid)',
        'var(--border-color)',
        1.5
      );
      ear.appendChild(earShape);
      
      // Ear inner
      const earInner = this.createPath(
        `M${earX} ${earY - 2} L${earX + side * 5} ${earY - 15} L${earX + side * 12} ${earY - 2} Z`,
        'var(--bg-tertiary)',
        'none',
        0
      );
      ear.appendChild(earInner);
      
      // Ear indicator light
      const earLight = this.createCircle(earX + side * 10, earY - 8, 3, side === 1 ? 'var(--accent-secondary)' : 'var(--accent-primary)');
      earLight.setAttribute('opacity', '0.8');
      ear.appendChild(earLight);
      
      robotGroup.appendChild(ear);
    });
    
    // Head
    const head = this.createGroup('robot-head');
    const headRect = this.createRect(cx - 50, cy - 85, 100, 70, 20, 'var(--bg-card-solid)', 'var(--border-color)', 1.5);
    head.appendChild(headRect);
    
    // Head glow
    const headGlow = this.createRect(cx - 50, cy - 85, 100, 70, 20, 'none', 'var(--accent-primary-glow)', 1);
    headGlow.setAttribute('opacity', '0.3');
    head.appendChild(headGlow);
    
    // Eyes
    [-1, 1].forEach(side => {
      const eyeX = cx + side * 18;
      const eyeY = cy - 55;
      
      const eye = this.createGroup('robot-eye');
      const eyeWhite = this.createEllipse(eyeX, eyeY, 14, 10, 'white');
      eye.appendChild(eyeWhite);
      
      const pupil = this.createCircle(eyeX, eyeY, 5, 'var(--accent-primary)', 'robot-eye-pupil');
      eye.appendChild(pupil);
      
      // Pupil highlight
      const highlight = this.createCircle(eyeX - 3, eyeY - 3, 2, 'white');
      highlight.setAttribute('opacity', '0.6');
      eye.appendChild(highlight);
      
      // Eye glow
      const eyeGlow = this.createCircle(eyeX, eyeY, 16, 'var(--accent-primary)');
      eyeGlow.setAttribute('opacity', '0.1');
      eyeGlow.setAttribute('filter', 'blur(4px)');
      eye.insertBefore(eyeGlow, eyeWhite);
      
      head.appendChild(eye);
    });
    
    // Mouth / Speaker
    const mouth = this.createGroup('robot-mouth');
    const mouthRect = this.createRect(cx - 20, cy - 28, 40, 8, 4, 'var(--bg-tertiary)', 'var(--border-color)', 1);
    mouth.appendChild(mouthRect);
    
    // Sound bars
    for (let i = 0; i < 5; i++) {
      const bar = this.createRect(cx - 16 + i * 8, cy - 24, 4, 4, 1, 'var(--accent-primary)');
      bar.setAttribute('opacity', '0.3 + Math.random() * 0.5');
      bar.style.animationDelay = `${i * 0.1}s`;
      mouth.appendChild(bar);
    }
    
    head.appendChild(mouth);
    
    // Status display on forehead
    const statusDisplay = this.createRect(cx - 30, cy - 78, 60, 12, 4, 'var(--bg-input)', 'var(--accent-primary)', 1);
    statusDisplay.setAttribute('opacity', '0.9');
    head.appendChild(statusDisplay);
    
    const statusText = this.createText(cx, cy - 70, 'PROCESSING', 'robot-status-text');
    statusText.setAttribute('font-size', '7');
    statusText.setAttribute('font-weight', '600');
    statusText.setAttribute('fill', 'var(--accent-primary)');
    statusText.setAttribute('text-anchor', 'middle');
    statusText.setAttribute('dominant-baseline', 'middle');
    head.appendChild(statusText);
    
    robotGroup.appendChild(head);
    
    // Torso
    const torso = this.createGroup('robot-torso');
    const torsoRect = this.createRect(cx - 60, cy - 15, 120, 90, 16, 'var(--bg-card-solid)', 'var(--border-color)', 1.5);
    torso.appendChild(torsoRect);
    
    // Core
    const coreGroup = this.createGroup('robot-core');
    
    // Core rings - more rings for visual density
    for (let i = 0; i < 6; i++) {
      const ring = this.createCircle(cx, cy + 30, 25 + i * 8, 'none', 'robot-core-ring' + (i % 2 === 1 ? ' reverse' : ''));
      ring.setAttribute('stroke', i % 3 === 0 ? 'var(--accent-primary)' : i % 3 === 1 ? 'var(--accent-secondary)' : 'var(--accent-warm)');
      ring.setAttribute('stroke-width', i < 2 ? '2' : '1');
      ring.setAttribute('stroke-opacity', '0.3');
      ring.setAttribute('stroke-dasharray', `${20 + i * 8} ${8 + i * 4}`);
      coreGroup.appendChild(ring);
    }
    
    // Additional core decorative rings
    for (let i = 0; i < 4; i++) {
      const decorRing = this.createCircle(cx, cy + 30, 80 + i * 15, 'none', 'robot-core-ring' + (i % 2 === 0 ? '' : ' reverse'));
      decorRing.setAttribute('stroke', i % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)');
      decorRing.setAttribute('stroke-width', '0.5');
      decorRing.setAttribute('stroke-opacity', '0.15');
      decorRing.setAttribute('stroke-dasharray', '5 15');
      decorRing.style.animationDuration = `${20 + i * 5}s`; // Match faster durations
      coreGroup.appendChild(decorRing);
    }
    
    // Core center
    const coreCenter = this.createCircle(cx, cy + 30, 18, 'var(--accent-primary)', 'robot-core');
    coreCenter.setAttribute('filter', 'drop-shadow(0 0 16px var(--accent-primary))');
    coreGroup.appendChild(coreCenter);
    
    // Core inner pulse
    const coreInner = this.createCircle(cx, cy + 30, 8, 'white');
    coreInner.setAttribute('opacity', '0.8');
    coreInner.setAttribute('filter', 'blur(2px)');
    coreGroup.appendChild(coreInner);
    
    torso.appendChild(coreGroup);
    
    // Core data readout
    const readoutBg = this.createRect(cx - 50, cy + 60, 100, 20, 6, 'var(--bg-input)', 'var(--border-subtle)', 1);
    torso.appendChild(readoutBg);
    
    const readoutText = this.createText(cx, cy + 73, '⟨ 4.2M data points/sec ⟩', 'core-readout');
    readoutText.setAttribute('font-size', '9');
    readoutText.setAttribute('fill', 'var(--text-secondary)');
    readoutText.setAttribute('text-anchor', 'middle');
    readoutText.setAttribute('dominant-baseline', 'middle');
    torso.appendChild(readoutText);
    
    // Side panels
    [-1, 1].forEach(side => {
      const panelX = cx + side * 62;
      const panelY = cy + 5;
      
      const panel = this.createRect(panelX - 12, panelY, 24, 50, 4, 'var(--bg-tertiary)', 'var(--border-subtle)', 1);
      torso.appendChild(panel);
      
      // Panel lights - more lights
      for (let i = 0; i < 8; i++) {
        const light = this.createCircle(panelX, panelY + 4 + i * 5, 2, 
          i % 3 === 0 ? 'var(--accent-primary)' : i % 3 === 1 ? 'var(--accent-secondary)' : 'var(--accent-warm)');
        light.setAttribute('opacity', '0.6');
        light.style.animationDelay = `${i * 1}s`; // Match faster durations
        torso.appendChild(light);
      }
      
      // Panel data display
      const panelDisplay = this.createRect(panelX - 10, panelY + 45, 20, 8, 2, 'var(--bg-input)', 'var(--border-subtle)', 0.5);
      torso.appendChild(panelDisplay);
      
      const panelText = this.createText(panelX, panelY + 50, side === -1 ? 'RX' : 'TX', 'panel-text');
      panelText.setAttribute('font-size', '6');
      panelText.setAttribute('fill', 'var(--text-muted)');
      panelText.setAttribute('text-anchor', 'middle');
      panelText.setAttribute('dominant-baseline', 'middle');
      torso.appendChild(panelText);
    });
    
    robotGroup.appendChild(torso);
    
    // Arms
    [-1, 1].forEach(side => {
      const armGroup = this.createGroup(`robot-arm robot-arm-${side === -1 ? 'left' : 'right'}`);
      
      const shoulderX = cx + side * 60;
      const shoulderY = cy - 5;
      const elbowX = shoulderX + side * 35;
      const elbowY = cy + 25;
      const handX = elbowX + side * 30;
      const handY = cy + 35;
      
      // Upper arm
      const upperArm = this.createPath(
        `M${shoulderX} ${shoulderY} L${elbowX} ${elbowY}`,
        'none',
        'var(--border-color)',
        12
      );
      upperArm.setAttribute('stroke-linecap', 'round');
      armGroup.appendChild(upperArm);
      
      // Lower arm
      const lowerArm = this.createPath(
        `M${elbowX} ${elbowY} L${handX} ${handY}`,
        'none',
        'var(--border-color)',
        10
      );
      lowerArm.setAttribute('stroke-linecap', 'round');
      armGroup.appendChild(lowerArm);
      
      // Joints
      const shoulderJoint = this.createCircle(shoulderX, shoulderY, 8, 'var(--bg-card-solid)', 'robot-joint');
      shoulderJoint.setAttribute('stroke', 'var(--border-color)');
      shoulderJoint.setAttribute('stroke-width', '1.5');
      armGroup.appendChild(shoulderJoint);
      
      const elbowJoint = this.createCircle(elbowX, elbowY, 6, 'var(--bg-card-solid)', 'robot-joint');
      elbowJoint.setAttribute('stroke', 'var(--border-color)');
      elbowJoint.setAttribute('stroke-width', '1.5');
      armGroup.appendChild(elbowJoint);
      
      // Hand
      const handGroup = this.createGroup('robot-hand');
      const handBase = this.createCircle(handX, handY, 12, 'var(--bg-card-solid)', 'robot-hand-base');
      handBase.setAttribute('stroke', 'var(--border-color)');
      handBase.setAttribute('stroke-width', '1.5');
      handGroup.appendChild(handBase);
      
      // Fingers
      for (let f = 0; f < 3; f++) {
        const fingerX = handX + side * (f - 1) * 5;
        const finger = this.createRect(fingerX - 2, handY - 16, 4, 16, 2, 'var(--bg-card-solid)');
        finger.setAttribute('stroke', 'var(--border-color)');
        finger.setAttribute('stroke-width', '1');
        handGroup.appendChild(finger);
        
        const fingertip = this.createCircle(fingerX, handY - 18, 3, side === 1 ? 'var(--accent-secondary)' : 'var(--accent-primary)');
        fingertip.setAttribute('opacity', '0.8');
        handGroup.appendChild(fingertip);
      }
      
      armGroup.appendChild(handGroup);
      robotGroup.appendChild(armGroup);
    });
    
    // Legs / Base
    const baseGroup = this.createGroup('robot-base');
    const baseRect = this.createRect(cx - 40, cy + 75, 80, 20, 6, 'var(--bg-secondary)', 'var(--border-color)', 1.5);
    baseGroup.appendChild(baseRect);
    
    // Base lights - more lights
    for (let i = 0; i < 12; i++) {
      const light = this.createCircle(cx - 55 + i * 10, cy + 85, 2, 
        i % 4 === 0 ? 'var(--accent-primary)' : i % 4 === 1 ? 'var(--accent-secondary)' : i % 4 === 2 ? 'var(--accent-warm)' : '#a855f7');
      light.setAttribute('opacity', '0.5');
      light.style.animationDelay = `${i * 1}s`; // Match faster durations
      baseGroup.appendChild(light);
    }
    
    // Base data display
    const baseDisplay = this.createRect(cx - 35, cy + 78, 70, 12, 3, 'var(--bg-input)', 'var(--border-subtle)', 0.5);
    baseGroup.appendChild(baseDisplay);
    
    const baseText = this.createText(cx, cy + 86, 'DATA PROCESSING UNIT v2.4.1', 'base-text');
    baseText.setAttribute('font-size', '6');
    baseText.setAttribute('fill', 'var(--text-muted)');
    baseText.setAttribute('text-anchor', 'middle');
    baseText.setAttribute('dominant-baseline', 'middle');
    baseGroup.appendChild(baseText);
    
    // Base decorative elements
    for (let i = 0; i < 4; i++) {
      const decor = this.createRect(cx - 38 + i * 24, cy + 73, 4, 2, 1, 'var(--accent-primary)');
      decor.setAttribute('opacity', '0.3');
      baseGroup.appendChild(decor);
    }
    
    robotGroup.appendChild(baseGroup);
    
    // Add floating data indicators around robot
    this.createFloatingIndicators(cx, cy, robotGroup);
    
    this.svg.appendChild(robotGroup);
  }
  
  buildDataStreams() {
    const cx = this.options.width / 2;
    const cy = this.options.height / 2 + 10;
    const headY = cy - 55;
    const handLeftX = cx - 90;
    const handLeftY = cy + 35;
    const handRightX = cx + 90;
    const handRightY = cy + 35;
    
    // Background particle field - ambient data particles
    this.createAmbientParticles(cx, cy);
    
    this.options.sources.forEach((source, sourceIndex) => {
      const isLeft = sourceIndex < 4; // 4 left, 4 right
      const sourceX = isLeft ? -50 : this.options.width + 50;
      const sourceY = headY - 40 + sourceIndex * 35;
      const targetX = isLeft ? handLeftX : handRightX;
      const targetY = isLeft ? handLeftY : handRightY;
      
      // Connection line - main
      const connection = this.createPath(
        this.createBezierPath(sourceX, sourceY, targetX, targetY, isLeft),
        'none',
        source.color,
        2
      );
      connection.setAttribute('class', `data-connection ${source.id}`);
      connection.style.animationDelay = `${sourceIndex * 1}s`;
      this.svg.appendChild(connection);
      
      // Secondary connection line (thinner, different path)
      const connection2 = this.createPath(
        this.createBezierPath(sourceX, sourceY + 10, targetX, targetY - 10, isLeft),
        'none',
        source.color,
        1
      );
      connection2.setAttribute('class', `data-connection ${source.id}`);
      connection2.setAttribute('stroke-dasharray', '4 8');
      connection2.setAttribute('stroke-opacity', '0.3');
      connection2.style.animationDelay = `${sourceIndex * 1 + 0.5}s`;
      this.svg.appendChild(connection2);
      
      // Source label
      const label = this.createText(sourceX + (isLeft ? 60 : -60), sourceY, `${source.icon} ${source.name}`, `data-source-label ${source.id}`);
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '500');
      label.setAttribute('fill', source.color);
      label.setAttribute('text-anchor', isLeft ? 'start' : 'end');
      label.setAttribute('dominant-baseline', 'middle');
      label.style.animationDelay = `${sourceIndex * 1}s`;
      this.svg.appendChild(label);
      
      // Source node
      const sourceNode = this.createCircle(sourceX + (isLeft ? 30 : -30), sourceY, 14, 'none');
      sourceNode.setAttribute('stroke', source.color);
      sourceNode.setAttribute('stroke-width', '2');
      sourceNode.setAttribute('opacity', '0.6');
      this.svg.appendChild(sourceNode);
      
      // Source pulse ring
      const pulseRing = this.createCircle(sourceX + (isLeft ? 30 : -30), sourceY, 20, 'none', 'processing-ring');
      pulseRing.setAttribute('stroke', source.color);
      pulseRing.setAttribute('stroke-width', '1.5');
      pulseRing.style.animationDelay = `${sourceIndex * 1 + 0.5}s`;
      this.svg.appendChild(pulseRing);
      
      // Secondary pulse rings
      for (let r = 1; r <= 2; r++) {
        const extraRing = this.createCircle(sourceX + (isLeft ? 30 : -30), sourceY, 20 + r * 12, 'none', 'processing-ring');
        extraRing.setAttribute('stroke', source.color);
        extraRing.setAttribute('stroke-width', '0.5');
        extraRing.setAttribute('stroke-opacity', '0.2');
        extraRing.setAttribute('stroke-dasharray', '5 15');
        extraRing.style.animationDelay = `${sourceIndex * 1 + 0.5 + r * 2}s`;
        extraRing.style.animationDuration = `${20 + r * 10}s`;
        this.svg.appendChild(extraRing);
      }
      
      // Generate particles for this stream
      const particleCount = Math.floor(this.options.particleCount / this.options.sources.length);
      for (let i = 0; i < particleCount; i++) {
        this.createParticle(sourceIndex, i, particleCount, source, isLeft, sourceX, sourceY, targetX, targetY);
      }
    });
  }
  
  createBezierPath(x1, y1, x2, y2, isLeft) {
    const midX = (x1 + x2) / 2;
    const ctrlOffset = isLeft ? 60 : -60;
    const ctrlX1 = x1 + (isLeft ? 40 : -40);
    const ctrlY1 = y1 - 30;
    const ctrlX2 = x2 + (isLeft ? -30 : 30);
    const ctrlY2 = y2 + 20;
    return `M${x1} ${y1} C${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${x2} ${y2}`;
  }
  
  createAmbientParticles(cx, cy) {
    // Create ambient background particles floating around the robot
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 80 + Math.random() * 120;
      const startX = cx + Math.cos(angle) * radius;
      const startY = cy + Math.sin(angle) * radius;
      const endX = cx + Math.cos(angle + (Math.random() - 0.5) * 0.5) * (radius + (Math.random() - 0.5) * 30);
      const endY = cy + Math.sin(angle + (Math.random() - 0.5) * 0.5) * (radius + (Math.random() - 0.5) * 30);
      const tx = endX - startX;
      const ty = endY - startY;
      
      const size = 1 + Math.random() * 2;
      const colorVariations = [
        'var(--accent-primary)',
        'var(--accent-secondary)',
        'var(--accent-warm)',
        '#a855f7',
        '#f97316',
        '#ec4899',
        '#06b6d4',
        '#84cc16'
      ];
      const color = colorVariations[Math.floor(Math.random() * colorVariations.length)];
      const delay = Math.random() * 8;
      
      const particle = this.createCircle(startX, startY, size, color, 'data-particle ambient');
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${8 + Math.random() * 4}s`;
      particle.setAttribute('opacity', '0.3');
      particle.setAttribute('filter', `drop-shadow(0 0 ${size * 3}px ${color})`);
      
      this.svg.appendChild(particle);
    }
  }
  
  createFloatingIndicators(cx, cy, robotGroup) {
    // Floating data indicators around the robot
    const indicators = [
      { x: cx - 150, y: cy - 60, text: 'BTC: ↑', color: 'var(--accent-primary)' },
      { x: cx + 150, y: cy - 60, text: 'ETH: ↑', color: 'var(--accent-secondary)' },
      { x: cx - 140, y: cy + 20, text: 'VOL: 2.4B', color: 'var(--accent-warm)' },
      { x: cx + 140, y: cy + 20, text: 'OI: $12.4B', color: '#a855f7' },
      { x: cx - 160, y: cy + 100, text: 'FUND: +0.01%', color: '#06b6d4' },
      { x: cx + 160, y: cy + 100, text: 'Δ: +2.34%', color: '#84cc16' }
    ];
    
    indicators.forEach((indicator, i) => {
      const group = this.createGroup('floating-indicator');
      group.style.animationDelay = `${i * 1}s`;
      
      // Background
      const bg = this.createRect(indicator.x - 35, indicator.y - 10, 70, 20, 6, 'var(--bg-card-solid)', indicator.color, 1);
      bg.setAttribute('opacity', '0.8');
      group.appendChild(bg);
      
      // Text
      const text = this.createText(indicator.x, indicator.y, indicator.text, 'indicator-text');
      text.setAttribute('font-size', '8');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', indicator.color);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      group.appendChild(text);
      
      // Pulse ring around indicator
      const ring = this.createCircle(indicator.x, indicator.y, 25, 'none', 'processing-ring');
      ring.setAttribute('stroke', indicator.color);
      ring.setAttribute('stroke-width', '1');
      ring.setAttribute('stroke-opacity', '0.2');
      ring.setAttribute('stroke-dasharray', '8 12');
      ring.style.animationDelay = `${i * 1 + 1}s`;
      ring.style.animationDuration = '20s';
      group.appendChild(ring);
      
      robotGroup.appendChild(group);
    });
  }
  
  createParticle(sourceIndex, particleIndex, totalParticles, source, isLeft, sourceX, sourceY, targetX, targetY) {
    const progress = (particleIndex + sourceIndex * 0.17) / (totalParticles * this.options.sources.length);
    const delay = progress * 8; // Spread across full 8s cycle
    
    const startX = isLeft ? sourceX + 30 : sourceX - 30;
    const startY = sourceY;
    const endX = targetX + (Math.random() - 0.5) * 30;
    const endY = targetY + (Math.random() - 0.5) * 30;
    const tx = endX - startX;
    const ty = endY - startY;
    
    const size = 2 + Math.random() * 4;
    
    // Randomly assign particle variation classes
    const variations = ['', 'spark', 'pulse', 'trail'];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    const particle = this.createCircle(startX, startY, size, source.color, `data-particle ${source.id}${variation ? ' ' + variation : ''}`);
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${8 + Math.random() * 4}s`; // 8-12s
    
    // Add glow
    particle.setAttribute('filter', `drop-shadow(0 0 ${size * 2}px ${source.color})`);
    
    this.svg.appendChild(particle);
    this.particles.push(particle);
  }
  
  buildProcessingCore() {
    const cx = this.options.width / 2;
    const cy = this.options.height / 2 + 40;
    
    // Processing rings around core - 8 rings for 8 sources
    for (let i = 0; i < 8; i++) {
      const ring = this.createCircle(cx, cy, 28 + i * 6, 'none', 'processing-ring');
      ring.setAttribute('stroke', this.options.sources[i % this.options.sources.length].color);
      ring.setAttribute('stroke-width', i < 3 ? '2' : '1');
      ring.style.animationDelay = `${i * 2}s`; // Match CSS delays (2s intervals)
      this.svg.appendChild(ring);
    }
  }
  
  buildOutputDisplay() {
    const cx = this.options.width / 2;
    const cy = this.options.height / 2 + 120;
    
    const outputs = [
      { text: 'BTC: $67,420 ↑', class: 'positive', delay: 1 },
      { text: 'ETH: $3,520 ↑', class: 'positive', delay: 2 },
      { text: 'SOL: $142.50 →', class: 'neutral', delay: 3 },
      { text: 'Signal: LONG BTC', class: 'positive', delay: 4 },
      { text: 'Risk: 2.3% ✓', class: 'positive', delay: 5 },
      { text: 'Next: 14s', class: 'neutral', delay: 6 },
      { text: 'Whale: 1,200 BTC moved', class: 'neutral', delay: 7 },
      { text: 'CPI: 3.2% est.', class: 'neutral', delay: 8 },
      { text: 'Funding: +0.01%', class: 'neutral', delay: 9 },
      { text: 'OI: $12.4B ↑', class: 'positive', delay: 10 }
    ];
    
    outputs.forEach((output, i) => {
      const y = cy + (i % 5) * 18;
      const x = cx + (i < 5 ? -120 : 120);
      const text = this.createText(x, y, output.text, `output-data ${output.class}`);
      text.setAttribute('font-size', '10');
      text.setAttribute('text-anchor', i < 5 ? 'start' : 'end');
      text.setAttribute('dominant-baseline', 'middle');
      text.style.animationDelay = `${output.delay}s`;
      text.style.animationDuration = '8s';
      this.svg.appendChild(text);
    });
  }
  
  buildLegend() {
    const legendGroup = this.createGroup('data-robot-legend');
    legendGroup.setAttribute('transform', `translate(${this.options.width / 2}, ${this.options.height - 20})`);
    
    let xOffset = -200;
    this.options.sources.forEach((source, i) => {
      const item = this.createGroup('legend-item');
      
      const dot = this.createCircle(xOffset + 8, 0, 5, source.color, `legend-dot ${source.id}`);
      item.appendChild(dot);
      
      const text = this.createText(xOffset + 18, 4, source.name, 'legend-text');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', 'var(--text-secondary)');
      text.setAttribute('dominant-baseline', 'middle');
      item.appendChild(text);
      
      legendGroup.appendChild(item);
      xOffset += 70;
    });
    
    this.svg.appendChild(legendGroup);
  }
  
  // SVG Element Helpers
  createGroup(className) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (className) g.setAttribute('class', className);
    return g;
  }
  
  createRect(x, y, width, height, rx, fill, stroke, strokeWidth) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('rx', rx);
    rect.setAttribute('fill', fill || 'none');
    if (stroke) rect.setAttribute('stroke', stroke);
    if (strokeWidth) rect.setAttribute('stroke-width', strokeWidth);
    return rect;
  }
  
  createCircle(cx, cy, r, fill, className) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill || 'none');
    if (className) circle.setAttribute('class', className);
    return circle;
  }
  
  createEllipse(cx, cy, rx, ry, fill) {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', cx);
    ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx);
    ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('fill', fill || 'none');
    return ellipse;
  }
  
  createPath(d, fill, stroke, strokeWidth) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill || 'none');
    if (stroke) path.setAttribute('stroke', stroke);
    if (strokeWidth) path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    return path;
  }
  
  createText(x, y, text, className) {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x);
    textEl.setAttribute('y', y);
    textEl.textContent = text;
    if (className) textEl.setAttribute('class', className);
    return textEl;
  }
  
  startAnimation() {
    // Animation is handled via CSS keyframes
    // This method exists for potential future JS-driven animations
  }
  
  destroy() {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
  }
}

// Auto-initialize when container exists
export function initDataRobot(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = '';
    return new DataRobotAnimation(container, options);
  }
  return null;
}