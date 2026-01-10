import * as React from 'react';

interface AdminAlertProps {
    driverId: string;
    message: string;
    details?: any;
}

export const AdminAlert = ({
    driverId,
    message,
    details
}: AdminAlertProps) => (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1 style={{ color: '#D32F2F' }}>🚨 Security Alert</h1>
        <p style={{ fontSize: '16px' }}>
            <strong>Driver ID:</strong> {driverId}
        </p>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {message}
        </p>
        {details && (
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {JSON.stringify(details, null, 2)}
            </pre>
        )}
        <p>Please check the admin dashboard immediately.</p>
    </div>
);

export default AdminAlert;
