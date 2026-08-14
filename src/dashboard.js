import { i18next } from './language-theme.js';
import { 
  signOut, 
  upsertProfile, 
  getExchangeKey, 
  upsertExchangeKey,
  getBotSession,
  updateBotSession,
  toggleBotSession,
  getBotState
} from './supabase.js';
import { supabase } from './supabase.js';
import { initAuth, getLocalSession, requireAuth } from './auth-listener.js';
import { subscribeBotState } from './supabase.js';
import { initTheme, initLanguage, updateDynamicI18n } from './language-theme.js';
import { initBTCRealTimeChart } from './btc-chart-realtime.js';
import './styles.css';
import './styles/settings-tabs.css';

// ============ Auth Guard ============
async function requireAuthWrapper() {
  await initAuth();
  return requireAuth();
}

// ============ Helpers ============
function formatIDR(num) {
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID');
}

function formatUSD(num) {
  return '$ ' + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getCountryOptions(selectedCode = 'ID') {
  const countries = [
    { code: 'ID', name: 'Indonesia (+62)', dialCode: '+62', flag: '🇮🇩' },
    { code: 'US', name: 'United States (+1)', dialCode: '+1', flag: '🇺🇸' },
    { code: 'SG', name: 'Singapore (+65)', dialCode: '+65', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia (+60)', dialCode: '+60', flag: '🇲🇾' },
    { code: 'AU', name: 'Australia (+61)', dialCode: '+61', flag: '🇦🇺' },
    { code: 'JP', name: 'Japan (+81)', dialCode: '+81', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea (+82)', dialCode: '+82', flag: '🇰🇷' },
    { code: 'CN', name: 'China (+86)', dialCode: '+86', flag: '🇨🇳' },
    { code: 'IN', name: 'India (+91)', dialCode: '+91', flag: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom (+44)', dialCode: '+44', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany (+49)', dialCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France (+33)', dialCode: '+33', flag: '🇫🇷' },
    { code: 'NL', name: 'Netherlands (+31)', dialCode: '+31', flag: '🇳🇱' },
    { code: 'CA', name: 'Canada (+1)', dialCode: '+1', flag: '🇨🇦' },
    { code: 'BR', name: 'Brazil (+55)', dialCode: '+55', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico (+52)', dialCode: '+52', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina (+54)', dialCode: '+54', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile (+56)', dialCode: '+56', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia (+57)', dialCode: '+57', flag: '🇨🇴' },
    { code: 'PE', name: 'Peru (+51)', dialCode: '+51', flag: '🇵🇪' },
    { code: 'VE', name: 'Venezuela (+58)', dialCode: '+58', flag: '🇻🇪' },
    { code: 'ZA', name: 'South Africa (+27)', dialCode: '+27', flag: '🇿🇦' },
    { code: 'NG', name: 'Nigeria (+234)', dialCode: '+234', flag: '🇳🇬' },
    { code: 'KE', name: 'Kenya (+254)', dialCode: '+254', flag: '🇰🇪' },
    { code: 'EG', name: 'Egypt (+20)', dialCode: '+20', flag: '🇪🇬' },
    { code: 'MA', name: 'Morocco (+212)', dialCode: '+212', flag: '🇲🇦' },
    { code: 'AE', name: 'UAE (+971)', dialCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia (+966)', dialCode: '+966', flag: '🇸🇦' },
    { code: 'TR', name: 'Turkey (+90)', dialCode: '+90', flag: '🇹🇷' },
    { code: 'IL', name: 'Israel (+972)', dialCode: '+972', flag: '🇮🇱' },
    { code: 'PH', name: 'Philippines (+63)', dialCode: '+63', flag: '🇵🇭' },
    { code: 'TH', name: 'Thailand (+66)', dialCode: '+66', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam (+84)', dialCode: '+84', flag: '🇻🇳' },
    { code: 'TW', name: 'Taiwan (+886)', dialCode: '+886', flag: '🇹🇼' },
    { code: 'HK', name: 'Hong Kong (+852)', dialCode: '+852', flag: '🇭🇰' },
    { code: 'NZ', name: 'New Zealand (+64)', dialCode: '+64', flag: '🇳🇿' },
    { code: 'CH', name: 'Switzerland (+41)', dialCode: '+41', flag: '🇨🇭' },
    { code: 'AT', name: 'Austria (+43)', dialCode: '+43', flag: '🇦🇹' },
    { code: 'BE', name: 'Belgium (+32)', dialCode: '+32', flag: '🇧🇪' },
    { code: 'SE', name: 'Sweden (+46)', dialCode: '+46', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway (+47)', dialCode: '+47', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark (+45)', dialCode: '+45', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland (+358)', dialCode: '+358', flag: '🇫🇮' },
    { code: 'PL', name: 'Poland (+48)', dialCode: '+48', flag: '🇵🇱' },
    { code: 'CZ', name: 'Czech Republic (+420)', dialCode: '+420', flag: '🇨🇿' },
    { code: 'HU', name: 'Hungary (+36)', dialCode: '+36', flag: '🇭🇺' },
    { code: 'RO', name: 'Romania (+40)', dialCode: '+40', flag: '🇷🇴' },
    { code: 'GR', name: 'Greece (+30)', dialCode: '+30', flag: '🇬🇷' },
    { code: 'PT', name: 'Portugal (+351)', dialCode: '+351', flag: '🇵🇹' },
    { code: 'IE', name: 'Ireland (+353)', dialCode: '+353', flag: '🇮🇪' },
    { code: 'RU', name: 'Russia (+7)', dialCode: '+7', flag: '🇷🇺' },
    { code: 'UA', name: 'Ukraine (+380)', dialCode: '+380', flag: '🇺🇦' },
    { code: 'OTHER', name: 'Other', dialCode: '', flag: '🌐' }
  ];
  
  return countries.map(c => 
    `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''} data-dial="${c.dialCode}">${c.flag} ${c.name}</option>`
  ).join('');
}

// ============ Page Content ============
const pages = {
  overview: {
    title: 'Overview',
    render: (session) => {
      const botSession = session.botSession || {};
      const botState = session.botState || {};
      const isActive = botSession.is_active || false;
      const status = botState.status || 'stopped';
      const mode = botSession.mode || 'paper';
      const lastHeartbeat = botState.last_heartbeat;
      const balance = botState.balance || 12345600; // Default from spreadsheet: $ 123.456,00
      const yesterdayPnL = botState.yesterday_pnl || 123; // Default from spreadsheet: +123.00
      const biggestWin = botState.biggest_win || 100; // Default from spreadsheet: x100
      const totalPositions = botState.total_positions || 12; // Default from spreadsheet: 12
      const positionCoin = botState.position_coin || 'ABUSDT'; // Default from spreadsheet

      const statusClass = status === 'running' ? 'running' : status === 'error' ? 'error' : 'stopped';
      const statusLabel = status === 'running' ? 'Running' : status === 'error' ? 'Error' : status === 'starting' ? 'Starting...' : 'Stopped';
      const botStatusText = isActive ? '🟢 Running' : '🔴 Stop';

      // Initialize BTC real-time chart after render
      setTimeout(() => {
        const container = document.getElementById('btcChartContainer');
        if (container && !container.dataset.initialized) {
          container.dataset.initialized = 'true';
          initBTCRealTimeChart('#btcChartContainer', {
            interval: '1m',
            symbol: 'BTCUSDT',
            maxCandles: 200
          });
        }
      }, 0);

      return `
        <!-- 5 Stat Cards matching spreadsheet design -->
        <div class="stats-grid">
          <!-- Card 1: Ai Auto Trade (no toggle, just status) -->
          <div class="stat-card">
            <div class="stat-card-label">AI Auto Trade</div>
            <div class="stat-card-value">
              <span class="status-badge ${isActive ? 'running' : 'stopped'}">${isActive ? 'Running' : 'Stop'}</span>
            </div>
            <div class="stat-card-sub ${isActive ? 'positive' : ''}">${isActive ? 'Running' : 'Stop'}</div>
            <div class="stat-card-sub">${mode === 'live' ? '🔴 LIVE MODE' : '📝 Paper Trading'}</div>
          </div>

          <!-- Card 2: Total Balance -->
          <div class="stat-card">
            <div class="stat-card-label">Total Balance</div>
            <div class="stat-card-value">$ ${(balance/1000000).toFixed(3).replace('.', ',')}M</div>
            <div class="stat-card-sub positive">+12.5% this week</div>
          </div>

          <!-- Card 3: PNL Yesterday -->
          <div class="stat-card">
            <div class="stat-card-label">PNL Yesterday</div>
            <div class="stat-card-value ${yesterdayPnL >= 0 ? 'positive' : 'negative'}">${yesterdayPnL >= 0 ? '+' : ''}${formatUSD(yesterdayPnL).replace('$ ', '')}</div>
            <div class="stat-card-sub">Daily PnL</div>
          </div>

          <!-- Card 4: Biggest Win -->
          <div class="stat-card">
            <div class="stat-card-label">Biggest Win</div>
            <div class="stat-card-value positive">x${biggestWin} (Leverage)</div>
            <div class="stat-card-sub">Best trade</div>
          </div>

          <!-- Card 5: Total Positions -->
          <div class="stat-card positions">
            <div class="stat-card-label">Total Positions</div>
            <div class="positions-coin">${positionCoin}</div>
            <div class="positions-count">${totalPositions}</div>
            <div class="stat-card-sub">Open & Closed</div>
          </div>
        </div>

        <!-- 3-Column Layout: BTC Chart | Animasi 1 -->
        <div class="content-section">
          <div class="three-column-grid">
            <!-- Left: BTC Chart -->
            <div class="column-card">
              <div class="card" style="padding: 0;">
                <div class="btc-chart-container" id="btcChartContainer"></div>
              </div>
            </div>

            <!-- Center: Animasi 1 (Placeholder - was Animasi Robot) -->
            <div class="column-card">
              <div class="card animation2-placeholder" style="padding: 0; display: flex; align-items: center; justify-content: center;">
                <div class="placeholder-content">
                  <div class="placeholder-icon">����</div>
                  <div class="placeholder-text">Animasi ke 1</div>
                  <div class="placeholder-desc">Posisi reservasi untuk animasi ke-1</div>
                  <div class="placeholder-label">[ANIMASI KE 1]</div>
                </div>
              </div>
            </div>

            <!-- Right: Animasi 2 (Placeholder) -->
            <div class="column-card">
              <div class="card animation2-placeholder" style="padding: 0; display: flex; align-items: center; justify-content: center;">
                <div class="placeholder-content">
                  <div class="placeholder-icon">����</div>
                  <div class="placeholder-text">Animasi ke 2</div>
                  <div class="placeholder-desc">Posisi reservasi untuk animasi ke-2</div>
                  <div class="placeholder-label">[ANIMASI KE 2]</div>
                </div>
              </div>
            </div>
          </div>
        </div>`
    }
  },
  positions: {
    title: 'Positions',
    render: (session) => {
      const botState = session.botState || {};
      const positions = botState.positions || [
        { coin: 'BTCUSDT', side: 'Long', size: '0.05', entry: 67420, mark: 68100, pnl: 34, leverage: 10 },
        { coin: 'ETHUSDT', side: 'Long', size: '2.5', entry: 3520, mark: 3580, pnl: 150, leverage: 20 },
        { coin: 'SOLUSDT', side: 'Short', size: '150', entry: 142.5, mark: 140.2, pnl: 345, leverage: 10 },
        { coin: 'ADAUSDT', side: 'Long', size: '5000', entry: 0.45, mark: 0.462, pnl: 60, leverage: 5 },
        { coin: 'MATICUSDT', side: 'Long', size: '2000', entry: 0.72, mark: 0.735, pnl: 30, leverage: 10 },
      ];
      
      const totalPositions = positions.length;
      const longCount = positions.filter(p => p.side === 'Long').length;
      const shortCount = positions.filter(p => p.side === 'Short').length;
      const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.pnl, 0);

      return `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-card-label">Total Positions</div><div class="stat-card-value">${totalPositions}</div></div>
          <div class="stat-card"><div class="stat-card-label">Long</div><div class="stat-card-value" style="color:var(--accent-secondary)">${longCount}</div></div>
          <div class="stat-card"><div class="stat-card-label">Short</div><div class="stat-card-value" style="color:var(--accent-danger)">${shortCount}</div></div>
          <div class="stat-card"><div class="stat-card-label">Total Unrealized PnL</div><div class="stat-card-value positive">$${totalUnrealizedPnL.toFixed(2)}</div></div>
        </div>
        <div class="content-section">
          <div class="section-header">
            <span class="section-title">Open Positions</span>
            <span class="section-badge">Live</span>
          </div>
          <div class="card table-container positions-table">
            <table>
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Side</th>
                  <th>Size</th>
                  <th>Entry Price</th>
                  <th>Mark Price</th>
                  <th>Unrealized PnL</th>
                  <th>Leverage</th>
                </tr>
              </thead>
              <tbody>
                ${positions.map(p => `
                  <tr>
                    <td class="coin-name">${p.coin}</td>
                    <td>${p.side}</td>
                    <td>${p.size}</td>
                    <td>$${Number(p.entry).toLocaleString()}</td>
                    <td>$${Number(p.mark).toLocaleString()}</td>
                    <td class="pnl ${p.pnl >= 0 ? 'positive' : 'negative'}">$${p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}</td>
                    <td class="leverage">x${p.leverage}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`
    }
  },
  history: {
    title: 'History Trade',
    render: (session) => {
      const botState = session.botState || {};
      const trades = botState.trade_history || [
        { time: '2024-01-15 14:32', coin: 'BTCUSDT', type: 'Buy', size: '0.05', price: 67420, pnl: 34, bot: 'Grid Bot' },
        { time: '2024-01-15 13:15', coin: 'ETHUSDT', type: 'Sell', size: '2.5', price: 3520, pnl: 150, bot: 'DCA Bot' },
        { time: '2024-01-15 11:42', coin: 'SOLUSDT', type: 'Sell', size: '150', price: 142.5, pnl: 345, bot: 'AI Adaptive' },
        { time: '2024-01-15 09:20', coin: 'ADAUSDT', type: 'Buy', size: '5000', price: 0.45, pnl: -12, bot: 'Scalper' },
        { time: '2024-01-15 07:05', coin: 'MATICUSDT', type: 'Buy', size: '2000', price: 0.72, pnl: 30, bot: 'Grid Bot' },
        { time: '2024-01-14 22:10', coin: 'BTCUSDT', type: 'Sell', size: '0.1', price: 67800, pnl: 240, bot: 'Grid Bot (TP)' },
        { time: '2024-01-14 18:30', coin: 'ETHUSDT', type: 'Buy', size: '1.2', price: 3480, pnl: 80, bot: 'DCA Bot' },
        { time: '2024-01-14 15:45', coin: 'SOLUSDT', type: 'Buy', size: '200', price: 140.2, pnl: 45, bot: 'AI Adaptive' },
      ];
      
      const totalTrades = trades.length;
      const wins = trades.filter(t => t.pnl > 0).length;
      const losses = trades.filter(t => t.pnl < 0).length;
      const avgTrade = (trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length).toFixed(2);
      
      return `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-card-label">Total Trades (30d)</div><div class="stat-card-value">${totalTrades}</div></div>
          <div class="stat-card"><div class="stat-card-label">Wins</div><div class="stat-card-value positive">${wins}</div></div>
          <div class="stat-card"><div class="stat-card-label">Losses</div><div class="stat-card-value negative">${losses}</div></div>
          <div class="stat-card"><div class="stat-card-label">Avg Trade PnL</div><div class="stat-card-value ${avgTrade >= 0 ? 'positive' : 'negative'}">$${avgTrade >= 0 ? '+' : ''}${avgTrade}</div></div>
        </div>
        <div class="content-section">
          <div class="section-header">
            <span class="section-title">Trade History</span>
            <span class="section-badge">Last 30 Days</span>
          </div>
          <div class="card table-container history-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Coin</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>PnL</th>
                  <th>Bot</th>
                </tr>
              </thead>
              <tbody>
                ${trades.map(t => `
                  <tr>
                    <td>${t.time}</td>
                    <td class="coin-name">${t.coin}</td>
                    <td class="type ${t.type.toLowerCase()}">${t.type}</td>
                    <td>${t.size}</td>
                    <td>$${Number(t.price).toLocaleString()}</td>
                    <td class="pnl ${t.pnl >= 0 ? 'positive' : 'negative'}">$${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</td>
                    <td>${t.bot}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`
    }
  },
  performance: {
    title: 'Performance',
    render: (session) => {
      const botState = session.botState || {};
      const balance = botState.balance || 0;
      return `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-card-label">Total Return</div><div class="stat-card-value positive">+18.7%</div><div class="stat-card-sub positive">Since inception</div></div>
          <div class="stat-card"><div class="stat-card-label">Max Drawdown</div><div class="stat-card-value">-4.2%</div><div class="stat-card-sub">Within acceptable range</div></div>
          <div class="stat-card"><div class="stat-card-label">Sharpe Ratio</div><div class="stat-card-value">2.14</div><div class="stat-card-sub positive">Good risk-adjusted</div></div>
          <div class="stat-card"><div class="stat-card-label">Win Rate</div><div class="stat-card-value">73.2%</div><div class="stat-card-sub positive">104 / 142 trades</div></div>
        </div>
        <div class="content-section">
          <div class="section-header">
            <span class="section-title">Weekly PnL</span>
            <span class="section-badge">7 days</span>
          </div>
          <div class="card">
            <div class="activity-feed">
              <div class="activity-item"><div class="activity-icon info">📊</div><div class="activity-text"><strong>Mon</strong> — Portfolio: $51,245,000 (+0.49%)</div><span class="activity-time">Mon</span></div>
              <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>Tue</strong> — Portfolio: $51,890,000 (+1.26%)</div><span class="activity-time">Tue</span></div>
              <div class="activity-item"><div class="activity-icon sell">↓</div><div class="activity-text"><strong>Wed</strong> — Portfolio: $51,420,000 (-0.91%)</div><span class="activity-time">Wed</span></div>
              <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>Thu</strong> — Portfolio: $52,100,000 (+1.32%)</div><span class="activity-time">Thu</span></div>
              <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>Fri</strong> — Portfolio: $52,480,000 (+0.73%)</div><span class="activity-time">Fri</span></div>
              <div class="activity-item"><div class="activity-icon info">📊</div><div class="activity-text"><strong>Sat</strong> — Portfolio: $52,480,000 (no trades)</div><span class="activity-time">Sat</span></div>
              <div class="activity-item"><div class="activity-icon info">📊</div><div class="activity-text"><strong>Sun</strong> — Portfolio: $52,480,000 (no trades)</div><span class="activity-time">Sun</span></div>
            </div>
          </div>
        </div>
        <div class="content-section">
          <div class="section-header">
            <span class="section-title">Chart BTC</span>
          </div>
          <div class="card" style="padding: 0;">
            <div class="btc-chart-container" id="btcChartContainer"></div>
          </div>
        </div>
        <div class="content-section">
          <div class="section-header">
            <span class="section-title">Animasi 2</span>
          </div>
          <div class="card" style="padding: 0;">
            <div class="data-robot-container" id="dataRobotContainer2" style="height: 300px; border-radius: 0; border: none;"></div>
          </div>
        </div>`
    }
  },
  guide: {
    title: 'Guide',
    render: (session) => `
      <div class="content-section">
        <div class="section-header">
          <span class="section-title">Panduan AI Auto Trade</span>
          <span class="section-badge">8 Langkah</span>
        </div>
        <div class="guide-steps">
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number scan">1</div>
              <div class="step-title">Scan</div>
            </div>
            <div class="step-desc">Memindai pasar 24/7 mencari peluang trading terbaik menggunakan algoritma AI canggih.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number detect">2</div>
              <div class="step-title">Detect</div>
            </div>
            <div class="step-desc">Mendeteksi pola harga, volume, dan indikator teknikal yang menguntungkan secara real-time.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number collect">3</div>
              <div class="step-title">Collect Data</div>
            </div>
            <div class="step-desc">Mengumpulkan data dari multiple sources: Market Data, Exchange API, News, On-Chain, Social Sentiment.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number validate">4</div>
              <div class="step-title">Validate</div>
            </div>
            <div class="step-desc">Memvalidasi sinyal trading melalui multiple AI models sebelum eksekusi untuk meminimalkan false signal.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number setup">5</div>
              <div class="step-title">Setup</div>
            </div>
            <div class="step-desc">Menyiapkan parameter trading: leverage, position size, stop loss, take profit secara otomatis.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number execution">6</div>
              <div class="step-title">Execution</div>
            </div>
            <div class="step-desc">Eksekusi order instan via Binance API dengan slippage minimal dan kecepatan tinggi.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number monitor">7</div>
              <div class="step-title">Monitor</div>
            </div>
            <div class="step-desc">Memantau posisi real-time, trailing stop, dan manajemen risiko dinamis sepanjang trade berjalan.</div>
          </div>
          <div class="guide-step">
            <div class="step-header">
              <div class="step-number profit">8</div>
              <div class="step-title">Profit</div>
            </div>
            <div class="step-desc">Realisasi profit otomatis, reinvest compound, dan laporan performa harian/mingguan/bulanan.</div>
          </div>
        </div>
      </div>`
  },
  about: {
    title: 'About',
    render: (session) => `
      <div class="content-section">
        <div class="section-header">
          <span class="section-title">Tentang AI Auto Trade</span>
        </div>
        <div class="about-grid">
          <div class="about-card">
            <h3>Cara Kerja (Workflow)</h3>
            <div class="about-list">
              <div class="about-item"><span class="about-dot scan"></span> <strong>Scan</strong> — Memindai pasar 24/7 mencari peluang</div>
              <div class="about-item"><span class="about-dot detect"></span> <strong>Detect</strong> — Mendeteksi pola & sinyal teknikal</div>
              <div class="about-item"><span class="about-dot collect"></span> <strong>Collect Data</strong> — Mengumpulkan data multi-source</div>
              <div class="about-item"><span class="about-dot validate"></span> <strong>Validate</strong> — Validasi sinyal via multiple AI models</div>
              <div class="about-item"><span class="about-dot setup"></span> <strong>Setup</strong> — Setup parameter trading otomatis</div>
              <div class="about-item"><span class="about-dot execution"></span> <strong>Execution</strong> — Eksekusi order instan via Binance API</div>
              <div class="about-item"><span class="about-dot monitor"></span> <strong>Monitor</strong> — Monitoring real-time & risk management</div>
              <div class="about-item"><span class="about-dot profit"></span> <strong>Profit</strong> — Realisasi profit & compound reinvest</div>
            </div>
          </div>
          <div class="about-card">
            <h3>Fitur Utama</h3>
            <div class="about-list">
              <div class="about-item">🤖 <strong>AI-Powered</strong> — Multiple ML models untuk analisis pasar</div>
              <div class="about-item">⚡ <strong>Real-time</strong> — Data streaming & eksekusi sub-second</div>
              <div class="about-item">🔒 <strong>Secure</strong> — API keys encrypted, IP whitelist, read-only mode</div>
              <div class="about-item">📊 <strong>Transparent</strong> — Full trade history, PnL tracking, audit trail</div>
              <div class="about-item">🔄 <strong>24/7 Auto</strong> — Fully automated, no manual intervention needed</div>
              <div class="about-item">📈 <strong>Multi-Strategy</strong> — Grid, DCA, AI Adaptive, Scalping, Arbitrage</div>
              <div class="about-item">💰 <strong>Paper & Live</strong> — Test strategies risk-free before going live</div>
              <div class="about-item">🔔 <strong>Notifications</strong> — Telegram alerts untuk setiap trade & event penting</div>
            </div>
          </div>
        </div>
      </div>`
  },
  settings: {
    title: 'Settings',
    render: (session) => {
      const exchangeKey = session.exchangeKey || {};
      const botSession = session.botSession || {};
      const botState = session.botState || {};
      const isActive = botSession.is_active || false;
      const status = botState.status || 'stopped';
      const mode = botSession.mode || 'paper';
      const lastHeartbeat = botState.last_heartbeat;
      const totalPositions = botState.total_positions || 12345; // From spreadsheet: 12345 (jumlah total open & closed posisi)

      const statusClass = status === 'running' ? 'running' : status === 'error' ? 'error' : 'stopped';
      const statusLabel = status === 'running' ? 'Running' : status === 'error' ? 'Error' : status === 'starting' ? 'Starting...' : 'Stopped';
      const statusText = isActive ? (status === 'running' ? 'Aktif & Running' : 'Aktif tapi ' + statusLabel.toLowerCase()) : 'Nonaktif';

      return `
      <div class="settings-tabs-container" role="tablist">
        <button class="settings-tab active" role="tab" data-tab="profile" aria-selected="true">Profil</button>
        <button class="settings-tab" role="tab" data-tab="exchange" aria-selected="false">Exchange</button>
        <button class="settings-tab" role="tab" data-tab="execution" aria-selected="false">Execution Cycle : ${totalPositions.toLocaleString()}</button>
        <button class="settings-tab" role="tab" data-tab="aplikasi" aria-selected="false">Aplikasi</button>
      </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Account Settings</span>
      </div>
      <div class="settings-tab-content">
        <div class="settings-panel active" role="tabpanel" data-tab="profile">
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div><label>Nama</label><input type="text" id="settingsName" value="${session.user?.name || ''}" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"></div>
            <div><label>Email</label><input type="email" id="settingsEmail" value="${session.user?.email || ''}" ${session.user?.email ? 'readonly' : ''} style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;${session.user?.email ? 'opacity:0.6;cursor:not-allowed;' : ''}"></div>
            <div><label>WhatsApp</label><div class="input-row"><select id="settingsWhatsAppCountry" style="width:180px;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;flex-shrink:0;">${getCountryOptions(session.user?.whatsappCountry || 'ID')}</select><input type="tel" id="settingsWhatsApp" value="${session.user?.whatsapp || ''}" placeholder="81234567890" style="flex:1;min-width:200px;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"></div></div>
            <div><label>Username Telegram</label><input type="text" id="settingsTelegram" value="${session.user?.telegram || ''}" placeholder="username (tanpa @)" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"></div>
            <div><label>Notifikasi</label><select id="settingsNotification" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"><option value="">Pilih notifikasi</option><option value="telegram" ${session.user?.notification === 'telegram' ? 'selected' : ''}>Telegram</option></select></div>
            <button class="btn btn-primary" id="settingsSaveBtn" style="margin-top:0.5rem;padding:0.75rem 1.5rem;">Simpan Perubahan</button>
          </div>
        </div>

        <div class="settings-panel" role="tabpanel" data-tab="exchange" hidden>
          <div class="info-banner">
            <div class="info-title">🔑 Kunci API Binance</div>
            Kunci API untuk Aplikasi AI Trading. Simpan dengan aman — Secret Key tidak akan ditampilkan kembali secara penuh.
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">Koneksi</div>
            <div class="exchange-field">
              <label>API Key</label>
              <div class="input-row">
                <input type="text" id="exchangeApiKey" value="${exchangeKey.api_key || ''}" placeholder="Masukkan API Key Binance">
              </div>
            </div>
            <div class="exchange-field">
              <label>Secret Key</label>
              <div class="input-row">
                <input type="password" id="exchangeSecretKey" value="${exchangeKey.secret_key || ''}" placeholder="Masukkan Secret Key Binance">
                <button type="button" class="btn btn-secondary" id="toggleSecretBtn">👁 Tampilkan</button>
              </div>
            </div>
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">Konfigurasi</div>
            <div class="exchange-field">
              <label>Trading Type</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" name="exchangeTradingType" value="spot" ${exchangeKey.trading_type === 'spot' ? 'checked' : ''}>
                  <span>Spot</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="exchangeTradingType" value="futures" ${exchangeKey.trading_type === 'futures' ? 'checked' : ''}>
                  <span>Futures</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="exchangeTradingType" value="both" ${exchangeKey.trading_type === 'both' ? 'checked' : ''}>
                  <span>Keduanya</span>
                </label>
              </div>
            </div>
            <div class="exchange-field">
              <label>IP Whitelist (Opsional)</label>
              <input type="text" id="exchangeIpWhitelist" value="${exchangeKey.ip_whitelist || ''}" placeholder="Contoh: 192.168.1.1, 10.0.0.1 (pisahkan koma)" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Kosongkan untuk allow all IP. Disarankan isi IP server bot Anda untuk keamanan.</div>
            </div>
            <div class="exchange-field">
              <label>Label</label>
              <input type="text" id="exchangeLabel" value="${exchangeKey.label || 'Main Account'}" placeholder="Contoh: Main Account, Sub Bot 1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-primary" id="exchangeSaveBtn">Simpan Exchange</button>
            <button class="btn btn-danger" id="exchangeDeleteBtn" style="display:${exchangeKey.api_key ? 'inline-flex' : 'none'}">Hapus Kunci</button>
          </div>
        </div>

        <div class="settings-panel" role="tabpanel" data-tab="execution" hidden>
          <div class="info-banner">
            <div class="info-title">⚙️ Execution Cycle Settings</div>
            Konfigurasi siklus eksekusi trading bot: interval scanning, validasi sinyal, dan parameter eksekusi order.
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">Scan Interval</div>
            <div class="exchange-field">
              <label>Market Scan Interval (detik)</label>
              <input type="number" id="executionScanInterval" value="${botSession.scan_interval || 30}" min="10" max="300" step="10" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Interval pemindaian pasar untuk mencari peluang trading. Lebih cepat = lebih responsif tapi lebih banyak API calls.</div>
            </div>
            <div class="exchange-field">
              <label>Signal Validation Interval (detik)</label>
              <input type="number" id="executionValidationInterval" value="${botSession.validation_interval || 60}" min="30" max="600" step="30" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Interval validasi sinyal melalui multiple AI models sebelum eksekusi.</div>
            </div>
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">Risk Parameters</div>
            <div class="exchange-field">
              <label>Max Position Size (% dari balance)</label>
              <input type="number" id="executionMaxPosition" value="${botSession.max_position_pct || 5}" min="1" max="50" step="1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Persentase maksimum balance per posisi. Disarankan 1-10%.</div>
            </div>
            <div class="exchange-field">
              <label>Max Leverage</label>
              <input type="number" id="executionMaxLeverage" value="${botSession.max_leverage || 20}" min="1" max="125" step="1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Leverage maksimum yang diizinkan. Futures Binance max 125x.</div>
            </div>
            <div class="exchange-field">
              <label>Default Stop Loss (%)</label>
              <input type="number" id="executionStopLoss" value="${botSession.default_stop_loss || 2}" min="0.5" max="20" step="0.5" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Stop loss default untuk semua posisi. 0 = tidak ada SL otomatis.</div>
            </div>
            <div class="exchange-field">
              <label>Default Take Profit (%)</label>
              <input type="number" id="executionTakeProfit" value="${botSession.default_take_profit || 4}" min="0.5" max="50" step="0.5" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Take profit default untuk semua posisi. 0 = tidak ada TP otomatis.</div>
            </div>
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">Execution Mode</div>
            <div class="exchange-field">
              <label>Order Type</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" name="executionOrderType" value="market" ${botSession.order_type === 'market' ? 'checked' : ''}>
                  <span>Market Order</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="executionOrderType" value="limit" ${botSession.order_type === 'limit' ? 'checked' : ''}>
                  <span>Limit Order</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="executionOrderType" value="post_only" ${botSession.order_type === 'post_only' ? 'checked' : ''}>
                  <span>Post Only (Maker)</span>
                </label>
              </div>
              <div class="hint">Market = eksekusi instan, Limit = harga tertentu, Post Only = hanya maker fee.</div>
            </div>
            <div class="exchange-field">
              <label>Slippage Tolerance (%)</label>
              <input type="number" id="executionSlippage" value="${botSession.slippage_tolerance || 0.5}" min="0.1" max="5" step="0.1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Toleransi slippage untuk market order. Lebih kecil = lebih aman tapi mungkin tidak terekseskusi.</div>
            </div>
            <div class="exchange-field">
              <label>Max Concurrent Positions</label>
              <input type="number" id="executionMaxPositions" value="${botSession.max_concurrent_positions || 10}" min="1" max="50" step="1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Jumlah posisi terbuka maksimum sekaligus.</div>
            </div>
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">AI Model Configuration</div>
            <div class="exchange-field">
              <label>AI Confidence Threshold</label>
              <input type="number" id="executionAIConfidence" value="${botSession.ai_confidence_threshold || 75}" min="50" max="99" step="1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Minimum confidence score (0-100) dari AI models untuk mengeksekusi trade.</div>
            </div>
            <div class="exchange-field">
              <label>Models Required for Consensus</label>
              <input type="number" id="executionModelsRequired" value="${botSession.models_required || 2}" min="1" max="5" step="1" style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
              <div class="hint">Jumlah model AI yang harus sepakat sebelum sinyal divalidasi.</div>
            </div>
            <div class="exchange-field">
              <label>Enable Multi-Timeframe Analysis</label>
              <div class="toggle-container">
                <div class="toggle-info">
                  <div class="toggle-title">Multi-Timeframe</div>
                  <div class="toggle-desc">Analisis 1m, 5m, 15m, 1h, 4h timeframe</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="executionMultiTimeframe" ${botSession.multi_timeframe !== false ? 'checked' : ''}>
                  <span class="toggle-slider">
                    <span class="toggle-thumb"></span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-primary" id="executionSaveBtn">Simpan Execution Cycle</button>
          </div>
        </div>

        <div class="settings-panel" role="tabpanel" data-tab="aplikasi" hidden>
          <div class="info-banner">
            <div class="info-title">🤖 Trading Bot Control</div>
            Kelola status dan mode trading bot Anda.
          </div>

          <div class="exchange-section">
            <div class="exchange-section-title">Bot Status</div>
            <div class="toggle-container">
              <div class="toggle-info">
                <div class="toggle-title">Trading Bot</div>
                <div class="toggle-desc">ON/OFF Trading Bot</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="botToggleSettings" ${isActive ? 'checked' : ''}>
                <span class="toggle-slider">
                  <span class="toggle-thumb"></span>
                </span>
              </label>
            </div>
            <div style="margin-top:0.75rem;padding:0.75rem;background:var(--bg-input);border-radius:var(--radius-md);font-size:0.85rem;color:var(--text-secondary);">
              <strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span>
              <span style="margin-left:1rem;">${mode === 'live' ? '🔴 LIVE MODE' : '📝 Paper Trading'}</span>
              ${lastHeartbeat ? `<span style="margin-left:1rem;">Terupdate: ${timeAgo(new Date(lastHeartbeat))}</span>` : ''}
            </div>
          </div>

          <div class="action-row" style="margin-top:1.5rem;">
            <button class="btn btn-primary" id="botSaveSettingsBtn" ${isActive ? 'disabled' : ''}>Simpan Pengaturan Bot</button>
          </div>
        </div>
      </div>
    </div>`
    }
  }
};

// ============ Settings Handlers ============
function attachSettingsSaveHandler(session) {
  const saveBtn = document.getElementById('settingsSaveBtn');
  const nameInput = document.getElementById('settingsName');
  const emailInput = document.getElementById('settingsEmail');
  const whatsappCountrySelect = document.getElementById('settingsWhatsAppCountry');
  const whatsappInput = document.getElementById('settingsWhatsApp');
  const telegramInput = document.getElementById('settingsTelegram');
  const notificationSelect = document.getElementById('settingsNotification');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const newName = nameInput?.value?.trim();
      const newWhatsAppCountry = whatsappCountrySelect?.value;
      const newWhatsApp = whatsappInput?.value?.trim();
      const newTelegram = telegramInput?.value?.trim();
      const newNotification = notificationSelect?.value;
      
      if (!newName) {
        alert('Nama tidak boleh kosong');
        return;
      }
      
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Menyimpan...';
      saveBtn.disabled = true;
      
      try {
        const profileData = {
          id: session.user.id,
          full_name: newName,
          whatsapp_country: newWhatsAppCountry,
          whatsapp: newWhatsApp,
          telegram: newTelegram,
          notification: newNotification || 'telegram'
        };
        
        const { error } = await upsertProfile(profileData);
        if (error) throw error;
        
        session.user.name = newName;
        session.user.whatsappCountry = newWhatsAppCountry;
        session.user.whatsapp = newWhatsApp;
        session.user.telegram = newTelegram;
        session.user.notification = newNotification || 'telegram';
        localStorage.setItem('auth_session', JSON.stringify(session));
        
        const topbarName = document.getElementById('topbarName');
        if (topbarName) topbarName.textContent = newName;
        
        const dropdownName = document.querySelector('.user-dropdown .user-name');
        if (dropdownName) dropdownName.textContent = newName;
        
        saveBtn.textContent = 'Tersimpan!';
        saveBtn.style.background = 'var(--accent-secondary)';
        saveBtn.style.borderColor = 'var(--accent-secondary)';
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
          saveBtn.style.borderColor = '';
        }, 2000);
        
      } catch (err) {
        console.error('Failed to save settings:', err);
        saveBtn.textContent = 'Gagal, coba lagi';
        saveBtn.style.background = 'var(--accent-danger)';
        saveBtn.style.borderColor = 'var(--accent-danger)';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
          saveBtn.style.borderColor = '';
        }, 2000);
      } finally {
        saveBtn.disabled = false;
      }
    });
  }
}

function attachExchangeTabHandlers(session) {
  const tabButtons = document.querySelectorAll('.settings-tab');
  const tabPanels = document.querySelectorAll('.settings-panel');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        b.setAttribute('aria-selected', b.dataset.tab === tab);
      });
      tabPanels.forEach(p => {
        const isActive = p.dataset.tab === tab;
        p.classList.toggle('active', isActive);
        p.hidden = !isActive;
        if (isActive && tab === 'exchange' && !p.dataset.loaded) {
          loadExchangeKey(session);
          p.dataset.loaded = 'true';
        }
        if (isActive && tab === 'aplikasi' && !p.dataset.loaded) {
          loadBotSettingsUI(session);
          attachAplikasiTabHandlers(session);
          p.dataset.loaded = 'true';
        }
        if (isActive && tab === 'execution' && !p.dataset.loaded) {
          attachExecutionTabHandlers(session);
          p.dataset.loaded = 'true';
        }
      });
    });
  });
  
  const toggleSecretBtn = document.getElementById('toggleSecretBtn');
  const secretInput = document.getElementById('exchangeSecretKey');
  
  if (toggleSecretBtn && secretInput) {
    toggleSecretBtn.addEventListener('click', () => {
      const isPassword = secretInput.type === 'password';
      secretInput.type = isPassword ? 'text' : 'password';
      toggleSecretBtn.textContent = isPassword ? '🙈 Sembunyikan' : '👁 Tampilkan';
    });
  }
  
  const exchangeSaveBtn = document.getElementById('exchangeSaveBtn');
  if (exchangeSaveBtn) {
    exchangeSaveBtn.addEventListener('click', async () => {
      await saveExchangeKey(session);
    });
  }
  
  const exchangeDeleteBtn = document.getElementById('exchangeDeleteBtn');
  if (exchangeDeleteBtn) {
    exchangeDeleteBtn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus kunci API Binance?')) {
        await deleteExchangeKey(session);
      }
    });
  }
}

