-- ============================================
-- TABEL EXCHANGE KEYS + RLS (VERSI BERSIH)
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- ============================================

-- 1. Buat tabel exchange_keys
CREATE TABLE IF NOT EXISTS public.exchange_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL DEFAULT 'binance',  -- 'binance', 'bybit', 'okx', 'kucoin'
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,  -- Pertimbangkan enkripsi di aplikasi
    passphrase TEXT,           -- Untuk OKX, KuCoin
    trading_type TEXT DEFAULT 'spot',  -- 'spot', 'futures', 'both'
    ip_whitelist TEXT,         -- Comma-separated IPs
    is_active BOOLEAN DEFAULT true,
    label TEXT,                -- Label user: "Main Account", "Sub Bot 1"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique: 1 exchange per user (untuk MVP, bisa dihapus nanti untuk multi-account)
    UNIQUE(user_id, exchange)
);

-- 2. Enable RLS
ALTER TABLE public.exchange_keys ENABLE ROW LEVEL SECURITY;

-- 3. Policy: User hanya bisa LIHAT exchange key sendiri
CREATE POLICY "Users can view own exchange keys"
    ON public.exchange_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Policy: User hanya bisa INSERT exchange key sendiri
CREATE POLICY "Users can insert own exchange keys"
    ON public.exchange_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Policy: User hanya bisa UPDATE exchange key sendiri
CREATE POLICY "Users can update own exchange keys"
    ON public.exchange_keys
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Policy: User hanya bisa DELETE exchange key sendiri
CREATE POLICY "Users can delete own exchange keys"
    ON public.exchange_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.exchange_keys;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.exchange_keys
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Index
CREATE INDEX IF NOT EXISTS idx_exchange_keys_user_id ON public.exchange_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_keys_exchange ON public.exchange_keys(exchange);

-- ============================================
-- VERIFIKASI
-- ============================================
-- SELECT * FROM public.exchange_keys LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename = 'exchange_keys';