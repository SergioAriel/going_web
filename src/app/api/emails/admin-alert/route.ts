import { AdminAlert } from '../../../../emails/AdminAlert';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { driverId, message, details } = await request.json();

        // Send to ADMIN_EMAIL from env, or fallback
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@going.app'; // Replace with real admin email

        const { data, error } = await resend.emails.send({
            from: 'Going Security <security@resend.dev>',
            to: [adminEmail],
            subject: `🚨 Security Alert: Driver ${driverId}`,
            react: AdminAlert({
                driverId,
                message,
                details
            }),
        });

        if (error) {
            console.error('Error sending admin alert:', error);
            return Response.json({ error }, { status: 500 });
        }

        return Response.json({ success: true, data });
    } catch (error: any) {
        console.error('Unexpected error sending admin alert:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
