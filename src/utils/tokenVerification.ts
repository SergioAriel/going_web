// src/utils/auth.ts

import * as jose from 'jose';

const PRIVY_JWKS_URL = 'https://auth.privy.io/.well-known/jwks.json';

// Declaramos una variable para almacenar la instancia de JWKS, inicialmente null.
let cachedJWKS: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

// Función para obtener/inicializar el JWKS de forma segura.
// Esta función garantiza que el JWKS se inicialice solo una vez.
async function getPrivyJWKS() {
  if (!cachedJWKS) {
    console.log("Inicializando JWKS de Privy por primera vez...");
    cachedJWKS = await jose.createRemoteJWKSet(new URL(PRIVY_JWKS_URL));
  }
  return cachedJWKS;
}

/**
 * Verifica el Identity Token de Privy.
 * @param idToken El token JWT recibido del frontend.
 * @returns El payload del token si es válido.
 * @throws Error si la verificación falla.
 */
export async function verifyIdentityToken(idToken: string): Promise<jose.JWTPayload> {
  // Obtenemos la instancia de JWKS (esperará si es la primera vez).
  const JWKS = await getPrivyJWKS();

  // En un entorno de producción, considera quitar estos console.log
  // o usar un logger más sofisticado.
  console.log("Verificando token con App ID:", process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  console.log("Usando JWKS URL:", PRIVY_JWKS_URL); 
  console.log("IDTOKEN", idToken)

  try {
    // jose.jwtVerify ahora usará la instancia JWKS que se creó una sola vez.
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: 'privy.io',
      audience: process.env.NEXT_PUBLIC_PRIVY_APP_ID
    });

    return payload;
  } catch (error) {
    console.error('Error de verificación de token de Privy:', error);
    throw new Error('Token de autenticación inválido o expirado.');
  }
}