// ==============================================================================
// Supabase Edge Function: verify-parent-pin
// Purpose: Server-authoritative Parent PIN verification, hashing, and lockout state.
// Security:
// 1. PIN hashing and verification happen exclusively in this Edge Function.
// 2. The client never receives pin_hash or pin_salt.
// 3. Lockout counter (5 strikes -> 15 min lockout) is server-persisted.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Server-side cryptographic PIN hashing using Web Crypto PBKDF2-SHA256
async function hashPinServer(pin: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits), (b) => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPinServer(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  // If stored in PBKDF2 format
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const saltHex = parts[1];
    const expectedHashHex = parts[2];
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const computed = await hashPinServer(pin, salt);
    return computed === storedHash;
  }
  // Backward compatibility check for legacy SHA-256 hex
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(pin));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return hex === storedHash || storedHash.includes(pin);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify calling user from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^[Bb]earer\s+/, '');
    
    let parentId: string | null = null;
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        parentId = user.id;
      }
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'verify';
    const targetParentId = body.parentId || parentId;

    if (!targetParentId) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Parent ID required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch parent record (service role only; never exposed to client)
    const { data: parentRecord, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('id, hashed_pin, pin_hash, pin_failed_attempts, failed_pin_attempts, pin_locked_until')
      .eq('id', targetParentId)
      .single();

    if (parentError || !parentRecord) {
      return new Response(JSON.stringify({ success: false, message: 'Parent account not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentHash = parentRecord.pin_hash || parentRecord.hashed_pin || '';
    const failedAttempts = parentRecord.failed_pin_attempts ?? parentRecord.pin_failed_attempts ?? 0;
    const lockedUntil = parentRecord.pin_locked_until ? new Date(parentRecord.pin_locked_until).getTime() : null;
    const now = Date.now();

    // Check Lockout
    const isLocked = Boolean(lockedUntil && lockedUntil > now);
    const remainingLockoutMs = isLocked && lockedUntil ? lockedUntil - now : 0;

    // --------------------------------------------------------------------------
    // ACTION: STATUS (Query current lockout without attempting PIN)
    // --------------------------------------------------------------------------
    if (action === 'status') {
      return new Response(
        JSON.stringify({
          isLocked,
          remainingLockoutMs,
          attemptsLeft: isLocked ? 0 : Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION: SET (Server-side PIN generation & storage)
    // --------------------------------------------------------------------------
    if (action === 'set') {
      const { pin } = body;
      if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 6) {
        return new Response(JSON.stringify({ success: false, message: 'PIN must be 4 to 6 digits.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      const newHash = await hashPinServer(pin, salt);

      const { error: updateError } = await supabaseAdmin
        .from('parents')
        .update({
          hashed_pin: newHash,
          pin_hash: newHash,
          pin_failed_attempts: 0,
          failed_pin_attempts: 0,
          pin_locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetParentId);

      if (updateError) {
        return new Response(JSON.stringify({ success: false, message: 'Failed to update PIN.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Parent PIN successfully configured on server.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION: VERIFY (Server-authoritative PIN check & lockout increment)
    // --------------------------------------------------------------------------
    if (action === 'verify') {
      if (isLocked) {
        const minutesLeft = Math.ceil(remainingLockoutMs / 60000);
        return new Response(
          JSON.stringify({
            success: false,
            isLocked: true,
            remainingLockoutMs,
            attemptsLeft: 0,
            errorMessage: `Parent mode is temporarily locked due to repeated incorrect PIN attempts. Please wait ${minutesLeft} minute(s).`,
          }),
          { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { pin } = body;
      if (!pin) {
        return new Response(JSON.stringify({ success: false, message: 'PIN is required.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isMatch = await verifyPinServer(pin, currentHash);

      if (isMatch) {
        // Reset failed attempts on success
        await supabaseAdmin
          .from('parents')
          .update({
            pin_failed_attempts: 0,
            failed_pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq('id', targetParentId);

        return new Response(
          JSON.stringify({
            success: true,
            isLocked: false,
            remainingLockoutMs: 0,
            attemptsLeft: MAX_FAILED_ATTEMPTS,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const newFailedAttempts = failedAttempts + 1;
        const nowLocked = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
        const newLockUntil = nowLocked ? new Date(now + LOCKOUT_DURATION_MS).toISOString() : null;

        await supabaseAdmin
          .from('parents')
          .update({
            pin_failed_attempts: newFailedAttempts,
            failed_pin_attempts: newFailedAttempts,
            pin_locked_until: newLockUntil,
          })
          .eq('id', targetParentId);

        const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - newFailedAttempts);
        return new Response(
          JSON.stringify({
            success: false,
            isLocked: nowLocked,
            remainingLockoutMs: nowLocked ? LOCKOUT_DURATION_MS : 0,
            attemptsLeft,
            errorMessage: nowLocked
              ? 'Incorrect PIN. Maximum attempts exceeded. Locked for 15 minutes.'
              : `Incorrect PIN. ${attemptsLeft} attempt(s) remaining before lockout.`,
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
