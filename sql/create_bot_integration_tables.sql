-- ============================================
-- TABEL BOT INTEGRATION (Bot Sessions, State, Trade History)
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- ============================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- untuk encrypt/decrypt

-- 2. Tabel bot_sessions (1 per user untuk MVP)
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL DEFAULT 'binance',
    api_key_encrypted TEXT NOT NULL,           -- Encrypted by bot (Fernet/AES)
    api_secret_encrypted TEXT NOT NULL,        -- Encrypted by bot
    passphrase_encrypted TEXT,                 -- For OKX, KuCoin
    is_active BOOLEAN DEFAULT FALSE,           -- TOGGLE ON/OFF dari website
    mode TEXT DEFAULT 'paper' CHECK (mode IN ('paper', 'live')),
    risk_params JSONB DEFAULT '{}',            -- leverage, max_pos, stop_loss, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique: 1 bot session per user (MVP)
    UNIQUE(user_id)
);

-- 3. Tabel bot_state (heartbeat & status real-time)
CREATE TABLE IF NOT EXISTS public.bot_state (
    session_id UUID PRIMARY KEY REFERENCES public.bot_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error', 'starting')),
    last_heartbeat TIMESTAMPTZ,
    current_positions JSONB DEFAULT '[]',      -- Array posisi terbuka
    daily_pnl NUMERIC DEFAULT 0,
    total_pnl NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,               -- Total account balance from exchange
    error_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel trade_history (semua transaksi bot)
CREATE TABLE IF NOT EXISTS public.trade_history (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES public.bot_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell', 'long', 'short')),
    qty NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    pnl NUMERIC DEFAULT 0,
    fee NUMERIC DEFAULT 0,
    order_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes untuk query cepat
CREATE INDEX IF NOT EXISTS idx_trade_history_session_time ON public.trade_history(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_time ON public.trade_history(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bot_state_heartbeat ON public.bot_state(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user ON public.bot_sessions(user_id);

-- 6. Enable RLS
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

-- 7. Policies: User hanya akses data MILIKNYA
-- bot_sessions
CREATE POLICY "Users can view own bot sessions"
    ON public.bot_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bot sessions"
    ON public.bot_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot sessions"
    ON public.bot_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- bot_state (via session ownership)
CREATE POLICY "Users can view own bot state"
    ON public.bot_state FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bot_sessions 
            WHERE id = bot_state.session_id AND user_id = auth.uid()
        )
    );

-- trade_history
CREATE POLICY "Users can view own trade history"
    ON public.trade_history FOR SELECT
    USING (auth.uid() = user_id);

-- 8. Triggers: Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.bot_sessions;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.bot_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.bot_state;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.bot_state
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Realtime: Enable untuk bot_state & trade_history (dashboard live)
-- Jalankan di Supabase Dashboard → Replication → Enable untuk tabel ini
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_history;

-- ============================================
-- VERIFIKASI
-- ============================================
-- SELECT * FROM public.bot_sessions LIMIT 5;
-- SELECT * FROM public.bot_state LIMIT 5;
-- SELECT * FROM public.trade_history LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename IN ('bot_sessions', 'bot_state', 'trade_history');