import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user via their JWT
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use service role to bypass RLS
    const adminClient = createClient(url, serviceKey);

    const { data: invitation, error: invError } = await adminClient
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invitación no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (invitation.accepted_at) {
      return new Response(JSON.stringify({ error: 'Invitación ya fue aceptada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invitación expirada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Esta invitación no es para tu correo' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already a member
    const { data: existing } = await adminClient
      .from('book_members')
      .select('id')
      .eq('book_id', invitation.book_id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      const { error: memberError } = await adminClient
        .from('book_members')
        .insert({ book_id: invitation.book_id, user_id: user.id, role: invitation.role });

      if (memberError) {
        return new Response(JSON.stringify({ error: memberError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await adminClient
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return new Response(JSON.stringify({ book_id: invitation.book_id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
