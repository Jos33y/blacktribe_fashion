import { paystack } from '../config/paystack.js';

/**
 * Initialize a Paystack transaction.
 * Amount must be in kobo (₦185,000 = 18500000).
 * Returns { authorization_url, access_code, reference }
 */
export async function initializeTransaction({ email, amount, reference, metadata = {} }) {
  const res = await fetch(`${paystack.baseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount, // kobo
      reference,
      metadata,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    }),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return data.data; // { authorization_url, access_code, reference }
}

/**
 * Verify a Paystack transaction by reference.
 * Returns the full transaction object if successful.
 */
export async function verifyTransaction(reference) {
  const res = await fetch(`${paystack.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${paystack.secretKey}`,
    },
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || 'Failed to verify transaction');
  }

  return data.data;
}
