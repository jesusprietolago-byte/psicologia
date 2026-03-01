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
    const { email, fullName } = await req.json()

    console.log(`[send-approval-email] Notificando a ${fullName} (${email}) sobre su aprobación.`);

    /**
     * NOTA PARA EL USUARIO:
     * Para enviar correos reales, deberías integrar aquí un servicio como Resend, SendGrid o Postmark.
     * Ejemplo con Resend:
     * await fetch('https://api.resend.com/emails', {
     *   method: 'POST',
     *   headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
     *   body: JSON.stringify({
     *     from: 'Laura P. L. <consultas@tu-dominio.com>',
     *     to: [email],
     *     subject: '¡Tu solicitud de admisión ha sido aprobada!',
     *     html: `<p>Hola ${fullName},</p><p>Tu solicitud ha sido revisada y aprobada. Ya puedes acceder a tu panel para reservar tu primera cita.</p>`
     *   })
     * });
     */

    // Simulamos éxito para el flujo de la app
    return new Response(JSON.stringify({ success: true, message: "Notificación enviada (simulada)" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[send-approval-email] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})