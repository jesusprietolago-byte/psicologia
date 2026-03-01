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

    // 1. Extraer el email del body de la petición
    const body = await req.json()
    const email = body?.email

    console.log("[notify-approval] Body recibido:", body)
    console.log("[notify-approval] Email extraído:", email)

    // 2. Validar que el email exista
    if (!email) {
      console.error("[notify-approval] ERROR: No se proporcionó un email en la solicitud.")
      return new Response(
        JSON.stringify({ 
          error: "El email es obligatorio.",
          received: body 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      console.error("[notify-approval] ERROR: El email no tiene formato válido:", email)
      return new Response(
        JSON.stringify({ 
          error: "El email no tiene formato válido.",
          received: email 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`[notify-approval] Enviando Magic Link de notificación a: ${email}`)

    // 3. Enviar el Magic Link usando el sistema nativo de Supabase
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${req.headers.get('origin') || 'https://alma-psychology.vercel.app'}/dashboard`,
      }
    })

    if (error) {
      console.error("[notify-approval] ERROR de Supabase Auth:", {
        message: error.message,
        details: error.details,
        stack: error.stack
      })
      throw new Error(error.message || "Error al enviar el Magic Link")
    }

    console.log("[notify-approval] ÉXITO: Magic Link enviado correctamente para:", email)
    console.log("[notify-approval] Respuesta de Supabase:", data)

    // 4. Devolver respuesta exitosa
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Magic Link enviado",
      email: email,
      response: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[notify-approval] ERROR CRÍTICO:", {
      message: error.message,
      stack: error.stack
    })
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})