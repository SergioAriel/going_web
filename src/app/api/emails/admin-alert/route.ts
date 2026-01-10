import { AdminAlert } from '@/emails/AdminAlert';
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { driverId, message, details } = await request.json();

        // 1. Render Email HTML
        const emailHtml = await render(
            AdminAlert({
                driverId,
                message,
                details
            })
        );

        // 2. Setup Transporter
        // Fallback for missing credentials (prevent crash, just log)
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD missing. Admin Alert NOT sent via email.');
            console.log('--- Admin Alert Content ---');
            console.log(`Driver: ${driverId}`);
            console.log(`Message: ${message}`);
            return Response.json({ success: false, error: 'Missing Email Credentials' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        // 3. Send Email
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@going.app';

        const info = await transporter.sendMail({
            from: `"Going Security" <${process.env.GMAIL_USER}>`,
            to: adminEmail,
            subject: `🚨 SECURITY ALERT: Driver ${driverId}`,
            html: emailHtml,
        });

        console.log('Admin Alert sent: %s', info.messageId);
        return Response.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('Unexpected error sending admin alert:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
