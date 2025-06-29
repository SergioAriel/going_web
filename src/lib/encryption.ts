import crypto from 'crypto';
import { AddressForm, EncryptedData } from '@/interfaces';

const algorithm = 'aes-256-gcm';
const keyHex = process.env.ENCRYPTION_KEY;

if (!keyHex) {
  throw new Error('ENCRYPTION_KEY no está definida en el archivo .env');
}

const key = Buffer.from(keyHex, 'hex');

export function encryptObject(obj: AddressForm): EncryptedData {

    console.log(obj)
  const text = JSON.stringify(obj);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: authTag.toString('hex'),
  };
}

export function decryptObject(encryptedData: EncryptedData): AddressForm {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  const encryptedText = Buffer.from(encryptedData.content, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  console.log(encryptedData, JSON.parse(decrypted.toString('utf8')))
  return JSON.parse(decrypted.toString('utf8')) as AddressForm;
}
