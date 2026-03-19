/**
 * QStash Signature Verification
 * 
 * 验证 QStash 请求签名，防止未授权访问
 */

import { Receiver } from '@upstash/qstash';

/**
 * 验证 QStash 请求签名
 */
export function verifyQStashSignature(
  signature: string | null,
  body: string
): boolean {
  if (!signature) {
    console.warn('No QStash signature provided');
    return false;
  }

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    console.error('QStash signing keys not configured');
    return false;
  }

  const receiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });

  try {
    receiver.verify({
      signature,
      body,
    });
    return true;
  } catch (error) {
    console.error('QStash signature verification failed:', error);
    return false;
  }
}

/**
 * 验证 Cron Secret（备用方案）
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}



