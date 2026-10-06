import { supabase } from './supabase';
import { getEventByCode } from './events';
import { parseQRPayload, type QRPayload } from './qr';

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

type EventLite = {
  id: string;
  event_code: string;
  title: string;
};

type HistoryAttendanceRow = {
  id: string;
  scanned_at: string;
  events: {
    event_code: string;
    title: string;
  } | null;
};

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    scannedAt: string;
  }[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

type EventRow = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
};

type AttendanceRow = {
  event_id: string;
  student_id: string;
  scanned_at: string;
};

type AttendanceEventIdRow = {
  event_id: string;
};

type SummaryEventRow = {
  id: string;
  event_code: string;
  title: string;
};

export async function getTeacherEventAttendance(
  teacherId: string
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })
    .returns<EventRow[]>();

  if (eventError) {
    throw new Error(`Could not load teacher events: ${eventError.message}`);
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_id, student_id, scanned_at')
    .in('event_id', eventIds)
    .order('scanned_at', { ascending: false })
    .returns<AttendanceRow[]>();

  if (attendanceError) {
    throw new Error(
      `Could not load event attendance: ${attendanceError.message}`
    );
  }

  const rows = attendance ?? [];
  return events.map((event) => {
    const eventAttendance = rows.filter((row) => row.event_id === event.id);
    return {
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time,
      attendeeCount: eventAttendance.length,
      attendees: eventAttendance.map((row) => ({
        studentId: row.student_id,
        scannedAt: row.scanned_at,
      })),
    };
  });
}

export async function getTeacherEventSummary(
  teacherId: string
): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })
    .returns<SummaryEventRow[]>();

  if (eventError) {
    throw new Error(`Could not load teacher event summary: ${eventError.message}`);
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds)
    .returns<AttendanceEventIdRow[]>();

  if (attendanceError) {
    throw new Error(
      `Could not load attendance summary: ${attendanceError.message}`
    );
  }

  const counts: Record<string, number> = {};
  for (const row of attendance ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  }

  return events.map((event) => ({
    eventId: event.id,
    eventCode: event.event_code,
    title: event.title,
    attendeeCount: counts[event.id] ?? 0,
  }));
}

function validateEventWindow(payload: QRPayload): RegisterResult | null {
  const now = Date.now();
  const start = payload.start ? parseEventTimestamp(payload.start) : null;
  const end = payload.end ? parseEventTimestamp(payload.end) : null;

  if (start !== null && Number.isNaN(start)) {
    return { success: false, message: 'Attendance QR code has an invalid start time.' };
  }
  if (end !== null && Number.isNaN(end)) {
    return { success: false, message: 'Attendance QR code has an invalid end time.' };
  }
  if (start !== null && now < start) {
    return { success: false, message: 'Event has not started yet.' };
  }
  if (end !== null && now > end) {
    return { success: false, message: 'Event has already ended.' };
  }
  return null;
}

function parseEventTimestamp(value: string): number {
  if (/(?:z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return new Date(value).getTime();
  }

  const localDateTime =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value
    );
  if (!localDateTime) {
    return new Date(value).getTime();
  }

  const [, year, month, day, hour, minute, second = '0', fraction = '0'] =
    localDateTime;
  const parts = [
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ];
  const date = new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    parts[3],
    parts[4],
    parts[5],
    Number(fraction.padEnd(3, '0'))
  );

  if (
    date.getFullYear() !== parts[0] ||
    date.getMonth() !== parts[1] - 1 ||
    date.getDate() !== parts[2] ||
    date.getHours() !== parts[3] ||
    date.getMinutes() !== parts[4] ||
    date.getSeconds() !== parts[5]
  ) {
    return Number.NaN;
  }

  return date.getTime();
}

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);
  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }
  const payload = parsed.payload;

  const windowError = validateEventWindow(payload);
  if (windowError) {
    return windowError;
  }

  let foundEvent;
  try {
    foundEvent = await getEventByCode(payload.event);
  } catch (error) {
    return {
      success: false,
      message: `Could not check the event: ${
        error instanceof Error ? error.message : 'Unexpected error.'
      }`,
    };
  }

  if (!foundEvent) {
    return {
      success: false,
      message: `Event "${payload.event}" was not found. Ask the teacher to save it, and make sure both apps use the same Supabase project.`,
    };
  }
  const event: Pick<EventLite, 'id' | 'title'> = foundEvent;

  const { error: attendanceError } = await supabase.from('attendance').insert({
    student_id: studentId,
    event_id: event.id,
  });

  if (attendanceError) {
    if (attendanceError.code === '23505') {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: event.title,
      };
    }
    return {
      success: false,
      message: `Could not record attendance: ${attendanceError.message}`,
    };
  }

  return {
    success: true,
    message: 'Attendance recorded!',
    eventTitle: event.title,
  };
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, events ( event_code, title )')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false })
    .returns<HistoryAttendanceRow[]>();

  if (error) {
    throw new Error(`Could not load attendance history: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    eventId: row.events?.event_code ?? '',
    eventTitle: row.events?.title ?? '',
    scannedAt: row.scanned_at,
  }));
}
