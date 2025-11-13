import React from 'react';

// This layout is specifically for the authentication pages (login, register, onboarding)
// within the business section. It provides a simple, centered layout without headers or footers.
export default function BusinessAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-grow flex flex-col justify-center  bg-gray-50 dark:bg-gray-900">
      {children}
    </main>
  );
}