async function loadExchangeKey(session) {
  try {
    const { data, error } = await getExchangeKey(session.user.id, 'binance');
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      const apiKeyInput = document.getElementById('exchangeApiKey');
      const secretInput = document.getElementById('exchangeSecretKey');
      const tradingTypeInputs = document.querySelectorAll('input[name="exchangeTradingType"]');
      const ipWhitelistInput = document.getElementById('exchangeIpWhitelist');
      const labelInput = document.getElementById('exchangeLabel');
      const deleteBtn = document.getElementById('exchangeDeleteBtn');
      
      if (apiKeyInput) apiKeyInput.value = data.api_key || '';
      if (secretInput) secretInput.value = data.secret_key || '';
      
      tradingTypeInputs.forEach(input => {
        input.checked = input.value === (data.trading_type || 'spot');
      });
      
      if (ipWhitelistInput) ipWhitelistInput.value = data.ip_whitelist || '';
      if (labelInput) labelInput.value = data.label || 'Main Account';
      if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    }
  } catch (err) {
    console.error('Failed to load exchange key:', err);
  }
}

async function saveExchangeKey(session) {
  const saveBtn = document.getElementById('exchangeSaveBtn');
  const apiKey = document.getElementById('exchangeApiKey')?.value?.trim();
  const secretKey = document.getElementById('exchangeSecretKey')?.value?.trim();
  const tradingType = document.querySelector('input[name="exchangeTradingType"]:checked')?.value || 'spot';
  const ipWhitelist = document.getElementById('exchangeIpWhitelist')?.value?.trim();
  const label = document.getElementById('exchangeLabel')?.value?.trim() || 'Main Account';
  
  if (!apiKey || !secretKey) {
    alert('API Key dan Secret Key wajib diisi');
    return;
  }
  
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Menyimpan...';
  saveBtn.disabled = true;
  
  try {
    const { error } = await upsertExchangeKey({
      user_id: session.user.id,
      exchange: 'binance',
      api_key: apiKey,
      secret_key: secretKey,
      trading_type: tradingType,
      ip_whitelist: ipWhitelist,
      label,
      is_active: true
    });
    
    if (error) throw error;
    
    session.exchangeKey = {
      api_key: apiKey,
      secret_key: secretKey,
      trading_type: tradingType,
      ip_whitelist: ipWhitelist,
      label
    };
    localStorage.setItem('auth_session', JSON.stringify(session));
    
    saveBtn.textContent = 'Tersimpan!';
    saveBtn.style.background = 'var(--accent-secondary)';
    saveBtn.style.borderColor = 'var(--accent-secondary)';
    
    const deleteBtn = document.getElementById('exchangeDeleteBtn');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
      saveBtn.style.borderColor = '';
    }, 2000);
    
  } catch (err) {
    console.error('Failed to save exchange key:', err);
    const errorMsg = err?.message || err?.details || err?.hint || JSON.stringify(err) || 'Unknown error';
    saveBtn.textContent = 'Gagal: ' + errorMsg.substring(0, 80);
    saveBtn.style.background = 'var(--accent-danger)';
    saveBtn.style.borderColor = 'var(--accent-danger)';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
      saveBtn.style.borderColor = '';
    }, 8000);
  } finally {
    saveBtn.disabled = false;
  }
}

