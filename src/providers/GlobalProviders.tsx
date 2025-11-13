'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from '@material-tailwind/react';
import { PrivyProvider } from '@/providers/privy';
import { AlertProvider } from '@/context/AlertContext';
import { UserProvider } from '@/context/UserContext';

export function GlobalProviders({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <PrivyProvider>
      <ThemeProvider>
        <UserProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </UserProvider>
      </ThemeProvider>
    </PrivyProvider>
  );
};
