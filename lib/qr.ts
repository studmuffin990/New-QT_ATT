export type QRPayload = {
  v: 1;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

export function buildQRPayload(event: {
  eventId: string;
  title: string;
  start?: string;
  end?: string;
}): string {
  const payload: QRPayload = {
    v: 1,
    event: event.eventId,
  };

  if (event.title) payload.title = event.title;
  if (event.start) payload.start = event.start;
  if (event.end) payload.end = event.end;

  return JSON.stringify(payload);
}

export type ParseQRResult =
  | { ok: true; payload: QRPayload }
  | { ok: false; message: string };

export function parseQRPayload(raw: string): ParseQRResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'Invalid QR code.' };
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('v' in parsed) ||
    parsed.v !== 1 ||
    !('event' in parsed) ||
    typeof parsed.event !== 'string' ||
    !parsed.event ||
    ('title' in parsed && typeof parsed.title !== 'string') ||
    ('start' in parsed && typeof parsed.start !== 'string') ||
    ('end' in parsed && typeof parsed.end !== 'string')
  ) {
    return { ok: false, message: 'Not an attendance QR code.' };
  }

  const payload: QRPayload = {
    v: 1,
    event: parsed.event,
  };
  if ('title' in parsed && typeof parsed.title === 'string') {
    payload.title = parsed.title;
  }
  if ('start' in parsed && typeof parsed.start === 'string') {
    payload.start = parsed.start;
  }
  if ('end' in parsed && typeof parsed.end === 'string') {
    payload.end = parsed.end;
  }

  return { ok: true, payload };
}
