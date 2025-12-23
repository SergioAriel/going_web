
import { PrivyClient } from '@privy-io/server-auth';

const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

export async function verifyIdentityToken(idToken: string) {
  try {
    const verifiedUser = await privyClient.verifyAuthToken(idToken);
    return verifiedUser;
  } catch (error) {
    console.error('Error verifying Privy token:', error);
    throw new Error('Invalid or expired authentication token.');
  }
}
