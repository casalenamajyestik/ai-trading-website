-- ============================================
-- TABEL EXCHANGE KEYS + RLS (VERSI SECURE)
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- ============================================

-- 1. Enable required extensions for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create encryption key (run once, store securely!)
-- SELECT pgp_sym_encrypt('test', current_setting('app.encryption_key'));
-- Set encryption key via: ALTER DATABASE postgres SET app.encryption_key = 'your-32-char-secret-key-here';

-- 3. Buat tabel exchange_keys dengan enkripsi AES-256
CREATE TABLE IF NOT EXISTS public.exchange_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL DEFAULT 'binance',  -- 'binance', 'bybit', 'okx', 'kucoin'
    api_key_encrypted TEXT NOT NULL,           -- AES-256 encrypted
    secret_key_encrypted TEXT NOT NULL,        -- AES-256 encrypted
    passphrase_encrypted TEXT,                 -- AES-256 encrypted (untuk OKX, KuCoin)
    trading_type TEXT DEFAULT 'spot',          -- 'spot', 'futures', 'both'
    ip_whitelist TEXT,                         -- Comma-separated IPs
    is_active BOOLEAN DEFAULT true,
    label TEXT,                                -- Label user: "Main Account", "Sub Bot 1"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique: 1 exchange per user (untuk MVP, bisa dihapus nanti untuk multi-account)
    UNIQUE(user_id, exchange)
);

-- 4. Helper functions for encryption/decryption (using app.encryption_key setting)
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
    END IF;
    RETURN pgp_sym_decrypt(ciphertext, enc_key);
END;
$$;

-- 5. View for secure access (decrypts only for authorized user)
CREATE OR REPLACE VIEW public.exchange_keys_decrypted AS
SELECT
    id,
    user_id,
    exchange,
    public.decrypt_key(api_key_encrypted) AS api_key,
    public.decrypt_key(secret_key_encrypted) AS secret_key,
    public.decrypt_key(passphrase_encrypted) AS passphrase,
    trading_type,
    ip_whitelist,
    is_active,
    label,
    created_at,
    updated_at
FROM public.exchange_keys
WHERE auth.uid() = user_id;

-- 5. Enable RLS
ALTER TABLE public.exchange_keys ENABLE ROW LEVEL SECURITY;

-- 6. Policy: User hanya bisa LIHAT exchange key sendiri (encrypted)
CREATE POLICY "Users can view own exchange keys"
    ON public.exchange_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- 7. Policy: User hanya bisa INSERT exchange key sendiri
CREATE POLICY "Users can insert own exchange keys"
    ON public.exchange_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 8. Policy: User hanya bisa UPDATE exchange key sendiri
CREATE POLICY "Users can update own exchange keys"
    ON public.exchange_keys
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. Policy: User hanya bisa DELETE exchange key sendiri
CREATE POLICY "Users can delete own exchange keys"
    ON public.exchange_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- 10. Policy for decrypted view (only owner can see decrypted)
CREATE POLICY "Users can view own decrypted keys"
    ON public.exchange_keys_decrypted
    FOR SELECT
    USING (auth.uid() = user_id);

-- 11. Trigger: Auto-update updated_at
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

-- 12. Index
CREATE INDEX IF NOT EXISTS idx_exchange_keys_user_id ON public.exchange_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_keys_exchange ON public.exchange_keys(exchange);

-- ============================================
-- VERIFIKASI
-- ============================================
-- SELECT * FROM public.exchange_keys LIMIT 5;
-- SELECT * FROM public.exchange_keys_decrypted LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename = 'exchange_keys';

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