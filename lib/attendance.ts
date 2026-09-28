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

function validateEventWindow(payload: QRPayload): RegisterResult | null {
  const now = Date.now();
  const start = payload.start ? new Date(payload.start).getTime() : null;
  const end = payload.end ? new Date(payload.end).getTime() : null;

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

  const title = payload.title ?? payload.event;
  const foundEvent = await getEventByCode(payload.event);

  let event: EventLite | null = foundEvent;
  if (!event) {
    const { data: createdEvent, error: createError } = await supabase
      .from('events')
      .insert({
        event_code: payload.event,
        title,
        start_time: payload.start ?? null,
        end_time: payload.end ?? null,
        created_by: null,
      })
      .select('id, event_code, title')
      .single<EventLite>();

    if (createError) {
      if (createError.code === '23505') {
        const existingEvent = await getEventByCode(payload.event);
        if (!existingEvent) {
          return { success: false, message: 'Could not load the event.' };
        }
        event = existingEvent;
      } else {
        return { success: false, message: 'Could not create the event.' };
      }
    } else {
      event = createdEvent;
    }
  }

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
    return { success: false, message: 'Could not record attendance.' };
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
