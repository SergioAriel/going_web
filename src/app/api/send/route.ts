import { ConfirmationEmail } from '../../../../emails/confirmation';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { name, email, confirmationLink } = await request.json();

  try {
    const data = await resend.emails.send({
      from: 'Going <onboarding@resend.dev>',
      to: [email],
      subject: 'Confirm your purchase',
      react: ConfirmationEmail({ name, confirmationLink }),
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