async function deleteExchangeKey(session) {
  const deleteBtn = document.getElementById('exchangeDeleteBtn');
  const originalText = deleteBtn.textContent;
  deleteBtn.textContent = 'Menghapus...';
  deleteBtn.disabled = true;
  
  try {
    const { error } = await deleteExchangeKeyFn(session.user.id, 'binance');
    if (error) throw error;
    
    document.getElementById('exchangeApiKey').value = '';
    document.getElementById('exchangeSecretKey').value = '';
    document.querySelector('input[name="exchangeTradingType"][value="spot"]').checked = true;
    document.getElementById('exchangeIpWhitelist').value = '';
    document.getElementById('exchangeLabel').value = 'Main Account';
    deleteBtn.style.display = 'none';
    
    session.exchangeKey = {};
    localStorage.setItem('auth_session', JSON.stringify(session));
    
    alert('Kunci API berhasil dihapus');
    
  } catch (err) {
    console.error('Failed to delete exchange key:', err);
    alert('Gagal menghapus: ' + err.message);
  } finally {
    deleteBtn.textContent = originalText;
    deleteBtn.disabled = false;
  }
}

async function deleteExchangeKeyFn(userId, exchange) {
  const { error } = await supabase
    .from('exchange_keys')
    .delete()
    .eq('user_id', userId)
    .eq('exchange', exchange);
  return { error };
}

