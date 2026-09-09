-- ============================================
-- TABEL BOT INTEGRATION (Bot Sessions, State, Trade History)
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- ============================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- untuk encrypt/decrypt

-- 2. Create encryption key (run once, store securely!)
-- ALTER DATABASE postgres SET app.encryption_key = 'your-32-char-secret-key-here';

-- 3. Helper functions for encryption/decryption (using app.encryption_key setting)
CREATE OR REPLACE FUNCTION public.encrypt_key(plaintext TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    enc_key TEXT := current_setting('app.encryption_key', true);
BEGIN
    IF enc_key IS NULL OR enc_key = '' THEN
        RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key in database.';
    END IF;
    RETURN pgp_sym_encrypt(plaintext, enc_key, 'compress-algo=1, cipher-algo=aes256');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_key(ciphertext TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    enc_key TEXT := current_setting('app.encryption_key', true);
BEGIN
    IF enc_key IS NULL OR enc_key = '' THEN
        RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key in database.';
    END IF
    RETURN pgp_sym_decrypt(ciphertext, enc_key);
END;
$$;

-- 4. Tabel bot_sessions (1 per user untuk MVP) - ENCRYPTED
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL DEFAULT 'binance',
    api_key_encrypted TEXT NOT NULL,           -- AES-256 encrypted
    api_secret_encrypted TEXT NOT NULL,        -- AES-256 encrypted
    passphrase_encrypted TEXT,                 -- AES-256 encrypted (For OKX, KuCoin)
    is_active BOOLEAN DEFAULT FALSE,           -- TOGGLE ON/OFF dari website
    mode TEXT DEFAULT 'paper' CHECK (mode IN ('paper', 'live')),
    risk_params JSONB DEFAULT '{}',            -- leverage, max_pos, stop_loss, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique: 1 bot session per user (MVP)
    UNIQUE(user_id)
);

-- 5. Tabel bot_state (heartbeat & status real-time)
CREATE TABLE IF NOT EXISTS public.bot_state (
    session_id UUID PRIMARY KEY REFERENCES public.bot_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error', 'starting')),
    last_heartbeat TIMESTAMPTZ,
    current_positions JSONB DEFAULT '[]',      -- Array posisi terbuka
    daily_pnl NUMERIC DEFAULT 0,
    total_pnl NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,               -- Total account balance from exchange
    yesterday_pnl NUMERIC DEFAULT 0,         -- PnL harian sebelumnya
    biggest_win NUMERIC DEFAULT 0,           -- Biggest win ever (absolute PnL)
    total_positions INTEGER DEFAULT 0,       -- Total positions ever opened
    error_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel trade_history (semua transaksi bot)
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

-- 7. View for secure access to bot_sessions (decrypts only for authorized user)
CREATE OR REPLACE VIEW public.bot_sessions_decrypted AS
SELECT
    id,
    user_id,
    exchange,
    public.decrypt_key(api_key_encrypted) AS api_key,
    public.decrypt_key(api_secret_encrypted) AS api_secret,
    public.decrypt_key(passphrase_encrypted) AS passphrase,
    is_active,
    mode,
    risk_params,
    created_at,
    updated_at
FROM public.bot_sessions
WHERE auth.uid() = user_id;

-- 8. Indexes untuk query cepat
CREATE INDEX IF NOT EXISTS idx_trade_history_session_time ON public.trade_history(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_time ON public.trade_history(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bot_state_heartbeat ON public.bot_state(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user ON public.bot_sessions(user_id);

-- 9. Enable RLS
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

-- 10. Policies: User hanya akses data MILIKNYA
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

-- Decrypted views policies
CREATE POLICY "Users can view own decrypted bot sessions"
    ON public.bot_sessions_decrypted FOR SELECT
    USING (auth.uid() = user_id);

-- 11. Triggers: Auto-update updated_at
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

-- 12. Realtime: Enable untuk bot_state & trade_history (dashboard live)
-- Jalankan di Supabase Dashboard → Replication → Enable untuk tabel ini
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_history;

-- ============================================
-- VERIFIKASI
-- ============================================
-- SELECT * FROM public.bot_sessions LIMIT 5;
-- SELECT * FROM public.bot_sessions_decrypted LIMIT 5;
-- SELECT * FROM public.bot_state LIMIT 5;
-- SELECT * FROM public.trade_history LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename IN ('bot_sessions', 'bot_state', 'trade_history');

-- ============================================
-- SETUP ENCRYPTION KEY (RUN ONCE IN SUPABASE SQL EDITOR)
-- ============================================
-- ALTER DATABASE postgres SET app.encryption_key = 'your-32-character-secret-key-here-1234';
-- Verify: SHOW app.encryption_key;
-- 
-- IMPORTANT: 
-- 1. Generate a strong 32+ character key: openssl rand -base64 32
-- 2. Store it securely (password manager, not in code!)
-- 3. Set it in Supabase: Project Settings → Database → Postgres extensions → Custom config
-- 4. Or run: ALTER DATABASE postgres SET app.encryption_key = 'your-key';