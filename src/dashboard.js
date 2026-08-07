import i18next from './i18n.js';
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
      const dailyPnL = botState.daily_pnl || 0;
      const totalPnL = botState.total_pnl || 0;

      const statusClass = status === 'running' ? 'running' : status === 'error' ? 'error' : 'stopped';
      const statusLabel = status === 'running' ? 'Running' : status === 'error' ? 'Error' : status === 'starting' ? 'Starting...' : 'Stopped';
      const statusText = isActive ? (status === 'running' ? 'Aktif & Running' : 'Aktif tapi ' + statusLabel.toLowerCase()) : 'Nonaktif';

      return `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-label">Total Balance</div>
            <div class="stat-card-value">${formatIDR(session.balance || 50000000)}</div>
            <div class="stat-card-change positive">+12.5% this week</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Trading Bot</div>
            <div class="stat-card-value">
              <span class="status-badge ${isActive ? 'running' : 'stopped'}">${statusText}</span>
            </div>
            <div class="stat-card-change">${mode === 'live' ? '🔴 LIVE MODE' : '📝 Paper Trading'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Today's PnL</div>
            <div class="stat-card-value ${dailyPnL >= 0 ? 'positive' : 'negative'}">${formatIDR(dailyPnL)}</div>
            <div class="stat-card-change">Daily</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Win Rate</div>
            <div class="stat-card-value">73.2%</div>
            <div class="stat-card-change positive">+2.1% vs last week</div>
          </div>
        </div>
        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Active Bots</span>
              <span class="card-badge">Live</span>
            </div>
            <div class="bot-list">
              <div class="bot-item">
                <div class="bot-info">
                  <div class="bot-icon running"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
                  <div><div class="bot-name">Grid Bot - BTC/USDT</div><div class="bot-strategy">Grid Trading · 0.5% spread</div></div>
                </div>
                <div class="bot-pnl"><div class="bot-pnl-value positive">+2.34%</div><div class="bot-pnl-label">Today</div></div>
              </div>
              <div class="bot-item">
                <div class="bot-info">
                  <div class="bot-icon running"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/></svg></div>
                  <div><div class="bot-name">DCA Bot - ETH/USDT</div><div class="bot-strategy">Dollar Cost Average</div></div>
                </div>
                <div class="bot-pnl"><div class="bot-pnl-value positive">+1.87%</div><div class="bot-pnl-label">Today</div></div>
              </div>
              <div class="bot-item">
                <div class="bot-info">
                  <div class="bot-icon paused"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></div>
                  <div><div class="bot-name">AI Adaptive - SOL/USDT</div><div class="bot-strategy">AI Adaptive · ML-based</div></div>
                </div>
                <div class="bot-pnl"><div class="bot-pnl-value">0.00%</div><div class="bot-pnl-label">Paused</div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Activity</span>
            <span class="card-badge">Today</span>
          </div>
          <div class="activity-feed">
            <div class="activity-item">
              <div class="activity-icon buy">↑</div>
              <div class="activity-text"><strong>Buy</strong> 0.05 BTC at $67,420</div>
              <span class="activity-time">12m ago</span>
            </div>
            <div class="activity-item">
              <div class="activity-icon sell">↓</div>
              <div class="activity-text"><strong>Sell</strong> 0.2 ETH at $3,520</div>
              <span class="activity-time">28m ago</span>
            </div>
            <div class="activity-item">
              <div class="activity-icon info">i</div>
              <div class="activity-text">Grid Bot rebalanced BTC/USDT</div>
              <span class="activity-time">1h ago</span>
            </div>
            <div class="activity-item">
              <div class="activity-icon buy">↑</div>
              <div class="activity-text"><strong>Buy</strong> 50 SOL at $142.50</div>
              <span class="activity-time">3h ago</span>
            </div>
            <div class="activity-item">
              <div class="activity-icon sell">↓</div>
              <div class="activity-text"><strong>Take Profit</strong> ETH +2.34%</div>
              <span class="activity-time">5h ago</span>
            </div>
          </div>
        </div>
      </div>`
    }
  },
  bots: {
    title: 'Bots',
    render: (session) => `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-label">Total Bots</div><div class="stat-card-value">5</div></div>
        <div class="stat-card"><div class="stat-card-label">Running</div><div class="stat-card-value" style="color:var(--accent-secondary)">3</div></div>
        <div class="stat-card"><div class="stat-card-label">Paused</div><div class="stat-card-value" style="color:var(--accent-warm)">1</div></div>
        <div class="stat-card"><div class="stat-card-label">Stopped</div><div class="stat-card-value" style="color:var(--accent-danger)">1</div></div>
      </div>
      <div class="card">
        <div class="bot-list">
          <div class="bot-item"><div class="bot-info"><div class="bot-icon running">⬡</div><div><div class="bot-name">Grid Bot - BTC/USDT</div><div class="bot-strategy">Grid Trading · 0.5% spread · $5,000 range</div></div></div><div class="bot-pnl"><div class="bot-pnl-value positive">+2.34%</div><div class="bot-pnl-label">Running</div></div></div>
          <div class="bot-item"><div class="bot-info"><div class="bot-icon running">◉</div><div><div class="bot-name">DCA Bot - ETH/USDT</div><div class="bot-strategy">Dollar Cost Average · $500/week</div></div></div><div class="bot-pnl"><div class="bot-pnl-value positive">+1.87%</div><div class="bot-pnl-label">Running</div></div></div>
          <div class="bot-item"><div class="bot-info"><div class="bot-icon paused">⏸</div><div><div class="bot-name">AI Adaptive - SOL/USDT</div><div class="bot-strategy">ML-based · paused for review</div></div></div><div class="bot-pnl"><div class="bot-pnl-value">0.00%</div><div class="bot-pnl-label">Paused</div></div></div>
          <div class="bot-item"><div class="bot-info"><div class="bot-icon stopped">■</div><div><div class="bot-name">Scalper - ADA/USDT</div><div class="bot-strategy">Scalping · stopped manually</div></div></div><div class="bot-pnl"><div class="bot-pnl-value negative">-0.12%</div><div class="bot-pnl-label">Stopped</div></div></div>
          <div class="bot-item"><div class="bot-info"><div class="bot-icon stopped">■</div><div><div class="bot-name">Arbitrage - ETH/MATIC</div><div class="bot-strategy">Cross-exchange arb · inactive</div></div></div><div class="bot-pnl"><div class="bot-pnl-value">—</div><div class="bot-pnl-label">No data</div></div></div>
        </div>
      </div>`
  },
  trades: {
    title: 'Trades',
    render: (session) => `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-label">Total Trades (30d)</div><div class="stat-card-value">142</div></div>
        <div class="stat-card"><div class="stat-card-label">Wins</div><div class="stat-card-value positive">104</div></div>
        <div class="stat-card"><div class="stat-card-label">Losses</div><div class="stat-card-value negative">38</div></div>
        <div class="stat-card"><div class="stat-card-label">Avg Trade</div><div class="stat-card-value">$350</div></div>
      </div>
      <div class="card">
        <div class="activity-feed">
          <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>BUY</strong> 0.05 BTC/USDT @ $67,420 — Grid Bot</div><span class="activity-time">12m ago</span></div>
          <div class="activity-item"><div class="activity-icon sell">↓</div><div class="activity-text"><strong>SELL</strong> 0.2 ETH/USDT @ $3,520 — DCA Bot</div><span class="activity-time">28m ago</span></div>
          <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>BUY</strong> 50 SOL/USDT @ $142.50 — AI Adaptive</div><span class="activity-time">3h ago</span></div>
          <div class="activity-item"><div class="activity-icon sell">↓</div><div class="activity-text"><strong>SELL</strong> 0.1 BTC/USDT @ $67,800 — Grid Bot (TP)</div><span class="activity-time">5h ago</span></div>
          <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>BUY</strong> 100 MATIC/USDT @ $0.72 — DCA Bot</div><span class="activity-time">8h ago</span></div>
          <div class="activity-item"><div class="activity-icon sell">↓</div><div class="activity-text"><strong>SELL</strong> 200 ADA/USDT @ $0.45 — Scalper (SL)</div><span class="activity-time">1d ago</span></div>
        </div>
      </div>`
  },
  performance: {
    title: 'Performance',
    render: (session) => `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-label">Total Return</div><div class="stat-card-value positive">+18.7%</div><div class="stat-card-change positive">Since inception</div></div>
        <div class="stat-card"><div class="stat-card-label">Max Drawdown</div><div class="stat-card-value">-4.2%</div><div class="stat-card-change">Within acceptable range</div></div>
        <div class="stat-card"><div class="stat-card-label">Sharpe Ratio</div><div class="stat-card-value">2.14</div><div class="stat-card-change positive">Good risk-adjusted</div></div>
        <div class="stat-card"><div class="stat-card-label">Win Rate</div><div class="stat-card-value">73.2%</div><div class="stat-card-change positive">104 / 142 trades</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Weekly PnL</span><span class="card-badge">7 days</span></div>
        <div class="activity-feed">
          <div class="activity-item"><div class="activity-icon info">📊</div><div class="activity-text"><strong>Mon</strong> — Portfolio: $51,245,000 (+0.49%)</div><span class="activity-time">Mon</span></div>
          <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>Tue</strong> — Portfolio: $51,890,000 (+1.26%)</div><span class="activity-time">Tue</span></div>
          <div class="activity-item"><div class="activity-icon sell">↓</div><div class="activity-text"><strong>Wed</strong> — Portfolio: $51,420,000 (-0.91%)</div><span class="activity-time">Wed</span></div>
          <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>Thu</strong> — Portfolio: $52,100,000 (+1.32%)</div><span class="activity-time">Thu</span></div>
          <div class="activity-item"><div class="activity-icon buy">↑</div><div class="activity-text"><strong>Fri</strong> — Portfolio: $52,480,000 (+0.73%)</div><span class="activity-time">Fri</span></div>
          <div class="activity-item"><div class="activity-icon info">📊</div><div class="activity-text"><strong>Sat</strong> — Portfolio: $52,480,000 (no trades)</div><span class="activity-time">Sat</span></div>
          <div class="activity-item"><div class="activity-icon info">📊</div><div class="activity-text"><strong>Sun</strong> — Portfolio: $52,480,000 (no trades)</div><span class="activity-time">Sun</span></div>
        </div>
      </div>`
  },
  portfolio: {
    title: 'Portfolio',
    render: (session) => `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-label">Total Value</div><div class="stat-card-value">${formatIDR(session.balance || 50000000)}</div></div>
        <div class="stat-card"><div class="stat-card-label">In Positions</div><div class="stat-card-value">${formatIDR(32000000)}</div></div>
        <div class="stat-card"><div class="stat-card-label">Available</div><div class="stat-card-value">${formatIDR(18000000)}</div></div>
        <div class="stat-card"><div class="stat-card-label">Unrealized PnL</div><div class="stat-card-value positive">+${formatIDR(4200000)}</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Holdings</span><span class="card-badge">Live</span></div>
        <div class="bot-list">
          <div class="bot-item"><div class="bot-info"><div class="bot-icon running">₿</div><div><div class="bot-name">BTC</div><div class="bot-strategy">0.05 BTC · Avg $67,420</div></div></div><div class="bot-pnl"><div class="bot-pnl-value positive">+2.34%</div><div class="bot-pnl-label">$1,560,000</div></div></div>
          <div class="bot-item"><div class="bot-info"><div class="bot-icon running">Ξ</div><div><div class="bot-name">ETH</div><div class="bot-strategy">0.2 ETH · Avg $3,520</div></div></div><div class="bot-pnl"><div class="bot-pnl-value positive">+1.87%</div><div class="bot-pnl-label">$142,000</div></div></div>
          <div class="bot-item"><div class="bot-info"><div class="bot-icon running">◎</div><div><div class="bot-name">SOL</div><div class="bot-strategy">50 SOL · Avg $142.50</div></div></div><div class="bot-pnl"><div class="bot-pnl-value positive">+3.10%</div><div class="bot-pnl-label">$21,750</div></div></div>
        </div>
      </div>`
  },
  settings: {
    title: 'Pengaturan',
    render: (session) => {
      const exchangeKey = session.exchangeKey || {};
      const botSession = session.botSession || {};
      const botState = session.botState || {};
      const isActive = botSession.is_active || false;
      const status = botState.status || 'stopped';
      const mode = botSession.mode || 'paper';
      const lastHeartbeat = botState.last_heartbeat;

      const statusClass = status === 'running' ? 'running' : status === 'error' ? 'error' : 'stopped';
      const statusLabel = status === 'running' ? 'Running' : status === 'error' ? 'Error' : status === 'starting' ? 'Starting...' : 'Stopped';
      const statusText = isActive ? (status === 'running' ? 'Aktif & Running' : 'Aktif tapi ' + statusLabel.toLowerCase()) : 'Nonaktif';

      return `
      <div class="settings-tabs-container" role="tablist">
        <button class="settings-tab active" role="tab" data-tab="profile" aria-selected="true">Profil</button>
        <button class="settings-tab" role="tab" data-tab="exchange" aria-selected="false">Exchange</button>
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
    </div>`;
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

// ============ Init ============
document.addEventListener('DOMContentLoaded', async () => {
  let session = await requireAuthWrapper();
  if (!session) return;

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
      });
    } else {
      if (pageContent) pageContent.innerHTML = pg.render(session);
    }
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  loadBotData(session).then(s => {
    session = s;
    navigateTo('overview');
  });
});