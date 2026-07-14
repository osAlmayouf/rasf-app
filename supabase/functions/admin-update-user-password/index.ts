import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import bcrypt           from 'https://esm.sh/bcryptjs@2.4.3';
import { corsHeaders }  from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // ── Verify caller is an active admin ───────────────────────────────
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) throw new Error('Not authenticated');

    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    const callerRole = callerProfile?.role;
    const callerActive = callerProfile?.is_active;
    if (!['admin', 'super_admin'].includes(callerRole) || !callerActive) {
      throw new Error('Forbidden — admin access required');
    }

    // ── Parse body ─────────────────────────────────────────────────────
    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) throw new Error('userId and newPassword are required');
    if (newPassword.length < 6)  throw new Error('Password must be at least 6 characters');

    // ── Permission check ──────────────────────────────────────────────
    const { data: targetProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!targetProfile) throw new Error('User not found');

    const isSelf = userId === user.id;
    // admin can only change non-admin passwords (or their own)
    // super_admin can change anyone's password
    if (targetProfile.role === 'admin' && !isSelf && callerRole !== 'super_admin') {
      throw new Error('Only super admins can change an admin\'s password');
    }

    // ── Update password in Supabase Auth ──────────────────────────────
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateErr) throw updateErr;

    // ── Update bcrypt hash in user_profiles ───────────────────────────
    const passwordHash = bcrypt.hashSync(newPassword, 12);
    await supabaseAdmin
      .from('user_profiles')
      .update({ password: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