// ============ Aplikasi Tab Handlers ============
function loadBotSettingsUI(session) {
  const botSession = session.botSession || {};
  const botState = session.botState || {};
  const isActive = botSession.is_active || false;
  const status = botState.status || 'stopped';
  const mode = botSession.mode || 'paper';
  const lastHeartbeat = botState.last_heartbeat;

  const statusClass = status === 'running' ? 'running' : status === 'error' ? 'error' : 'stopped';
  const statusLabel = status === 'running' ? 'Running' : status === 'error' ? 'Error' : status === 'starting' ? 'Starting...' : 'Stopped';
  const statusText = isActive ? (status === 'running' ? 'Aktif & Running' : 'Aktif tapi ' + statusLabel.toLowerCase()) : 'Nonaktif';

  const toggle = document.getElementById('botToggleSettings');
  if (toggle) toggle.checked = isActive;
  
  const statusBadge = document.querySelector('.settings-panel[data-tab="aplikasi"] .status-badge');
  if (statusBadge) {
    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.textContent = isActive ? (status === 'running' ? 'Aktif & Running' : 'Aktif tapi ' + statusLabel.toLowerCase()) : 'Nonaktif';
  }

  const statusDisplay = document.querySelector('.settings-panel[data-tab="aplikasi"] .toggle-desc');
  if (statusDisplay) statusDisplay.textContent = 'ON/OFF Trading Bot';
}

