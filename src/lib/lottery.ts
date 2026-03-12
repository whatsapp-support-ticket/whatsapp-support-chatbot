export const RESERVATION_WINDOW_MS = 5 * 60 * 1000;
export const TICKETS_PER_PAGE = 10;

export function normalizePhoneNumber(input: string): string {
  const value = input.replace(/^whatsapp:/i, '').trim().replace(/\s+/g, '');
  if (!value) {
    return value;
  }

  return value.startsWith('+') ? value : `+${value}`;
}

export function normalizeWhatsAppAddress(input: string): string {
  return `whatsapp:${normalizePhoneNumber(input)}`;
}

export function isReservationExpired(reservedAt?: Date | null): boolean {
  if (!reservedAt) {
    return true;
  }

  return reservedAt.getTime() <= Date.now() - RESERVATION_WINDOW_MS;
}

export function getReservationExpiryDate(): Date {
  return new Date(Date.now() - RESERVATION_WINDOW_MS);
}

export function formatDrawDate(drawDate: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(drawDate);
}
