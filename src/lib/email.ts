import { Resend } from 'resend';

// Se inicializa el cliente de Resend con la API key desde las variables de entorno.
// DEBES asegurarte de que la variable RESEND_API_KEY esté definida en tu archivo .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  html: string; // El contenido del email en formato HTML
}

/**
 * Función genérica para enviar emails usando Resend.
 * @param {EmailParams} params - Objeto con destinatario, asunto y contenido HTML.
 * @returns {Promise<boolean>} - True si el email se envió con éxito, false en caso contrario.
 */
export const sendEmail = async ({ to, subject, html }: EmailParams): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Going <onboarding@resend.dev>', // El remitente por defecto de Resend para dominios no verificados
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('An unexpected error occurred while sending email:', error);
    return false;
  }
};
