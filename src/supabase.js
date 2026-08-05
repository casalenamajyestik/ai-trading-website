// Supabase Client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpwpqkkgdaixukishihv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd3Bxa2tnZGFpeHVraXNoaWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzUxMjUsImV4cCI6MjEwMTMxMTEyNX0.3rLRi9Lij0NAYKtmQm9xpqoX7djQmb3xTELuKW6m8v0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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