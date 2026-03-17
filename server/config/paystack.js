import { env } from './env.js';

export const paystack = {
  get secretKey() { return env.paystackSecretKey; },
  get publicKey() { return env.paystackPublicKey; },
  baseUrl: 'https://api.paystack.co',
};
