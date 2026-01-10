import { ShipmentNotification } from '../../../../emails/ShipmentNotification';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { shipmentId, recipientEmail, trackingUrl } = await request.json();

        if (!shipmentId || !recipientEmail || !trackingUrl) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fallback for dev if needed
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const { data, error } = await resend.emails.send({
            from: 'Going <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: 'Tu envío de Going está en camino 🚚',
            react: ShipmentNotification({
                shipmentId,
                trackingUrl,
                baseUrl
            }),
        });

        if (error) {
            console.error('Error sending email:', error);
            return Response.json({ error }, { status: 500 });
        }

        return Response.json({ success: true, data });
    } catch (error: any) {
        console.error('Unexpected error sending email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
