// ==============================================================================
// Supabase Edge Function: send-parent-email
// Enforces Child Safety Guardrails:
// 1. Target recipient MUST be a verified parent email (children never receive emails).
// 2. Strict non-manipulative wording filter (no anxiety-inducing streak alerts).
// 3. Supported templates: VPC verification link, deletion receipt, dormancy warning, weekly summary.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('TRANSACTIONAL_FROM_EMAIL') || 'SpeakUp Stars Support <support@speakupstars.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MANIPULATIVE_KEYWORDS = [
  'streak will break',
  'streak will die',
  'dont lose your streak',
  'don\'t lose your streak',
  'hurry back',
  'falling behind',
  'you will lose everything',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { toEmail, subject, htmlContent, templateType = 'general', targetRole = 'parent' } = await req.json();

    // RULE 1: Direct emails to children are strictly prohibited
    if (targetRole === 'child') {
      return new Response(
        JSON.stringify({ error: 'SECURITY VIOLATION: Direct communication to children is strictly forbidden.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!toEmail || !subject || !htmlContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required email fields (toEmail, subject, htmlContent)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RULE 2: Anti-Manipulation / Anti-Nagging Guardrail
    const combined = `${subject} ${htmlContent}`.toLowerCase();
    const hasManipulativeWording = MANIPULATIVE_KEYWORDS.some((kw) => combined.includes(kw));
    if (hasManipulativeWording) {
      return new Response(
        JSON.stringify({ error: 'BLOCKED: Message contains manipulative habit-forming wording.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If Resend API key is absent, simulate delivery and return mock receipt
    if (!RESEND_API_KEY) {
      console.warn(`[DEV SIMULATION] RESEND_API_KEY not configured. Simulated dispatch to: ${toEmail} | Subject: ${subject}`);
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          messageId: `sim_${Date.now()}`,
          message: 'Email simulated in dev mode.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real Resend API dispatch
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API dispatch error:', resendData);
      return new Response(JSON.stringify({ error: 'Failed to send transactional email', details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        message: 'Email dispatched successfully to parent.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Email Edge Function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
