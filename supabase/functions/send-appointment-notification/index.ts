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
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    
    if (!BREVO_API_KEY) {
      console.error("[send-appointment-notification] ERROR: La variable BREVO_API_KEY no está configurada en Supabase.");
      return new Response(
        JSON.stringify({ error: "Falta la API Key de Brevo en los secretos de Supabase." }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const body = await req.json();
    const { email, fullName, appointment } = body;

    if (!email || !appointment) {
      console.error("[send-appointment-notification] ERROR: Faltan datos requeridos.");
      return new Response(
        JSON.stringify({ error: "Email y datos de la cita son obligatorios." }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[send-appointment-notification] Enviando email a: ${email} para cita: ${appointment.id}`);

    // Generar el contenido del ICS
    const icsContent = generateICS(appointment);
    const icsBase64 = btoa(icsContent);
    
    // Enviar email con Brevo
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        to: [{ email: email, name: fullName }],
        sender: {
          email: 'no-reply@alma-psychology.com',
          name: 'Alma Psychology'
        },
        subject: `Confirmación de tu cita - ${formatDate(appointment.start_time)}`,
        html: generateEmailHTML(appointment, fullName),
        attachments: [
          {
            name: 'cita-alma-psychology.ics',
            content: icsBase64
          }
        ]
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("[send-appointment-notification] ERROR de la API de Brevo:", responseData);
      throw new Error(responseData.message || "Error al enviar el email");
    }

    console.log("[send-appointment-notification] ÉXITO: Email enviado correctamente.", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[send-appointment-notification] ERROR CRÍTICO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Función para generar el contenido del archivo ICS
function generateICS(appointment: any) {
  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);
  
  // Formato: YYYYMMDDTHHMMSSZ
  const formatDateICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Alma Psychology//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${appointment.id}@alma-psychology.com
DTSTAMP:${formatDateICS(new Date())}
DTSTART:${formatDateICS(startDate)}
DTEND:${formatDateICS(endDate)}
SUMMARY:Cita de terapia con Alma Psychology
DESCRIPTION:Cita de terapia programada el ${formatDate(startDate)}
LOCATION:Sesión online
END:VEVENT
END:VCALENDAR`;
}

// Función para generar el HTML del email
function generateEmailHTML(appointment: any, fullName: string) {
  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);
  
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #4a3f35;">
      <div style="background: linear-gradient(135deg, #c17d60 0%, #a66a51 100%); color: white; padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Fraunces', serif; font-size: 28px; margin: 0; font-weight: 500;">¡Tu cita ha sido confirmada!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Te esperamos en tu sesión de terapia</p>
      </div>
      
      <div style="background: #fdfaf6; border-radius: 20px; padding: 30px; margin-bottom: 30px; border: 1px solid #e8e1d5;">
        <h2 style="font-family: 'Fraunces', serif; color: #4a3f35; margin: 0 0 20px 0; font-size: 22px;">Detalles de tu cita</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: white; padding: 20px; border-radius: 15px; border: 1px solid #e8e1d5;">
            <p style="color: #7a6f64; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Fecha</p>
            <p style="color: #4a3f35; font-size: 18px; font-weight: 500; margin: 0;">${formatDate(startDate)}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 15px; border: 1px solid #e8e1d5;">
            <p style="color: #7a6f64; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Horario</p>
            <p style="color: #4a3f35; font-size: 18px; font-weight: 500; margin: 0;">${formatTime(startDate)} - ${formatTime(endDate)}</p>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 15px; border: 1px solid #e8e1d5;">
          <p style="color: #7a6f64; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Duración</p>
          <p style="color: #4a3f35; font-size: 18px; font-weight: 500; margin: 0;">${calculateDuration(appointment.start_time, appointment.end_time)} minutos</p>
        </div>
      </div>
      
      <div style="background: #b5b891; color: white; padding: 25px; border-radius: 20px; text-align: center; margin-bottom: 30px;">
        <h3 style="font-family: 'Fraunces', serif; margin: 0 0 15px 0; font-size: 20px;">Añade a tu calendario</h3>
        <p style="margin: 0 0 20px 0; opacity: 0.9;">Hemos adjuntado un archivo .ics para que puedas sincronizar esta cita con tu calendario.</p>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; display: inline-block;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">📅 archivo: cita-alma-psychology.ics</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e8e1d5;">
        <p style="color: #7a6f64; font-size: 14px; margin: 0;">
          Si tienes alguna duda, puedes responder a este correo.<br>
          <em>Laura P. L. - Psicología Cercana</em>
        </p>
      </div>
    </div>
  `;
}

// Funciones auxiliares para formatear fechas
function formatDate(date: Date) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateDuration(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60)); // minutos
}