function attachAplikasiTabHandlers(session) {
  const toggle = document.getElementById('botToggleSettings');
  if (toggle && !toggle.dataset.listener) {
    toggle.dataset.listener = 'true';
    
    // Handle both change event (checkbox) and click event (label/slider)
    const handleToggle = async (e) => {
      const isActive = toggle.checked;
      console.log('[Bot Toggle] User toggled to:', isActive);
      toggle.disabled = true;
      try {
        const { error } = await toggleBotSession(session.user.id, isActive);
        if (error) {
          console.error('[Bot Toggle] API error:', error);
          throw error;
        }
        console.log('[Bot Toggle] API success, updating local session');
        
        session.botSession = { ...session.botSession, is_active: isActive };
        localStorage.setItem('auth_session', JSON.stringify(session));
        loadBotSettingsUI(session);
        console.log('[Bot Toggle] UI updated, localStorage saved');
        
      } catch (err) {
        console.error('[Bot Toggle] Failed:', err);
        alert('Gagal mengubah status bot: ' + (err.message || err));
        toggle.checked = !isActive;
      } finally {
        toggle.disabled = false;
      }
    };
    
    toggle.addEventListener('change', handleToggle);
    // Also handle click on the label/slider for better UX
    const toggleLabel = toggle.closest('.toggle-switch');
    if (toggleLabel) {
      toggleLabel.addEventListener('click', (e) => {
        // Only trigger if not clicking directly on checkbox (to avoid double-fire)
        if (e.target !== toggle) {
          toggle.click();
        }
      });
    }
  }

  const saveBtn = document.getElementById('botSaveSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.textContent = 'Tersimpan!';
      saveBtn.style.background = 'var(--accent-secondary)';
      saveBtn.style.borderColor = 'var(--accent-secondary)';
      setTimeout(() => {
        saveBtn.textContent = 'Simpan Pengaturan Bot';
        saveBtn.style.background = '';
        saveBtn.style.borderColor = '';
      }, 2000);
    });
  }
}

