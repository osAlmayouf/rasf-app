import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import bcrypt           from 'https://esm.sh/bcryptjs@2.4.3';
import { corsHeaders }  from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Verify caller is authenticated ─────────────────────────────────
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

    // ── Check caller is an active admin ────────────────────────────────
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) throw new Error('Not authenticated');

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' || !profile?.is_active) {
      throw new Error('Forbidden — admin access required');
    }

    // ── Parse request body ─────────────────────────────────────────────
    const { email, password, fullName, role, sectors } = await req.json();

    if (!email || !password || !fullName) {
      throw new Error('email, password, and fullName are required');
    }
    if (!['admin', 'user'].includes(role)) {
      throw new Error('role must be admin or user');
    }

    // ── Hash password server-side (bcrypt, 12 rounds) ──────────────────
    const passwordHash = bcrypt.hashSync(password, 12);

    // ── Create auth user (Supabase also hashes internally) ────────────
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) throw createErr;

    // ── Create user profile with hashed password ───────────────────────
    const { error: profileErr } = await supabaseAdmin.from('user_profiles').insert({
      id:        newUser.user.id,
      full_name: fullName,
      email,
      role,
      sectors:   sectors ?? [],
      is_active: true,
      password:  passwordHash,
    });

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw profileErr;
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user.id }),
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
