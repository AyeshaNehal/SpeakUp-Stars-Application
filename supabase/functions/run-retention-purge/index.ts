// ==============================================================================
// Supabase Edge Function: run-retention-purge
// Automated Data Retention Cron Runner
// Calls public.run_all_retention_purges() in PostgreSQL via Service Role.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify CRON_SECRET if configured
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization') || '';
    const providedSecret = authHeader.replace(/^Bearer\s+/i, '');
    if (providedSecret !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Cron Secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Call Master Stored Procedure in PostgreSQL
    const { data, error } = await supabase.rpc('run_all_retention_purges');

    if (error) {
      console.error('Database retention purge failed:', error);
      return new Response(JSON.stringify({ error: 'Retention purge failed', details: error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.info('Master Retention Purge Executed Successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        report: data,
        message: 'Master retention purge executed successfully.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Retention Edge Function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