// ============ Execution Cycle Tab Handlers ============
function attachExecutionTabHandlers(session) {
  const saveBtn = document.getElementById('executionSaveBtn');
  if (saveBtn && !saveBtn.dataset.listener) {
    saveBtn.dataset.listener = 'true';
    saveBtn.addEventListener('click', async () => {
      const scanInterval = parseInt(document.getElementById('executionScanInterval')?.value) || 30;
      const validationInterval = parseInt(document.getElementById('executionValidationInterval')?.value) || 60;
      const maxPositionPct = parseFloat(document.getElementById('executionMaxPosition')?.value) || 5;
      const maxLeverage = parseInt(document.getElementById('executionMaxLeverage')?.value) || 20;
      const stopLoss = parseFloat(document.getElementById('executionStopLoss')?.value) || 2;
      const takeProfit = parseFloat(document.getElementById('executionTakeProfit')?.value) || 4;
      const orderType = document.querySelector('input[name="executionOrderType"]:checked')?.value || 'market';
      const slippage = parseFloat(document.getElementById('executionSlippage')?.value) || 0.5;
      const maxPositions = parseInt(document.getElementById('executionMaxPositions')?.value) || 10;
      const aiConfidence = parseInt(document.getElementById('executionAIConfidence')?.value) || 75;
      const modelsRequired = parseInt(document.getElementById('executionModelsRequired')?.value) || 2;
      const multiTimeframe = document.getElementById('executionMultiTimeframe')?.checked !== false;

      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Menyimpan...';
      saveBtn.disabled = true;

      try {
        const updates = {
          scan_interval: scanInterval,
          validation_interval: validationInterval,
          max_position_pct: maxPositionPct,
          max_leverage: maxLeverage,
          default_stop_loss: stopLoss,
          default_take_profit: takeProfit,
          order_type: orderType,
          slippage_tolerance: slippage,
          max_concurrent_positions: maxPositions,
          ai_confidence_threshold: aiConfidence,
          models_required: modelsRequired,
          multi_timeframe: multiTimeframe
        };

        const { error } = await updateBotSession(session.botSession.id, updates);
        if (error) throw error;

        session.botSession = { ...session.botSession, ...updates };
        localStorage.setItem('auth_session', JSON.stringify(session));

        saveBtn.textContent = 'Tersimpan!';
        saveBtn.style.background = 'var(--accent-secondary)';
        saveBtn.style.borderColor = 'var(--accent-secondary)';

        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
          saveBtn.style.borderColor = '';
        }, 2000);

      } catch (err) {
        console.error('Failed to save execution settings:', err);
        const errorMsg = err?.message || err?.details || err?.hint || JSON.stringify(err) || 'Unknown error';
        saveBtn.textContent = 'Gagal: ' + errorMsg.substring(0, 80);
        saveBtn.style.background = 'var(--accent-danger)';
        saveBtn.style.borderColor = 'var(--accent-danger)';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
          saveBtn.style.borderColor = '';
        }, 8000);
      } finally {
        saveBtn.disabled = false;
      }
    });
  }
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', async () => {
  let session = await requireAuthWrapper();
  if (!session) return;

  // Initialize theme and language selectors (shared with landing page)
  initTheme('#themeToggle');
  initLanguage();

  const avatar = document.getElementById('topbarAvatar');
  const name = document.getElementById('topbarName');
  if (avatar) avatar.src = session.user.avatar;
  if (name) name.textContent = session.user.name;

  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Sidebar Bot Toggle Handler
  const sidebarBotToggle = document.getElementById('botSidebarToggle');
  const handleSidebarBotToggle = async (e) => {
    if (!e.target.matches('#botSidebarToggle')) return;
    const isActive = e.target.checked;
    console.log('[Sidebar Bot Toggle] User toggled to:', isActive);
    e.target.disabled = true;
    try {
      const { error } = await toggleBotSession(session.user.id, isActive);
      if (error) throw error;
      session.botSession = { ...session.botSession, is_active: isActive };
      localStorage.setItem('auth_session', JSON.stringify(session));
      // Re-render overview to update status text
      if (pageContent && document.querySelector('.nav-item.active')?.dataset.page === 'overview') {
        const robotContainer = document.getElementById('dataRobotContainer');
        if (robotContainer) robotContainer.dataset.initialized = 'false';
        pageContent.innerHTML = pages.overview.render(session);
        // Re-attach toggle handler
        const newToggle = document.getElementById('botSidebarToggle');
        if (newToggle) newToggle.addEventListener('change', handleSidebarBotToggle);
      }
    } catch (err) {
      console.error('[Sidebar Bot Toggle] Failed:', err);
      alert('Gagal mengubah status bot: ' + (err.message || err));
      e.target.checked = !isActive;
    } finally {
      e.target.disabled = false;
    }
  };

  if (sidebarBotToggle) sidebarBotToggle.addEventListener('change', handleSidebarBotToggle);

  async function loadBotData(session) {
    try {
      const [{ data: botSession }, { data: botState }] = await Promise.all([
        getBotSession(session.user.id),
        session.botSession?.id ? getBotState(session.botSession.id) : { data: null, error: null }
      ]);
      
      session.botSession = botSession || {};
      session.botState = botState || {};
      return session;
    } catch (err) {
      console.error('Failed to load bot data:', err);
      session.botSession = {};
      session.botState = {};
      return session;
    }
  }

  const navItems = document.querySelectorAll('.nav-item');
  const pageTitle = document.getElementById('pageTitle');
  const pageContent = document.getElementById('pageContent');

  function navigateTo(pageName) {
    if (pageName === 'logout') {
      signOut().then(() => {
        localStorage.removeItem('auth_session');
        window.location.href = '/';
      });
      return;
    }

    navItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageName));
    const pg = pages[pageName];
    if (!pg) return;
    
    if (pageTitle) pageTitle.textContent = pg.title;

    if (pageName === 'settings') {
      loadBotData(session).then(updatedSession => {
        session = updatedSession;
        if (pageContent) pageContent.innerHTML = pg.render(session);
        attachSettingsSaveHandler(session);
        attachExchangeTabHandlers(session);
        updateDynamicI18n();
      });
    } else {
      if (pageContent) pageContent.innerHTML = pg.render(session);
      updateDynamicI18n();

      // Initialize animations for specific pages
      if (pageName === 'overview') {
        // No animation initialization needed - placeholders are static
      }
      if (pageName === 'performance') {
        setTimeout(() => {
          initBTCRealTimeChart('#btcChartContainer', {
            interval: '1m',
            symbol: 'BTCUSDT',
            maxCandles: 200
          });
        }, 0);
      }
    }
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  loadBotData(session).then(s => {
    session = s;
    
    // Start realtime subscription for bot_state updates
    if (session.botSession?.id) {
      console.log('[Dashboard] Starting realtime subscription for bot_state:', session.botSession.id);
      subscribeBotState(session.botSession.id, (payload) => {
        console.log('[Dashboard] Realtime bot_state update:', payload);
        if (payload.new) {
          session.botState = payload.new;
          // Re-render current page if it's overview
          const currentPage = document.querySelector('.nav-item.active')?.dataset.page;
          if (currentPage === 'overview' && pageContent) {
            // Reset initialized flag so animation restarts
            const robotContainer = document.getElementById('dataRobotContainer');
            if (robotContainer) robotContainer.dataset.initialized = 'false';
            pageContent.innerHTML = pages.overview.render(session);
            // Re-attach sidebar toggle handler
            const newToggle = document.getElementById('botSidebarToggle');
            if (newToggle) newToggle.addEventListener('change', handleSidebarBotToggle);
          }
        }
      });
    }
    
    navigateTo('overview');
  });
});