import { ConfirmationEmail } from '@/emails/confirmation';
import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }
  return new Resend(apiKey);
};

export async function POST(request: Request) {
  const { name, email, confirmationLink } = await request.json();

  try {
    const resend = getResendClient();
    const data = await resend.emails.send({
      from: 'Going <onboarding@resend.dev>',
      to: [email],
      subject: 'Confirm your purchase',
      react: ConfirmationEmail({ name, confirmationLink }),
    });

    return Response.json(data);
  } catch (error: any) {
    console.error("Error sending email:", error);
    return Response.json({ error: error.message || error }, { status: 500 });
  }
}
