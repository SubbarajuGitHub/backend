import crypto from 'crypto';

export const IP_HEADER_CANDIDATES = [
  'cf-connecting-ip',
  'x-client-ip',
  'x-forwarded-for',
  'do-connecting-ip',
  'fastly-client-ip',
  'true-client-ip',
  'x-real-ip',
  'x-cluster-client-ip',
  'x-forwarded',
  'forwarded',
  'x-appengine-user-ip',
];

export function getDailySalt() {
  const date = new Date();
  return date.toISOString().split('T')[0]; // e.g. "2025-07-02"
}

export function get30MinSlotTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const slot = Math.floor(minutes / 30) * 30;

  now.setMinutes(slot, 0, 0); // round down to nearest 30 mins
  return now.toISOString(); // e.g. "2025-07-02T14:00:00.000Z"
}

export function generateVisitorId(websiteId, ip, userAgent, salt) {
  const baseString = `${websiteId}:${ip}:${userAgent}:${salt}`;
  return crypto.createHash('sha256').update(baseString).digest('hex'); // returns a 64-char hex string
}
