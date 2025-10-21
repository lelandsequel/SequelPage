import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'client';
  clientId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, password, fullName, role, clientId }: CreateUserRequest = await req.json();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    const userId = authData.user.id;

    if (role === 'super_admin' || role === 'admin') {
      const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role,
          is_active: true,
        });

      if (adminError) {
        throw new Error(`Admin user error: ${adminError.message}`);
      }
    } else if (role === 'client' && clientId) {
      const { error: clientError } = await supabaseAdmin
        .from('client_users')
        .insert({
          id: userId,
          client_id: clientId,
          email,
          full_name: fullName,
          is_active: true,
        });

      if (clientError) {
        throw new Error(`Client user error: ${clientError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        message: `User ${email} created successfully`,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});