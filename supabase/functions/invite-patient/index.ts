import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { email, fullName } = await req.json()

    console.log(`[invite-patient] Intentando invitar a: ${fullName} (${email})`);

    // 1. Intentar invitar al usuario
    const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      // Redirigir al login después de que el usuario haga clic en el enlace
      redirectTo: `${req.headers.get('origin')}/login`
    })

    if (error) {
      console.error("[invite-patient] Error de Supabase Auth:", error.message);
      
      // Si el error es por el límite de correos, damos un mensaje más útil
      if (error.message.includes("rate limit")) {
        throw new Error("Límite de correos alcanzado. Por favor, aumenta el 'Max Emails per Hour' en el panel de Supabase (Auth -> Rate Limits).");
      }
      
      throw error;
    }

    console.log("[invite-patient] Invitación enviada con éxito para:", email);

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[invite-patient] Error crítico:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})