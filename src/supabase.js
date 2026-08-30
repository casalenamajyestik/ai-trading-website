// Supabase Client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpwpqkkgdaixukishihv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...m8v0';

// Disable detectSessionInUrl to prevent auto-redirect on reset-password page
// We handle the hash manually in reset-password.js
const IS_RESET_PASSWORD_PAGE = window.location.pathname === '/reset-password.html';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !IS_RESET_PASSWORD_PAGE
  }
});

// Auth helpers
export async function signUp(email, password, metadata = {}) {
  const redirectUrl = `${window.location.origin}/dashboard.html`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: redirectUrl
    }
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signInWithOAuth(provider) {
  const redirectUrl = `${window.location.origin}/dashboard.html`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl
    }
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// Verify email (resend)
export async function resendVerification(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email
  });
  return { data, error };
}

// Reset password
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });
  return { data, error };
}

// ============ Profile Helpers ============
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  return { data, error };
}

// ============ Exchange Keys Helpers ============
export async function getExchangeKeys(userId) {
  const { data, error } = await supabase
    .from('exchange_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getExchangeKey(userId, exchange) {
  const { data, error } = await supabase
    .from('exchange_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('exchange', exchange)
    .single();
  return { data, error };
}

export async function upsertExchangeKey(keyData) {
  const { data, error } = await supabase
    .from('exchange_keys')
    .upsert(keyData, { onConflict: 'user_id,exchange' })
    .select()
    .single();
  return { data, error };
}

export async function deleteExchangeKey(userId, exchange) {
  const { error } = await supabase
    .from('exchange_keys')
    .delete()
    .eq('user_id', userId)
    .eq('exchange', exchange);
  return { error };
}

export async function updateExchangeKeyTestResult(userId, exchange, result) {
  const { data, error } = await supabase
    .from('exchange_keys')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: result.status,
      last_test_message: result.message
    })
    .eq('user_id', userId)
    .eq('exchange', exchange)
    .select()
    .single();
  return { data, error };
}

// ============ Bot Integration Helpers ============

// Bot Sessions
export async function getBotSession(userId) {
  const { data, error } = await supabase
    .from('bot_sessions')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function createBotSession(sessionData) {
  const { data, error } = await supabase
    .from('bot_sessions')
    .insert(sessionData)
    .select()
    .single();
  return { data, error };
}

export async function updateBotSession(userId, updates) {
  const { data, error } = await supabase
    .from('bot_sessions')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}

export async function toggleBotSession(userId, isActive) {
  const { data, error } = await supabase
    .from('bot_sessions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}

// Bot State (real-time)
export async function getBotState(sessionId) {
  const { data, error } = await supabase
    .from('bot_state')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  return { data, error };
}

export async function subscribeBotState(sessionId, callback) {
  return supabase
    .channel(`bot_state:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bot_state',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe();
}

export async function subscribeTradeHistory(userId, callback) {
  return supabase
    .channel(`trade_history:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trade_history',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

// Trade History
export async function getTradeHistory(userId, limit = 50) {
  const { data, error } = await supabase
    .from('trade_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function getTradeHistoryBySession(sessionId, limit = 50) {
  const { data, error } = await supabase
    .from('trade_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return { data, error };
}