import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.error("[send-approval-email] Error: RESEND_API_KEY no configurada.");
      return new Response(
        JSON.stringify({ error: "Configura la variable RESEND_API_KEY en los secretos de Supabase." }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { email, fullName } = await req.json();

    console.log(`[send-approval-email] Enviando email real a ${fullName} (${email})`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Laura P. L. <onboarding@resend.dev>', // Nota: En producción usa tu propio dominio verificado
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
              <a href="${req.headers.get('origin')}/login" 
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al enviar el email con Resend");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[send-approval-email] Error crítico:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})