import i18next from './i18n.js';
import { 
  signOut, 
  upsertProfile, 
  getExchangeKey, 
  upsertExchangeKey,
  getBotSession,
  createBotSession,
  updateBotSession,
  toggleBotSession,
  getBotState,
  subscribeBotState,
  subscribeTradeHistory,
  getTradeHistory
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
    render: (session) => `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-label">Total Balance</div>
          <div class="stat-card-value">${formatIDR(session.balance || 50000000)}</div>
          <div class="stat-card-change positive">+12.5% this week</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Active Bots</div>
          <div class="stat-card-value">3</div>
          <div class="stat-card-change">2 running, 1 paused</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Today's PnL</div>
          <div class="stat-card-value positive">+${formatIDR(245000)}</div>
          <div class="stat-card-change positive">+0.49%</div>
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
      return `
      <!-- Tabs Navigation (outside card) -->
      <div class="settings-tabs-container" role="tablist">
        <button class="settings-tab active" role="tab" data-tab="profile" aria-selected="true">Profil</button>
        <button class="settings-tab" role="tab" data-tab="exchange" aria-selected="false">Exchange</button>
      </div>
    <!-- Card Content -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Account Settings</span>
      </div>
      <div class="settings-tab-content">
        <!-- PROFIL TAB -->
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

        <!-- EXCHANGE TAB -->
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
      </div>
    </div>`;
    }
  },
  botControl: {
    title: 'Bot Control',
    render: (session) => {
      const botSession = session.botSession || {};
      const botState = session.botState || {};
      const isActive = botSession.is_active || false;
      const status = botState.status || 'stopped';
      const mode = botSession.mode || 'paper';
      const lastHeartbeat = botState.last_heartbeat;
      const dailyPnL = botState.daily_pnl || 0;
      const totalPnL = botState.total_pnl || 0;
      const positions = botState.current_positions || [];

      const statusClass = status === 'running' ? 'running' : status === 'error' ? 'error' : 'stopped';
      const statusLabel = status === 'running' ? 'Running' : status === 'error' ? 'Error' : status === 'starting' ? 'Starting...' : 'Stopped';

      return `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-label">Bot Status</div>
            <div class="stat-card-value">
              <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="stat-card-change">${mode === 'live' ? '🔴 LIVE MODE' : '📝 Paper Trading'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Today's PnL</div>
            <div class="stat-card-value ${dailyPnL >= 0 ? 'positive' : 'negative'}">${formatIDR(dailyPnL)}</div>
            <div class="stat-card-change">Daily</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Total PnL</div>
            <div class="stat-card-value ${totalPnL >= 0 ? 'positive' : 'negative'}">${formatIDR(totalPnL)}</div>
            <div class="stat-card-change">All Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Open Positions</div>
            <div class="stat-card-value">${positions.length}</div>
            <div class="stat-card-change">${lastHeartbeat ? 'Updated ' + timeAgo(new Date(lastHeartbeat)) : 'No heartbeat'}</div>
          </div>
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Bot Control</span>
              <span class="card-badge">${mode === 'live' ? 'Live' : 'Paper'}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:1.5rem;">
              <!-- Toggle Switch -->
              <div class="toggle-container">
                <div class="toggle-info">
                  <div class="toggle-title">Trading Bot</div>
                  <div class="toggle-desc">${isActive ? 'Bot aktif & mengeksekusi strategi' : 'Bot tidak aktif, klik untuk menyalakan'}</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="botToggle" ${isActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <!-- Mode Selector -->
              <div class="settings-panel" style="margin-top:1rem;">
                <div class="exchange-section">
                  <div class="exchange-section-title">Mode Trading</div>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" name="botMode" value="paper" ${mode === 'paper' ? 'checked' : ''} ${isActive ? 'disabled' : ''}>
                      <span>📝 Paper Trading (Simulasi)</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" name="botMode" value="live" ${mode === 'live' ? 'checked' : ''} ${isActive ? 'disabled' : ''}>
                      <span>🔴 Live Trading (Real Money)</span>
                    </label>
                  </div>
                  <div class="hint" style="margin-top:0.5rem;">${isActive ? 'Matikan bot dulu untuk ganti mode' : 'Pilih mode sebelum menyalakan bot'}</div>
                </div>
              </div>

              <!-- Risk Settings -->
              <div class="exchange-section">
                <div class="exchange-section-title">Risk Parameters</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
                  <div class="exchange-field">
                    <label>Max Leverage</label>
                    <input type="number" id="riskLeverage" value="${botSession.risk_params?.leverage || 10}" min="1" max="125" step="1" ${isActive ? 'disabled' : ''} style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
                  </div>
                  <div class="exchange-field">
                    <label>Max Position Size %</label>
                    <input type="number" id="riskMaxPos" value="${botSession.risk_params?.max_position_pct || 10}" min="1" max="100" step="1" ${isActive ? 'disabled' : ''} style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
                  </div>
                  <div class="exchange-field">
                    <label>Stop Loss %</label>
                    <input type="number" id="riskSL" value="${botSession.risk_params?.stop_loss_pct || 2}" min="0.1" max="50" step="0.1" ${isActive ? 'disabled' : ''} style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
                  </div>
                  <div class="exchange-field">
                    <label>Take Profit %</label>
                    <input type="number" id="riskTP" value="${botSession.risk_params?.take_profit_pct || 4}" min="0.1" max="100" step="0.1" ${isActive ? 'disabled' : ''} style="width:100%;padding:0.75rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;">
                  </div>
                </div>
              </div>

              <div class="action-row">
                <button class="btn btn-primary" id="botSaveSettingsBtn" ${isActive ? 'disabled' : ''}>Simpan Pengaturan</button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Open Positions</span>
              <span class="card-badge">Real-time</span>
            </div>
            <div class="bot-list" id="positionsList">
              ${positions.length === 0 ? `
                <div class="bot-item" style="justify-content:center;padding:2rem;color:var(--text-muted);">
                  Tidak ada posisi terbuka
                </div>
              ` : positions.map(pos => `
                <div class="bot-item">
                  <div class="bot-info">
                    <div class="bot-icon ${pos.side === 'long' ? 'running' : 'stopped'}">${pos.side === 'long' ? '↑' : '↓'}</div>
                    <div>
                      <div class="bot-name">${pos.symbol}</div>
                      <div class="bot-strategy">${pos.side.toUpperCase()} · ${pos.qty} @ $${pos.entry_price}</div>
                    </div>
                  </div>
                  <div class="bot-pnl">
                    <div class="bot-pnl-value ${pos.unrealized_pnl >= 0 ? 'positive' : 'negative'}">${pos.unrealized_pnl_pct >= 0 ? '+' : ''}${pos.unrealized_pnl_pct.toFixed(2)}%</div>
                    <div class="bot-pnl-label">${formatIDR(pos.unrealized_pnl)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:1.5rem;">
          <div class="card-header">
            <span class="card-title">Recent Trades</span>
            <span class="card-badge">Last 20</span>
          </div>
          <div class="activity-feed" id="tradesFeed">
            <div class="activity-item" style="justify-content:center;color:var(--text-muted);">Memuat riwayat trade...</div>
          </div>
        </div>

        <style>
          .toggle-container { display:flex;align-items:center;justify-content:space-between;padding:1rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color); }
          .toggle-info { flex:1; }
          .toggle-title { font-weight:600;font-size:1rem; }
          .toggle-desc { font-size:0.85rem;color:var(--text-muted);margin-top:0.25rem; }
          .switch { position:relative;display:inline-block;width:56px;height:30px;flex-shrink:0; }
          .switch input { opacity:0;width:0;height:0; }
          .slider { position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:var(--border-color);transition:.3s;border-radius:30px; }
          .slider:before { position:absolute;content:"";height:22px;width:22px;left:4px;bottom:4px;background-color:white;transition:.3s;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.2); }
          .switch input:checked + .slider { background-color:var(--accent-secondary); }
          .switch input:checked + .slider:before { transform:translateX(26px); }
          .switch input:disabled + .slider { opacity:0.5;cursor:not-allowed; }
          .status-badge { display:inline-block;padding:0.25rem 0.75rem;border-radius:999px;font-size:0.8rem;font-weight:600; }
          .status-badge.running { background:rgba(16,185,129,0.15);color:var(--accent-secondary); }
          .status-badge.stopped { background:rgba(107,114,128,0.15);color:var(--text-muted); }
          .status-badge.error { background:rgba(239,68,68,0.15);color:var(--accent-danger); }
          .status-badge.starting { background:rgba(245,158,11,0.15);color:var(--accent-warm); }
        </style>
      `;
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

// ============ Bot Control Handlers ============
function attachBotControlHandlers(session) {
  // Toggle switch
  const toggle = document.getElementById('botToggle');
  if (toggle) {
    toggle.addEventListener('change', async (e) => {
      const isActive = e.target.checked;
      toggle.disabled = true;
      try {
        const { error } = await toggleBotSession(session.user.id, isActive);
        if (error) throw error;
        
        session.botSession = { ...session.botSession, is_active: isActive };
        localStorage.setItem('auth_session', JSON.stringify(session));
        
        const desc = toggle.closest('.toggle-container').querySelector('.toggle-desc');
        if (desc) desc.textContent = isActive ? 'Bot aktif & mengeksekusi strategi' : 'Bot tidak aktif, klik untuk menyalakan';
        
        document.querySelectorAll('input[name="botMode"]').forEach(r => r.disabled = isActive);
        document.querySelectorAll('#riskLeverage, #riskMaxPos, #riskSL, #riskTP').forEach(i => i.disabled = isActive);
        const saveBtn = document.getElementById('botSaveSettingsBtn');
        if (saveBtn) saveBtn.disabled = isActive;
        
      } catch (err) {
        console.error('Toggle failed:', err);
        alert('Gagal: ' + (err.message || err));
        toggle.checked = !isActive;
      } finally {
        toggle.disabled = false;
      }
    });
  }

  // Mode radio buttons
  document.querySelectorAll('input[name="botMode"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      if (e.target.disabled) return;
      const mode = e.target.value;
      try {
        const { error } = await updateBotSession(session.user.id, { mode });
        if (error) throw error;
        session.botSession = { ...session.botSession, mode };
        localStorage.setItem('auth_session', JSON.stringify(session));
      } catch (err) {
        console.error('Mode change failed:', err);
        alert('Gagal: ' + (err.message || err));
        document.querySelector(`input[name="botMode"][value="${session.botSession.mode || 'paper'}"]`).checked = true;
      }
    });
  });

  // Save risk settings
  const saveBtn = document.getElementById('botSaveSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const riskParams = {
        leverage: parseInt(document.getElementById('riskLeverage')?.value) || 10,
        max_position_pct: parseInt(document.getElementById('riskMaxPos')?.value) || 10,
        stop_loss_pct: parseFloat(document.getElementById('riskSL')?.value) || 2,
        take_profit_pct: parseFloat(document.getElementById('riskTP')?.value) || 4
      };
      
      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan...';
      
      try {
        const { error } = await updateBotSession(session.user.id, { risk_params: riskParams });
        if (error) throw error;
        
        session.botSession = { ...session.botSession, risk_params: riskParams };
        localStorage.setItem('auth_session', JSON.stringify(session));
        
        saveBtn.textContent = 'Tersimpan!';
        saveBtn.style.background = 'var(--accent-secondary)';
        saveBtn.style.borderColor = 'var(--accent-secondary)';
        setTimeout(() => {
          saveBtn.textContent = 'Simpan Pengaturan';
          saveBtn.style.background = '';
          saveBtn.style.borderColor = '';
        }, 2000);
      } catch (err) {
        console.error('Save risk params failed:', err);
        saveBtn.textContent = 'Gagal: ' + (err.message || err).substring(0, 40);
        saveBtn.style.background = 'var(--accent-danger)';
        saveBtn.style.borderColor = 'var(--accent-danger)';
        setTimeout(() => {
          saveBtn.textContent = 'Simpan Pengaturan';
          saveBtn.style.background = '';
          saveBtn.style.borderColor = '';
        }, 5000);
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  // Initial trades feed
  updateTradesFeed(session);
}

function updateTradesFeed(session) {
  const feed = document.getElementById('tradesFeed');
  if (!feed) return;
  
  const trades = session.recentTrades || [];
  if (trades.length === 0) {
    feed.innerHTML = '<div class="activity-item" style="justify-content:center;color:var(--text-muted);">Belum ada transaksi</div>';
    return;
  }
  
  feed.innerHTML = trades.map(trade => `
    <div class="activity-item">
      <div class="activity-icon ${trade.side === 'buy' || trade.side === 'long' ? 'buy' : 'sell'}">${trade.side === 'buy' || trade.side === 'long' ? '↑' : '↓'}</div>
      <div class="activity-text"><strong>${trade.side.toUpperCase()}</strong> ${trade.qty} ${trade.symbol} @ $${trade.price}</div>
      <span class="activity-time">${timeAgo(new Date(trade.timestamp))}</span>
    </div>
  `).join('');
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', async () => {
  let session = await requireAuthWrapper();
  if (!session) return;

  // Update topbar
  const avatar = document.getElementById('topbarAvatar');
  const name = document.getElementById('topbarName');
  if (avatar) avatar.src = session.user.avatar;
  if (name) name.textContent = session.user.name;

  // Mobile menu
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

  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const pageTitle = document.getElementById('pageTitle');
  const pageContent = document.getElementById('pageContent');

  // Realtime subscriptions
  let botStateSubscription = null;
  let tradeHistorySubscription = null;

  function cleanupSubscriptions() {
    if (botStateSubscription) {
      botStateSubscription.unsubscribe();
      botStateSubscription = null;
    }
    if (tradeHistorySubscription) {
      tradeHistorySubscription.unsubscribe();
      tradeHistorySubscription = null;
    }
  }

  async function loadBotData(session) {
    try {
      const [{ data: botSession }, { data: botState }, { data: trades }] = await Promise.all([
        getBotSession(session.user.id),
        session.botSession?.id ? getBotState(session.botSession.id) : { data: null, error: null },
        getTradeHistory(session.user.id, 20)
      ]);
      
      session.botSession = botSession || {};
      session.botState = botState || {};
      session.recentTrades = trades || [];
      return session;
    } catch (err) {
      console.error('Failed to load bot data:', err);
      session.botSession = {};
      session.botState = {};
      session.recentTrades = [];
      return session;
    }
  }

  function subscribeToBotUpdates(session) {
    if (!session.botSession?.id) return;
    
    cleanupSubscriptions();

    botStateSubscription = subscribeBotState(session.botSession.id, (payload) => {
      console.log('Bot state update:', payload);
      session.botState = payload.new || payload.old || {};
      if (document.querySelector('[data-page="botControl"]')?.classList.contains('active')) {
        const pg = pages.botControl;
        if (pg && pageContent) {
          pageContent.innerHTML = pg.render(session);
          attachBotControlHandlers(session);
        }
      }
    });

    tradeHistorySubscription = subscribeTradeHistory(session.user.id, (payload) => {
      console.log('New trade:', payload);
      if (payload.new) {
        session.recentTrades = [payload.new, ...(session.recentTrades || []).slice(0, 19)];
        updateTradesFeed(session);
      }
    });
  }

  function navigateTo(pageName) {
    if (pageName === 'logout') {
      cleanupSubscriptions();
      signOut().then(() => {
        localStorage.removeItem('auth_session');
        window.location.href = '/';
      });
      return;
    }

    navItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageName));
    const pg = pages[pageName];
    if (pg) {
      if (pageTitle) pageTitle.textContent = pg.title;

      if (pageName === 'settings') {
        getExchangeKey(session.user.id, 'binance').then(({ data }) => {
          session.exchangeKey = data || {};
          if (pageContent) pageContent.innerHTML = pg.render(session);
          attachSettingsSaveHandler(session);
          attachExchangeTabHandlers(session);
        }).catch(err => {
          console.error('Failed to fetch exchange key:', err);
          session.exchangeKey = {};
          if (pageContent) pageContent.innerHTML = pg.render(session);
          attachSettingsSaveHandler(session);
          attachExchangeTabHandlers(session);
        });
      } else if (pageName === 'botControl') {
        loadBotData(session).then(updatedSession => {
          session = updatedSession;
          if (pageContent) pageContent.innerHTML = pg.render(session);
          attachBotControlHandlers(session);
          subscribeToBotUpdates(session);
        });
      } else {
        cleanupSubscriptions();
        if (pageContent) pageContent.innerHTML = pg.render(session);
      }
    }
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  navigateTo('overview');
});