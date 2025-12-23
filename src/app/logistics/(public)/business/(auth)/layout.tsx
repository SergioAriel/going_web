import React from 'react';

// This layout is specifically for the authentication pages (login, register, onboarding)
// It uses a Route Group to apply a simple, centered layout without the main
// LogisticsHeader and LogisticsFooter that appear on the rest of the logistics section.
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-grow flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      {children}
    </div>
  );
}
