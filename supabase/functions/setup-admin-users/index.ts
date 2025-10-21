import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const users = [
      {
        email: "leland@candlstrategy.com",
        password: "GoBrowns333",
        fullName: "Leland",
        role: "super_admin"
      },
      {
        email: "Lorenzo@infinitydigitalsolution.com",
        password: "LoLoco3",
        fullName: "Lorenzo",
        role: "admin"
      },
      {
        email: "Korbin@infinitydigitalsolution.com",
        password: "KoKoChanel3",
        fullName: "Korbin",
        role: "admin"
      }
    ];

    const results = [];

    for (const user of users) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        results.push({
          email: user.email,
          success: false,
          error: authError.message
        });
        continue;
      }

      // Add to admin_users table
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          is_active: true
        });

      if (adminError) {
        results.push({
          email: user.email,
          success: false,
          error: `Auth created but admin record failed: ${adminError.message}`
        });
      } else {
        results.push({
          email: user.email,
          success: true,
          userId: authData.user.id
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});