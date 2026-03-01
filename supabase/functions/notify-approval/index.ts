import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS para llamadas desde el navegador
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { email } = await req.json()

    if (!email) {
      console.error("[notify-approval] ERROR: No se proporcionó un email en la solicitud.");
      return new Response(
        JSON.stringify({ error: "El email es obligatorio." }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[notify-approval] Enviando Magic Link de notificación a: ${email}`);

    // Usamos signInWithOtp para enviar un Magic Link
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${req.headers.get('origin') || 'https://alma-psychology.vercel.app'}/dashboard`,
      }
    })

    if (error) {
      console.error("[notify-approval] ERROR de Supabase Auth:", error);
      throw new Error(error.message || "Error al enviar el Magic Link");
    }

    console.log("[notify-approval] ÉXITO: Magic Link enviado correctamente para:", email);

    return new Response(JSON.stringify({ success: true, message: "Magic Link enviado" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[notify-approval] ERROR CRÍTICO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})