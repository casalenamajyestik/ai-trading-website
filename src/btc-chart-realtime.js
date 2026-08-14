/**
 * BTC Real-time Chart - Binance WebSocket + Lightweight Charts
 * Real-time candlestick chart with WebSocket live updates
 */

import { createChart, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

export class BTCRealTimeChart {
  constructor(container, options = {}) {
    // Handle both selector string and element
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }
    
    if (!this.container) {
      console.error('[BTC Chart] Container not found:', container);
      return;
    }

    this.options = {
      width: options.width || this.container.clientWidth || 800,
      height: options.height || this.container.clientHeight || 300,
      interval: options.interval || '1m',
      symbol: options.symbol || 'BTCUSDT',
      maxCandles: options.maxCandles || 200,
      ...options
    };

    this.chart = null;
    this.candleSeries = null;
    this.volumeSeries = null;
    this.ma7Series = null;
    this.ma25Series = null;
    this.ma99Series = null;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.candleBuffer = [];
    this.isConnected = false;
    this.lastCandleTime = 0;

    // Wait for container to have dimensions if needed
    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
      this.waitForContainerSize().then(() => this.init());
    } else {
      this.init();
    }
  }

  waitForContainerSize() {
    return new Promise((resolve) => {
      const checkSize = () => {
        if (this.container.clientWidth > 0 && this.container.clientHeight > 0) {
          this.options.width = this.container.clientWidth;
          this.options.height = this.container.clientHeight;
          resolve();
        } else {
          requestAnimationFrame(checkSize);
        }
      };
      checkSize();
    });
  }

  init() {
    this.createChart();
    this.loadInitialData();
    this.connectWebSocket();
    this.setupResizeHandler();
  }

  createChart() {
    // Create chart with Lightweight Charts - let it use container's CSS size
    // Don't pass explicit width/height, let the library handle responsive sizing
    this.chart = createChart(this.container, {
      layout: {
        background: { type: 'solid', color: '#0d1321' },
        textColor: '#e4e9f2',
        fontFamily: "'Geist', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(79, 142, 255, 0.06)' },
        horzLines: { color: 'rgba(79, 142, 255, 0.06)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(79, 142, 255, 0.5)',
          width: 1,
          style: 2, // Dashed
        },
        horzLine: {
          color: 'rgba(79, 142, 255, 0.5)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(136, 153, 180, 0.3)',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      leftPriceScale: {
        borderColor: 'rgba(136, 153, 180, 0.3)',
        scaleMargins: { top: 0.1, bottom: 0.15 },
        visible: false,
      },
      timeScale: {
        borderColor: 'rgba(136, 153, 180, 0.3)',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        fixRightEdge: true,
        rightOffset: 130,  // Increased from 12 to 30 - more space for MA labels on right
        barSpacing: 8,
        minBarSpacing: 4,
      },
      localization: {
        locale: 'id-ID',
        dateFormat: 'HH:mm',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
      },
    });

    // Create a second pane for volume (bottom 25% of chart)
    const volumePane = this.chart.addPane();

    // Candlestick series (main pane - top 75%)
    this.candleSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: '#22d3a7',
      downColor: '#f04e4e',
      borderUpColor: '#22d3a7',
      borderDownColor: '#f04e4e',
      wickUpColor: '#22d3a7',
      wickDownColor: '#f04e4e',
      priceScaleId: 'right',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      paneIndex: 0,
    });

    // Volume series (bottom pane - 25%)
    this.volumeSeries = volumePane.addSeries(HistogramSeries, {
      color: '#22d3a7',
      priceFormat: { type: 'volume', precision: 0 },
      priceScaleId: 'left',
      base: 0,
      paneIndex: 1,
    });
    this.volumeSeries.applyOptions({ priceScaleId: '' }); // Hide left price scale for volume

    // Set pane sizes: main pane 75%, volume pane 25%
    this.chart.resize(this.container.clientWidth, this.container.clientHeight);
    // Note: lightweight-charts v5 handles pane sizing automatically, but we can adjust via price scale margins

    // Add MA lines to main pane
    this.ma7Series = this.chart.addSeries(LineSeries, {
      color: '#4f8eff',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'MA7',
      paneIndex: 0,
    });
    this.ma25Series = this.chart.addSeries(LineSeries, {
      color: '#f5a623',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'MA25',
      paneIndex: 0,
    });
    this.ma99Series = this.chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'MA99',
      paneIndex: 0,
    });
  }

  async loadInitialData() {
    try {
      // Map interval to Binance format
      const intervalMap = {
        '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
        '30m': '30m', '1h': '1h', '2h': '2h', '4h': '4h',
        '6h': '6h', '8h': '8h', '12h': '12h', '1d': '1d'
      };
      const binanceInterval = intervalMap[this.options.interval] || '1m';
      const limit = Math.min(this.options.maxCandles, 1000);

      const url = `https://api.binance.com/api/v3/klines?symbol=${this.options.symbol}&interval=${binanceInterval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      const candles = data.map(kline => ({
        time: kline[0] / 1000, // Convert to seconds
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));

      this.candleBuffer = candles;
      this.lastCandleTime = candles[candles.length - 1]?.time || 0;

      // Set data to chart
      this.candleSeries.setData(candles);
      this.volumeSeries.setData(candles.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? '#22d3a7' : '#f04e4e' })));
      
      // Calculate and set MAs
      this.updateMovingAverages(candles);

      console.log(`[BTC Chart] Loaded ${candles.length} initial candles`);
    } catch (error) {
      console.error('[BTC Chart] Failed to load initial data:', error);
      this.showError('Gagal memuat data awal. Mencoba WebSocket...');
    }
  }

  updateMovingAverages(candles) {
    const calculateMA = (data, period) => {
      const result = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close;
        }
        result.push({ time: data[i].time, value: sum / period });
      }
      return result;
    };

    if (candles.length >= 99) {
      this.ma7Series.setData(calculateMA(candles, 7));
      this.ma25Series.setData(calculateMA(candles, 25));
      this.ma99Series.setData(calculateMA(candles, 99));
    }
  }

  connectWebSocket() {
    const intervalMap = {
      '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
      '30m': '30m', '1h': '1h', '2h': '2h', '4h': '4h',
      '6h': '6h', '8h': '8h', '12h': '12h', '1d': '1d'
    };
    const binanceInterval = intervalMap[this.options.interval] || '1m';
    const streamName = `${this.options.symbol.toLowerCase()}@kline_${binanceInterval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    console.log(`[BTC Chart] Connecting to ${wsUrl}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[BTC Chart] WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.hideError();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'kline') {
          this.handleKlineUpdate(data.k);
        }
      } catch (error) {
        console.error('[BTC Chart] Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[BTC Chart] WebSocket closed');
      this.isConnected = false;
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[BTC Chart] WebSocket error:', error);
      this.isConnected = false;
    };
  }

  handleKlineUpdate(kline) {
    const candle = {
      time: kline.t / 1000,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      isFinal: kline.x, // x = true when candle is closed/final
    };

    if (candle.time === this.lastCandleTime) {
      // Update existing candle (real-time updates)
      this.updateLastCandle(candle);
    } else if (candle.time > this.lastCandleTime) {
      // New candle
      this.addNewCandle(candle);
    }
    // Ignore old candles
  }

  updateLastCandle(candle) {
    // Update the last candle in buffer
    if (this.candleBuffer.length > 0) {
      this.candleBuffer[this.candleBuffer.length - 1] = candle;
    }

    // Update chart (last candle)
    this.candleSeries.update(candle);
    this.volumeSeries.update({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open ? '#22d3a7' : '#f04e4e'
    });

    // Recalculate MAs if we have enough data
    if (this.candleBuffer.length >= 99) {
      this.updateMovingAverages(this.candleBuffer);
    }
  }

  addNewCandle(candle) {
    // Add to buffer
    this.candleBuffer.push(candle);
    this.lastCandleTime = candle.time;

    // Keep buffer size limited
    if (this.candleBuffer.length > this.options.maxCandles) {
      this.candleBuffer.shift();
    }

    // Add to chart
    this.candleSeries.update(candle); // This adds new if time is newer
    this.volumeSeries.update({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open ? '#22d3a7' : '#f04e4e'
    });

    // Recalculate MAs
    if (this.candleBuffer.length >= 99) {
      this.updateMovingAverages(this.candleBuffer);
    }

    console.log(`[BTC Chart] New candle: ${new Date(candle.time * 1000).toLocaleTimeString()} O:${candle.open.toFixed(2)} H:${candle.high.toFixed(2)} L:${candle.low.toFixed(2)} C:${candle.close.toFixed(2)}`);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[BTC Chart] Max reconnect attempts reached');
      this.showError('Koneksi terputus. Refresh halaman untuk mencoba lagi.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5); // Exponential backoff capped
    
    console.log(`[BTC Chart] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.showError(`Menghubungkan ulang... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.connectWebSocket();
      }
    }, delay);
  }

  setupResizeHandler() {
    const resizeObserver = new ResizeObserver(() => {
      if (this.chart && this.container) {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || this.options.height;
        this.chart.applyOptions({ width, height });
        this.options.width = width;
        this.options.height = height;
      }
    });
    resizeObserver.observe(this.container);
  }

  showError(message) {
    // Remove existing error
    this.hideError();
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'btc-chart-error';
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(240, 78, 78, 0.9);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-family: 'Geist', -apple-system, sans-serif;
      font-size: 0.875rem;
      text-align: center;
      z-index: 100;
      max-width: 90%;
    `;
    errorDiv.textContent = message;
    this.container.style.position = 'relative';
    this.container.appendChild(errorDiv);
  }

  hideError() {
    const errorDiv = document.getElementById('btc-chart-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  setInterval(interval) {
    if (this.options.interval !== interval) {
      this.options.interval = interval;
      this.disconnect();
      this.loadInitialData();
      this.connectWebSocket();
    }
  }

  setSymbol(symbol) {
    if (this.options.symbol !== symbol) {
      this.options.symbol = symbol;
      this.disconnect();
      this.loadInitialData();
      this.connectWebSocket();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  destroy() {
    this.disconnect();
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
    this.candleBuffer = [];
  }
}

// Auto-initialize function
export function initBTCRealTimeChart(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = '';
    return new BTCRealTimeChart(container, options);
  }
  return null;
}
