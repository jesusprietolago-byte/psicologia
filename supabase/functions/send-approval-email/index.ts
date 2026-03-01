import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.error("[send-approval-email] ERROR: La variable RESEND_API_KEY no está configurada en Supabase.");
      return new Response(
        JSON.stringify({ error: "Falta la API Key de Resend en los secretos de Supabase." }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const body = await req.json();
    const { email, fullName } = body;

    if (!email) {
      console.error("[send-approval-email] ERROR: No se proporcionó un email en la solicitud.");
      return new Response(
        JSON.stringify({ error: "El email es obligatorio." }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[send-approval-email] Intentando enviar email a: ${fullName} (${email})`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Laura P. L. <onboarding@resend.dev>',
        to: [email],
        subject: '¡Tu solicitud de admisión ha sido aprobada! ✨',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #4a3f35;">
            <h1 style="color: #c17d60; font-family: serif;">Hola, ${fullName}</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              Tenemos el placer de comunicarte que tu solicitud de admisión en <strong>Alma Psychology</strong> ha sido revisada y aprobada.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Ya puedes acceder a tu panel personal para consultar la disponibilidad y reservar tu primera sesión de terapia.
            </p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${req.headers.get('origin') || 'https://alma-psychology.vercel.app'}/login" 
                 style="background-color: #c17d60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Acceder a mi Panel
              </a>
            </div>
            <p style="margin-top: 40px; font-size: 14px; color: #7a6f64; border-top: 1px solid #e8e1d5; padding-top: 20px;">
              Si tienes alguna duda, puedes responder a este correo.<br>
              <em>Laura P. L. - Psicología Cercana</em>
            </p>
          </div>
        `,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("[send-approval-email] ERROR de la API de Resend:", responseData);
      
      // Error específico de Resend cuando el email no está verificado en modo test
      if (responseData.message?.includes("can only send to your own email")) {
        return new Response(
          JSON.stringify({ 
            error: "Resend está en modo prueba. Solo puedes enviar correos a tu propia dirección hasta que verifiques un dominio.",
            details: responseData
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      throw new Error(responseData.message || "Error desconocido en Resend");
    }

    console.log("[send-approval-email] ÉXITO: Email enviado correctamente.", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[send-approval-email] ERROR CRÍTICO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})