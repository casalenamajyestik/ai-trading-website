/* ===== i18n Translations ===== */

export const translations = {
  id: {
    nav: {
      features: 'Fitur',
      about: 'Tentang',
      contact: 'Kontak',
      login: 'Masuk',
      dashboard: 'Dashboard',
      settings: 'Pengaturan',
      logout: 'Keluar'
    },
    hero: {
      badge: 'Gratis Selamanya · No Credit Card · Setup 5 Menit',
      title: 'Trading Cerdas, <span class="highlight">Tanpa Batas</span>',
      subtitle: 'Platform trading AI pertama di Indonesia yang benar-benar gratis selamanya. Algoritma canggih, data real-time global, dan otomatisasi penuh — tanpa biaya tersembunyi.',
      stats: {
        traders: 'Trader Aktif',
        uptime: 'Uptime %',
        exchanges: 'Exchange',
        fees: 'Biaya Bulanan'
      },
      cta: {
        primary: 'Mulai Gratis',
        secondary: ''
      },
      regions: {
        asia: 'Asia Pasifik',
        americas: 'Amerika',
        emea: 'EMEA'
      }
    },
    features: {
      title: 'Kenapa Memilih Kami?',
      subtitle: 'Dibangun untuk trader modern yang menuntut kecepatan, keakuratan, dan kebebasan',
      ai: { title: 'AI & Machine Learning', desc: 'Model prediktif canggih yang belajar dari data pasar global 24/7, menyesuaikan strategi secara real-time.' },
      speed: { title: 'Eksekusi Sub-Milidetik', desc: 'Infrastruktur edge computing di 12 wilayah global memastikan order terisi sebelum pasar bergerak.' },
      security: { title: 'Keamanan Bank-Grade', desc: 'Enkripsi AES-256, 2FA wajib, API key read-only, dan audit keamanan berkala oleh tim keamanan terkemuka.' },
      analytics: { title: 'Analitik Mendalam', desc: 'Dashboard real-time dengan 50+ indikator, backtesting historis, dan laporan performa otomatis.' },
      community: { title: 'Komunitas Trader', desc: 'Akses ke komunitas 15.000+ trader Indonesia, sharing strategi, dan mentor dari trader profesional.' },
      global: { title: 'Data Global Real-Time', desc: 'Menghisap data dari 50+ exchange, berita finansial, on-chain metrics, dan sentimen media sosial simultan.' }
    },
    how: {
      title: 'Cara Kerja 3 Langkah',
      subtitle: 'Mulai trading otomatis dalam hitungan menit, bukan hari',
      step1: { title: 'Daftar', desc: 'Isi formulir pendaftaran singkat. Tidak perlu kartu kredit, gratis selamanya.' },
      step2: { title: 'Pilih Exchange', desc: 'Hubungkan exchange favorit Anda. Dana Anda tetap aman di exchange.' },
      step3: { title: 'Jalankan & Pantau', desc: 'Klik start. AI mengelola posisi 24/7. Pantau performa real-time di dashboard atau dapatkan notifikasi via Telegram/Email.' }
    },
    cta: {
      title: 'Siap Mulai Trading Gratis?',
      subtitle: 'Gabung 15.000+ trader Indonesia yang sudah merasakan keuntungan AI trading. Tanpa risiko, tanpa biaya, kapan saja bisa berhenti.'
    },
    faq: {
      title: 'Pertanyaan Sering Diajukan',
      items: [
        {
          q: 'Apakah dana saya aman?',
          a: 'Ya. Kami menggunakan API key read-only — dana Anda tetap 100% di exchange (Binance/Bybit). Kami tidak bisa menarik dana, hanya membaca data dan mengirim order beli/jual.'
        },
        {
          q: 'Berapa biaya bulanan?',
          a: 'Rp 0. Gratis selamanya. Tidak ada fee tersembunyi, tidak ada komisi dari profit, tidak ada upsell.'
        },
        {
          q: 'Apakah butuh coding / programming?',
          a: 'Tidak. Setup 5 menit via UI drag-drop. Pilih strategi, set risk management, klik Start. Selesai.'
        },
        {
          q: 'Bisa dihentikan kapan saja?',
          a: 'Ya. 1 klik "Stop" di dashboard — bot berhenti instan. Posisi terbuka bisa di-close manual atau biarkan terselesaikan.'
        },
        {
          q: 'Exchange apa yang didukung?',
          a: 'Saat ini: Binance Spot & Futures, Bybit Spot & Futures. Exchange lain coming soon.'
        },
        {
          q: 'Bagaimana performa AI?',
          a: 'Model dilatih data 50+ exchange, 24/7. Backtest 3 tahun: win rate 68-72%, max drawdown <15%. Performa masa lalu ≠ jaminan masa depan.'
        },
        {
          q: 'Ada support bahasa Indonesia?',
          a: 'Ya. Tim support Indonesia response <2 jam jam kerja. Komunitas Telegram 15.000+ trader aktif sharing strategi.'
        }
      ]
    },
    testimonials: {
      title: 'Kata Trader Indonesia',
      items: [
        { name: 'Budi S.', location: 'Jakarta', text: 'Profit konsisten 8 bulan. Setup sekali, cek mingguan. Gratis tapi kualitas premium.', avatar: 'BS', pnl: '+24.5%' },
        { name: 'Sari D.', location: 'Bandung', text: 'Pemula banget tapi UI-nya mudeng. Support Telegram responsif. Dana aman di Binance.', avatar: 'SD', pnl: '+18.2%' },
        { name: 'Ahmad R.', location: 'Surabaya', text: 'Sudah bayar bot lain $99/bln, ini gratis performa lebih baik. No brainer.', avatar: 'AR', pnl: '+31.7%' },
        { name: 'Maya K.', location: 'Medan', text: 'Favorit: auto-compound & trailing stop. Tidur nyenyak, bot jaga posisi 24/7.', avatar: 'MK', pnl: '+15.8%' },
        { name: 'Doni W.', location: 'Bali', text: 'Join komunitas Telegram, belajar dari senior. Sekarang bikin strategi sendiri.', avatar: 'DW', pnl: '+42.1%' },
        { name: 'Rina L.', location: 'Yogyakarta', text: 'Withdraw profit tiap minggu lancar. Transparan, no hidden fee. Recommended.', avatar: 'RL', pnl: '+27.3%' },
        { name: 'Agus P.', location: 'Makassar', text: 'Dulu manual trading loss terus. Pakai AI 6 bulan, account grow steady. Terima kasih tim!', avatar: 'AP', pnl: '+19.6%' }
      ]
    },
    form: {
      name: 'Nama Lengkap',
      email: 'Email',
      phone: 'WhatsApp (Opsional)',
      name_placeholder: 'Nama Anda',
      email_placeholder: 'email@anda.com',
      phone_placeholder: '8xx xxx xxxx',
      experience: 'Pengalaman Trading',
      experience_placeholder: 'Pilih pengalaman',
      experience_options: {
        beginner: 'Pemula (0-6 bulan)',
        intermediate: 'Menengah (6-24 bulan)',
        advanced: 'Mahir (2+ tahun)',
        pro: 'Profesional'
      },
      terms: 'Saya setuju dengan <a href="#tos">Syarat & Ketentuan</a> dan <a href="#privacy">Kebijakan Privasi</a>',
      submit: 'Daftar Gratis Sekarang',
      note: '✓ Gratis selamanya · ✓ Tidak perlu kartu kredit · ✓ Bisa batal kapan saja'
    },
    login: {
      title: 'Masuk ke Akun Anda',
      subtitle: 'Atau lanjutkan dengan',
      google: 'Google',
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      or: 'atau',
      password: 'Kata Sandi',
      submit: 'Masuk',
      noaccount: 'Belum punya akun? <a href="#" id="openRegisterLink">Daftar gratis</a>'
    },
    register: {
      title: 'Buat Akun Gratis',
      subtitle: 'Atau lanjutkan dengan',
      google: 'Google',
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      or: 'atau',
      password: 'Kata Sandi',
      submit: 'Daftar Gratis Sekarang',
      hasaccount: 'Sudah punya akun? <a href="#" id="openLoginLink">Masuk di sini</a>'
    },
    verification: {
      title: 'Verifikasi Email',
      subtitle: 'Kami telah mengirimkan kode verifikasi ke',
      code_label: 'Masukkan Kode 6 Digit',
      code_placeholder: '000000',
      resend: 'Kirim ulang kode',
      resend_timer: 'Kirim ulang dalam {seconds} detik',
      verify: 'Verifikasi & Masuk',
      success: 'Email berhasil diverifikasi! Mengarahkan ke dashboard...',
      error: 'Kode tidak valid atau sudah kadaluarsa',
      no_email: 'Tidak menerima email? Periksa folder spam atau'
    },
    dash: {
      nav: {
        overview: 'Overview',
        bots: 'Bots',
        trades: 'Trades',
        performance: 'Performance',
        portfolio: 'Portfolio',
        settings: 'Pengaturan',
        logout: 'Keluar'
      }
    },
    footer: {
      tagline: 'Platform trading AI pertama Indonesia yang benar-benar gratis selamanya.',
      product: 'Produk',
      features: 'Fitur',
      how: 'Cara Kerja',
      demo: 'Demo Live',
      api: 'API Docs',
      integrations: 'Integrasi',
      company: 'Perusahaan',
      about: 'Tentang Kami',
      careers: 'Karir',
      blog: 'Blog',
      press: 'Pers',
      contact: 'Kontak',
      resources: 'Sumber Daya',
      docs: 'Dokumentasi',
      academy: 'Trading Academy',
      community: 'Komunitas',
      support: 'Bantuan',
      status: 'Status Sistem',
      legal: 'Legal',
      privacy: 'Kebijakan Privasi',
      tos: 'Syarat & Ketentuan',
      cookies: 'Kebijakan Cookie',
      disclaimer: 'Disclaimer',
      compliance: 'Kepatuhan',
      copyright: '© 2025 AI Trading Platform. Gratis selamanya. Dibangun dengan ❤️ untuk trader Indonesia.',
      badge: { free: '100% Gratis', open: 'Open Source', indonesia: 'Made in Indonesia' }
    }
  },
  en: {
    nav: {
      features: 'Features',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
      dashboard: 'Dashboard',
      settings: 'Settings',
      logout: 'Logout'
    },
    hero: {
      badge: 'Free Forever · No Credit Card · 5-Min Setup',
      title: 'Smart Trading, <span class="highlight">Unlimited</span>',
      subtitle: 'The first AI trading platform in Indonesia that is truly free forever. Advanced algorithms, global real-time data, and full automation — no hidden fees.',
      stats: {
        traders: 'Active Traders',
        uptime: 'Uptime %',
        exchanges: 'Exchanges',
        fees: 'Monthly Fee'
      },
      cta: {
        primary: 'Start Free',
        secondary: ''
      },
      regions: {
        asia: 'Asia Pacific',
        americas: 'Americas',
        emea: 'EMEA'
      }
    },
    features: {
      title: 'Why Choose Us?',
      subtitle: 'Built for modern traders who demand speed, accuracy, and freedom',
      ai: { title: 'AI & Machine Learning', desc: 'Advanced predictive models that learn from global market data 24/7, adapting strategies in real-time.' },
      speed: { title: 'Sub-Millisecond Execution', desc: 'Edge computing infrastructure across 12 global regions ensures orders fill before the market moves.' },
      security: { title: 'Bank-Grade Security', desc: 'AES-256 encryption, mandatory 2FA, read-only API keys, and regular security audits by top security teams.' },
      analytics: { title: 'Deep Analytics', desc: 'Real-time dashboard with 50+ indicators, historical backtesting, and automated performance reports.' },
      community: { title: 'Trader Community', desc: 'Access to 15,000+ Indonesian traders, strategy sharing, and mentorship from professional traders.' },
      global: { title: 'Global Real-Time Data', desc: 'Feeds from 50+ exchanges, financial news, on-chain metrics, and social sentiment simultaneously.' }
    },
    how: {
      title: 'How It Works in 3 Steps',
      subtitle: 'Start automated trading in minutes, not days',
      step1: { title: 'Sign Up', desc: 'Fill in a short registration form. No credit card needed, free forever.' },
      step2: { title: 'Choose Exchange', desc: 'Connect your favorite exchange. Your funds stay safe on the exchange.' },
      step3: { title: 'Run & Monitor', desc: 'Click start. AI manages positions 24/7. Track real-time performance on the dashboard or get notifications via Telegram/Email.' }
    },
    cta: {
      title: 'Ready to Trade for Free?',
      subtitle: 'Join 15,000+ Indonesian traders who have already experienced AI trading. No risk, no cost, cancel anytime.'
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          q: 'Is my money safe?',
          a: 'Yes. We use read-only API keys — your funds stay 100% on the exchange (Binance/Bybit). We cannot withdraw funds, only read data and send buy/sell orders.'
        },
        {
          q: 'What is the monthly fee?',
          a: 'Rp 0. Free forever. No hidden fees, no profit commissions, no upsells.'
        },
        {
          q: 'Do I need coding skills?',
          a: 'No. 5-minute setup via drag-drop UI. Pick a strategy, set risk management, click Start. Done.'
        },
        {
          q: 'Can I stop anytime?',
          a: 'Yes. One click "Stop" on dashboard — bot halts instantly. Open positions can be closed manually or left to complete.'
        },
        {
          q: 'Which exchanges are supported?',
          a: 'Currently: Binance Spot & Futures, Bybit Spot & Futures. More exchanges coming soon.'
        },
        {
          q: 'How does the AI perform?',
          a: 'Model trained on 50+ exchanges, 24/7. 3-year backtest: 68-72% win rate, max drawdown <15%. Past performance ≠ future guarantee.'
        },
        {
          q: 'Is Indonesian support available?',
          a: 'Yes. Indonesian support team responds <2hrs business hours. Telegram community 15,000+ active traders sharing strategies.'
        }
      ]
    },
    testimonials: {
      title: 'What Indonesian Traders Say',
      items: [
        { name: 'Budi S.', location: 'Jakarta', text: 'Consistent profit for 8 months. Set once, check weekly. Free but premium quality.', avatar: 'BS', pnl: '+24.5%' },
        { name: 'Sari D.', location: 'Bandung', text: 'Total beginner but UI is intuitive. Telegram support responsive. Funds safe on Binance.', avatar: 'SD', pnl: '+18.2%' },
        { name: 'Ahmad R.', location: 'Surabaya', text: 'Used to pay $99/mo for other bots, this free one performs better. No brainer.', avatar: 'AR', pnl: '+31.7%' },
        { name: 'Maya K.', location: 'Medan', text: 'Favorite: auto-compound & trailing stop. Sleep peacefully, bot watches 24/7.', avatar: 'MK', pnl: '+15.8%' },
        { name: 'Doni W.', location: 'Bali', text: 'Joined Telegram community, learned from seniors. Now building my own strategies.', avatar: 'DW', pnl: '+42.1%' },
        { name: 'Rina L.', location: 'Yogyakarta', text: 'Weekly profit withdrawal smooth. Transparent, no hidden fees. Highly recommended.', avatar: 'RL', pnl: '+27.3%' },
        { name: 'Agus P.', location: 'Makassar', text: 'Used to lose with manual trading. AI for 6 months, account growing steady. Thanks team!', avatar: 'AP', pnl: '+19.6%' }
      ]
    },
    form: {
      name: 'Full Name',
      email: 'Email',
      phone: 'WhatsApp (Optional)',
      name_placeholder: 'Your Name',
      email_placeholder: 'email@you.com',
      phone_placeholder: 'xxx xxx xxxx',
      experience: 'Trading Experience',
      experience_placeholder: 'Select experience',
      experience_options: {
        beginner: 'Beginner (0-6 months)',
        intermediate: 'Intermediate (6-24 months)',
        advanced: 'Advanced (2+ years)',
        pro: 'Professional'
      },
      terms: 'I agree to the <a href="#tos">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>',
      submit: 'Sign Up Free Now',
      note: '✓ Free forever · ✓ No credit card needed · ✓ Cancel anytime'
    },
    login: {
      title: 'Sign in to Your Account',
      subtitle: 'Or continue with',
      google: 'Google',
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      or: 'or',
      password: 'Password',
      submit: 'Sign In',
      noaccount: 'No account? <a href="#" id="openRegisterLink">Sign up free</a>'
    },
    register: {
      title: 'Create Free Account',
      subtitle: 'Or continue with',
      google: 'Google',
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      or: 'or',
      password: 'Password',
      submit: 'Sign Up Free Now',
      hasaccount: 'Already have an account? <a href="#" id="openLoginLink">Sign in here</a>'
    },
    verification: {
      title: 'Verify Email',
      subtitle: 'We\'ve sent a verification code to',
      code_label: 'Enter 6-Digit Code',
      code_placeholder: '000000',
      resend: 'Resend code',
      resend_timer: 'Resend in {seconds} seconds',
      verify: 'Verify & Sign In',
      success: 'Email verified! Redirecting to dashboard...',
      error: 'Invalid or expired code',
      no_email: 'Didn\'t receive email? Check spam folder or'
    },
    dash: {
      nav: {
        overview: 'Overview',
        bots: 'Bots',
        trades: 'Trades',
        performance: 'Performance',
        portfolio: 'Portfolio',
        settings: 'Settings',
        logout: 'Logout'
      }
    },
    footer: {
      tagline: 'The first AI trading platform in Indonesia that is truly free forever.',
      product: 'Product',
      features: 'Features',
      how: 'How It Works',
      demo: 'Live Demo',
      api: 'API Docs',
      integrations: 'Integrations',
      company: 'Company',
      about: 'About Us',
      careers: 'Careers',
      blog: 'Blog',
      press: 'Press',
      contact: 'Contact',
      resources: 'Resources',
      docs: 'Documentation',
      academy: 'Trading Academy',
      community: 'Community',
      support: 'Support',
      status: 'System Status',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      tos: 'Terms of Service',
      cookies: 'Cookie Policy',
      disclaimer: 'Disclaimer',
      compliance: 'Compliance',
      copyright: '© 2025 AI Trading Platform. Free forever. Built with ❤️ for Indonesian traders.',
      badge: { free: '100% Free', open: 'Open Source', indonesia: 'Made in Indonesia' }
    }
  }
};