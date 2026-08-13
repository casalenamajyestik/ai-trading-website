/**
 * BTC Chart Animation - Animated candlestick chart with live updates
 * Generates an interactive SVG with animated price action
 */

export class BTCChartAnimation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || container.clientWidth || 800,
      height: options.height || container.clientHeight || 300,
      candleCount: options.candleCount || 50,
      updateInterval: options.updateInterval || 3000,
      ...options
    };

    this.svg = null;
    this.animationId = null;
    this.candles = [];
    this.currentPrice = 67420;
    this.time = 0;
    this.isRunning = false;

    this.init();
  }

  init() {
    this.createSVG();
    this.generateInitialCandles();
    this.buildChart();
    this.startAnimation();
  }

  createSVG() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    this.svg.setAttribute('class', 'btc-chart-svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.container.appendChild(this.svg);

    // Add CSS styles inline for self-contained SVG
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .candle-body { transition: all 0.3s ease; }
      .candle-wick { transition: all 0.3s ease; }
      .grid-line { stroke: rgba(79, 142, 255, 0.06); stroke-width: 0.5; }
      .axis-line { stroke: rgba(136, 153, 180, 0.3); stroke-width: 1; }
      .axis-label { font-family: 'Geist', -apple-system, sans-serif; font-size: 9px; fill: rgba(136, 153, 180, 0.7); }
      .price-label { font-family: 'Geist', -apple-system, sans-serif; font-size: 10px; font-weight: 600; fill: var(--accent-primary); }
      .volume-bar { transition: height 0.3s ease; }
      .current-price-line { stroke: var(--accent-warm); stroke-width: 1.5; stroke-dasharray: 6 4; opacity: 0.8; }
      .current-price-label { font-family: 'Geist', -apple-system, sans-serif; font-size: 10px; font-weight: 700; fill: var(--accent-warm); }
      .chart-title { font-family: 'Geist', -apple-system, sans-serif; font-size: 12px; font-weight: 600; fill: var(--text-primary); }
      .chart-subtitle { font-family: 'Geist', -apple-system, sans-serif; font-size: 9px; fill: var(--text-muted); }
      .indicator-line { stroke-width: 1.5; fill: none; }
      .indicator-ma7 { stroke: var(--accent-primary); }
      .indicator-ma25 { stroke: var(--accent-warm); }
      .indicator-ma99 { stroke: #a855f7; }
      .legend-item { font-family: 'Geist', -apple-system, sans-serif; font-size: 9px; cursor: pointer; }
      .toast { font-family: 'Geist', -apple-system, sans-serif; font-size: 11px; font-weight: 600; }
    `;
    this.svg.appendChild(style);

    // Define chart area margins
    this.margin = { top: 30, right: 60, bottom: 40, left: 60 };
    this.chartWidth = this.options.width - this.margin.left - this.margin.right;
    this.chartHeight = this.options.height - this.margin.top - this.margin.bottom;
    this.chartArea = this.createGroup('chart-area');
    this.chartArea.setAttribute('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    this.svg.appendChild(this.chartArea);
  }

  createGroup(id) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', id);
    return g;
  }

  createRect(x, y, width, height, fill, className = '') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', fill);
    if (className) rect.setAttribute('class', className);
    return rect;
  }

  createLine(x1, y1, x2, y2, stroke, strokeWidth = 1, className = '') {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth);
    if (className) line.setAttribute('class', className);
    return line;
  }

  createPath(d, stroke, strokeWidth = 1, fill = 'none', className = '') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('fill', fill);
    if (className) path.setAttribute('class', className);
    return path;
  }

  createText(x, y, text, className = '', anchor = 'start', baseline = 'alphabetic') {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x);
    textEl.setAttribute('y', y);
    textEl.setAttribute('text-anchor', anchor);
    textEl.setAttribute('dominant-baseline', baseline);
    if (className) textEl.setAttribute('class', className);
    textEl.textContent = text;
    return textEl;
  }

  createCircle(cx, cy, r, fill, className = '') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill);
    if (className) circle.setAttribute('class', className);
    return circle;
  }

  generateInitialCandles() {
    let price = this.currentPrice;
    const now = Date.now();
    
    for (let i = this.options.candleCount - 1; i >= 0; i--) {
      const volatility = 0.015 + Math.random() * 0.01;
      const trend = (Math.random() - 0.48) * 0.002;
      const change = (Math.random() - 0.5) * volatility + trend;
      
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      const volume = 100 + Math.random() * 500 + Math.abs(change) * 10000;
      
      const isGreen = close >= open;
      price = close;
      
      this.candles.unshift({
        time: now - i * 3600000, // 1 hour intervals
        open,
        high,
        low,
        close,
        volume,
        isGreen
      });
    }
    this.currentPrice = price;
  }

  buildChart() {
    this.drawGrid();
    this.drawAxes();
    this.drawCandles();
    this.drawVolume();
    this.drawIndicators();
    this.drawCurrentPriceLine();
    this.drawLegend();
    this.drawTitle();
  }

  drawGrid() {
    const gridGroup = this.createGroup('grid');
    const hLines = 6;
    const vLines = 8;

    for (let i = 0; i <= hLines; i++) {
      const y = (i / hLines) * this.chartHeight;
      gridGroup.appendChild(this.createLine(0, y, this.chartWidth, y, 'rgba(79, 142, 255, 0.06)', 0.5, 'grid-line'));
    }

    for (let i = 0; i <= vLines; i++) {
      const x = (i / vLines) * this.chartWidth;
      gridGroup.appendChild(this.createLine(x, 0, x, this.chartHeight, 'rgba(79, 142, 255, 0.06)', 0.5, 'grid-line'));
    }

    this.chartArea.appendChild(gridGroup);
  }

  drawAxes() {
    const axesGroup = this.createGroup('axes');
    
    // Y-axis (price)
    const prices = this.candles.map(c => [c.high, c.low]).flat();
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.05;
    this.priceMax = maxPrice + padding;
    this.priceMin = minPrice - padding;
    this.priceRange = this.priceMax - this.priceMin;

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const price = this.priceMax - (i / yTicks) * this.priceRange;
      const y = (i / yTicks) * this.chartHeight;
      
      // Price label on right
      axesGroup.appendChild(this.createText(
        this.chartWidth + 8, y, 
        '$' + (price / 1000).toFixed(1) + 'k',
        'axis-label', 'start', 'middle'
      ));
      
      // Price label on left (for reference)
      if (i === 0 || i === yTicks) {
        axesGroup.appendChild(this.createText(
          -8, y, 
          '$' + (price / 1000).toFixed(1) + 'k',
          'axis-label', 'end', 'middle'
        ));
      }
    }

    // Y-axis line
    axesGroup.appendChild(this.createLine(this.chartWidth, 0, this.chartWidth, this.chartHeight, 'rgba(136, 153, 180, 0.3)', 1, 'axis-line'));

    // X-axis (time)
    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const x = (i / xTicks) * this.chartWidth;
      const idx = Math.floor((i / xTicks) * (this.candles.length - 1));
      const candle = this.candles[idx];
      if (candle) {
        const date = new Date(candle.time);
        const label = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
        axesGroup.appendChild(this.createText(
          x, this.chartHeight + 16,
          label,
          'axis-label', 'middle', 'hanging'
        ));
      }
    }

    // X-axis line
    axesGroup.appendChild(this.createLine(0, this.chartHeight, this.chartWidth, this.chartHeight, 'rgba(136, 153, 180, 0.3)', 1, 'axis-line'));

    this.chartArea.appendChild(axesGroup);
  }

  priceToY(price) {
    return (1 - (price - this.priceMin) / this.priceRange) * this.chartHeight;
  }

  timeToX(index) {
    return (index / (this.candles.length - 1)) * this.chartWidth;
  }

  drawCandles() {
    const candleGroup = this.createGroup('candles');
    const candleWidth = this.chartWidth / this.candles.length * 0.7;
    const minWidth = 3;

    this.candles.forEach((candle, i) => {
      const x = this.timeToX(i);
      const centerX = x;
      const w = Math.max(candleWidth, minWidth);
      const halfW = w / 2;

      const highY = this.priceToY(candle.high);
      const lowY = this.priceToY(candle.low);
      const openY = this.priceToY(candle.open);
      const closeY = this.priceToY(candle.close);

      const color = candle.isGreen ? 'var(--accent-secondary)' : 'var(--accent-danger)';

      // Wick
      const wick = this.createLine(centerX, highY, centerX, lowY, color, 1, 'candle-wick');
      candleGroup.appendChild(wick);

      // Body
      const bodyHeight = Math.abs(openY - closeY);
      const bodyY = Math.min(openY, closeY);
      
      const body = this.createRect(
        centerX - halfW, bodyY,
        w, Math.max(bodyHeight, 1),
        candle.isGreen ? color : 'transparent',
        'candle-body'
      );
      if (!candle.isGreen) {
        body.setAttribute('stroke', color);
        body.setAttribute('stroke-width', '1');
      }
      body.setAttribute('data-index', i);
      candleGroup.appendChild(body);

      // Store reference for animation
      candle._elements = { wick, body, centerX, highY, lowY, openY, closeY, halfW };
    });

    this.chartArea.appendChild(candleGroup);
    this.candleGroup = candleGroup;
  }

  drawVolume() {
    const volumeGroup = this.createGroup('volume');
    const volumeHeight = 50;
    const volumeY = this.chartHeight + 10;
    const volumes = this.candles.map(c => c.volume);
    const maxVolume = Math.max(...volumes);

    const candleWidth = this.chartWidth / this.candles.length * 0.7;
    const minWidth = 3;

    this.candles.forEach((candle, i) => {
      const x = this.timeToX(i);
      const centerX = x;
      const w = Math.max(candleWidth, minWidth);
      const halfW = w / 2;
      const barHeight = (candle.volume / maxVolume) * volumeHeight;
      const color = candle.isGreen ? 'rgba(34, 211, 167, 0.5)' : 'rgba(240, 78, 78, 0.5)';

      const bar = this.createRect(
        centerX - halfW, volumeY + volumeHeight - barHeight,
        w, barHeight,
        color,
        'volume-bar'
      );
      volumeGroup.appendChild(bar);
    });

    // Volume label
    volumeGroup.appendChild(this.createText(
      -8, volumeY + volumeHeight / 2,
      'VOL',
      'axis-label', 'end', 'middle'
    ));

    this.chartArea.appendChild(volumeGroup);
  }

  calculateMA(period) {
    const mas = [];
    for (let i = 0; i < this.candles.length; i++) {
      if (i < period - 1) {
        mas.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += this.candles[i - j].close;
        }
        mas.push(sum / period);
      }
    }
    return mas;
  }

  drawIndicators() {
    const indicatorGroup = this.createGroup('indicators');
    
    const ma7 = this.calculateMA(7);
    const ma25 = this.calculateMA(25);
    const ma99 = this.calculateMA(99);

    // Draw MA lines
    [ { data: ma7, color: 'var(--accent-primary)', class: 'indicator-ma7', name: 'MA7' },
      { data: ma25, color: 'var(--accent-warm)', class: 'indicator-ma25', name: 'MA25' },
      { data: ma99, color: '#a855f7', class: 'indicator-ma99', name: 'MA99' }
    ].forEach(({ data, color, class: cls, name }) => {
      let pathD = '';
      let first = true;
      data.forEach((val, i) => {
        if (val !== null) {
          const x = this.timeToX(i);
          const y = this.priceToY(val);
          if (first) {
            pathD += `M${x} ${y}`;
            first = false;
          } else {
            pathD += ` L${x} ${y}`;
          }
        }
      });
      if (pathD) {
        indicatorGroup.appendChild(this.createPath(pathD, color, 1.5, 'none', `indicator-line ${cls}`));
      }
    });

    this.chartArea.appendChild(indicatorGroup);
  }

  drawCurrentPriceLine() {
    const priceGroup = this.createGroup('current-price');
    const y = this.priceToY(this.currentPrice);
    
    // Horizontal line across chart
    priceGroup.appendChild(this.createLine(0, y, this.chartWidth, y, 'var(--accent-warm)', 1.5, 'current-price-line'));
    
    // Price label
    priceGroup.appendChild(this.createText(
      this.chartWidth + 8, y,
      '$' + this.currentPrice.toLocaleString(),
      'current-price-label', 'start', 'middle'
    ));

    this.chartArea.appendChild(priceGroup);
    this.currentPriceLine = priceGroup;
  }

  drawLegend() {
    const legendGroup = this.createGroup('legend');
    const items = [
      { color: 'var(--accent-secondary)', label: 'MA7' },
      { color: 'var(--accent-warm)', label: 'MA25' },
      { color: '#a855f7', label: 'MA99' }
    ];

    items.forEach((item, i) => {
      const x = 10 + i * 60;
      const y = 15;
      
      // Color dot
      legendGroup.appendChild(this.createCircle(x, y, 4, item.color));
      
      // Label
      legendGroup.appendChild(this.createText(
        x + 8, y + 3,
        item.label,
        'legend-item', 'start', 'middle'
      ));
    });

    this.chartArea.appendChild(legendGroup);
  }

  drawTitle() {
    const titleGroup = this.createGroup('title');
    titleGroup.appendChild(this.createText(
      0, -10,
      'BTC/USDT',
      'chart-title', 'start', 'hanging'
    ));
    titleGroup.appendChild(this.createText(
      0, 2,
      '1H • Binance Futures • Live',
      'chart-subtitle', 'start', 'hanging'
    ));

    // Live indicator
    const liveDot = this.createCircle(this.chartWidth - 60, -6, 4, 'var(--accent-secondary)');
    liveDot.setAttribute('class', 'live-dot');
    liveDot.style.animation = 'pulse 1.5s infinite';
    titleGroup.appendChild(liveDot);
    
    titleGroup.appendChild(this.createText(
      this.chartWidth - 50, -10,
      'LIVE',
      'chart-subtitle', 'start', 'hanging'
    ));

    this.chartArea.appendChild(titleGroup);
  }

  updateCandle() {
    // Shift candles left, add new one at the end
    this.candles.shift();
    
    const lastCandle = this.candles[this.candles.length - 1];
    const volatility = 0.01 + Math.random() * 0.015;
    const trend = (Math.random() - 0.49) * 0.0015;
    const change = (Math.random() - 0.5) * volatility + trend;
    
    const open = lastCandle.close;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = 100 + Math.random() * 500 + Math.abs(change) * 10000;
    const isGreen = close >= open;
    
    const newCandle = {
      time: lastCandle.time + 3600000,
      open, high, low, close, volume, isGreen
    };
    
    this.candles.push(newCandle);
    this.currentPrice = close;

    // Update visual elements
    this.updateVisuals();
  }

  updateVisuals() {
    const candleWidth = this.chartWidth / this.candles.length * 0.7;
    const minWidth = 3;

    // Remove old elements and redraw (simpler approach for smooth animation)
    if (this.candleGroup) {
      this.candleGroup.remove();
    }
    if (this.currentPriceLine) {
      this.currentPriceLine.remove();
    }

    // Recalculate price range
    const prices = this.candles.map(c => [c.high, c.low]).flat();
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.05;
    this.priceMax = maxPrice + padding;
    this.priceMin = minPrice - padding;
    this.priceRange = this.priceMax - this.priceMin;

    // Redraw candles
    this.drawCandles();
    this.drawCurrentPriceLine();
    this.drawIndicators();
  }

  startAnimation() {
    if (this.isRunning) return;
    this.isRunning = true;

    const animate = () => {
      if (!this.isRunning) return;
      
      this.time += 0.016;
      
      // Update candle every updateInterval
      if (this.time * 1000 >= this.options.updateInterval) {
        this.updateCandle();
        this.time = 0;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  destroy() {
    this.stop();
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
  }
}

// Auto-initialize when container exists
export function initBTCChart(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = '';
    return new BTCChartAnimation(container, options);
  }
  return null;
}