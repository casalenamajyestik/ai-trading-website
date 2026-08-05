import i18next from './i18n.js';
import { signOut } from './supabase.js';
import { initAuth, getLocalSession, requireAuth } from './auth-listener.js';

// ============ Auth Guard ============
async function requireAuthWrapper() {
  // Wait for auth init to complete (sets localStorage from Supabase session)
  await initAuth();
  
  return requireAuth();
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
    render: (session) => `
      <div class="card">
        <div class="card-header"><span class="card-title">Account Settings</span></div>
        <div style="display:flex;flex-direction:column;gap:1rem;">
          <div><label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Nama</label><input type="text" id="settingsName" value="${session.user?.name || ''}" style="width:100%;padding:0.625rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"></div>
          <div><label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Email</label><input type="email" id="settingsEmail" value="${session.user?.email || ''}" ${session.user?.email ? 'readonly' : ''} style="width:100%;padding:0.625rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;${session.user?.email ? 'opacity:0.6;cursor:not-allowed;' : ''}"></div>
          <div><label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">WhatsApp</label><input type="tel" id="settingsWhatsApp" value="${session.user?.whatsapp || ''}" placeholder="+62 8xx xxxx xxxx" style="width:100%;padding:0.625rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"></div>
          <div><label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Username Telegram</label><input type="text" id="settingsTelegram" value="${session.user?.telegram || ''}" placeholder="@username (tanpa @)" style="width:100%;padding:0.625rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"></div>
          <div><label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Notification</label><select id="settingsNotification" style="width:100%;padding:0.625rem;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;"><option>Telegram</option><option>Email</option><option>Both</option></select></div>
          <button class="btn btn-primary" id="settingsSaveBtn" style="margin-top:0.5rem;">Simpan Perubahan</button>
        </div>
      </div>`
  }
};

function attachSettingsSaveHandler(session) {
  const saveBtn = document.getElementById('settingsSaveBtn');
  const nameInput = document.getElementById('settingsName');
  const emailInput = document.getElementById('settingsEmail');
  const whatsappInput = document.getElementById('settingsWhatsApp');
  const telegramInput = document.getElementById('settingsTelegram');
  const notificationSelect = document.getElementById('settingsNotification');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const newName = nameInput?.value?.trim();
      const newWhatsApp = whatsappInput?.value?.trim();
      const newTelegram = telegramInput?.value?.trim();
      const newNotification = notificationSelect?.value;
      
      if (!newName) {
        alert('Nama tidak boleh kosong');
        return;
      }
      
      // Show loading state
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Menyimpan...';
      saveBtn.disabled = true;
      
      try {
        // Update session locally
        session.user.name = newName;
        session.user.whatsapp = newWhatsApp;
        session.user.telegram = newTelegram;
        // Note: Email is not updated if it already exists (locked)
        localStorage.setItem('auth_session', JSON.stringify(session));
        
        // Update topbar name
        const topbarName = document.getElementById('topbarName');
        if (topbarName) topbarName.textContent = newName;
        
        // Update dropdown name if exists
        const dropdownName = document.querySelector('.user-dropdown .user-name');
        if (dropdownName) dropdownName.textContent = newName;
        
        // Show success
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

function formatIDR(num) {
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID');
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', async () => {
  const session = await requireAuthWrapper();
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

  function navigateTo(pageName) {
    if (pageName === 'logout') {
      // Handle logout
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
      if (pageContent) pageContent.innerHTML = pg.render(session);
      
      // Attach settings save handler if on settings page
      if (pageName === 'settings') {
        attachSettingsSaveHandler(session);
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