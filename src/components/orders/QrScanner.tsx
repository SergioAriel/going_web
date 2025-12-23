'use client';

import { useEffect } from 'react';
import { Html5QrcodeScanner, QrcodeErrorCallback, QrcodeSuccessCallback } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: QrcodeSuccessCallback;
  onScanFailure?: QrcodeErrorCallback;
}

const QrScanner = ({ onScanSuccess, onScanFailure }: QrScannerProps) => {
  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader", // ID of the div element
      config,
      false // verbose
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}></div>;
};

export default QrScanner;