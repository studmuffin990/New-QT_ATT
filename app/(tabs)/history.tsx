import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) {
      setRole(null);
      setRecords([]);
      setTeacherEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = getProfile(user.id);
      const currentRole = (await profile)?.role ?? 'student';
      setRole(currentRole);

      if (currentRole === 'teacher') {
        setTeacherEvents(await getTeacherEventAttendance(user.id));
        setRecords([]);
      } else {
        setRecords(await getAttendanceHistory(user.id));
        setTeacherEvents([]);
      }
    } catch (loadError) {
      setRecords([]);
      setTeacherEvents([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load attendance history.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {role === 'teacher' ? 'My Event Attendance' : 'Attendance History'}
      </Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !user ? (
        <Text style={styles.subtitle}>Sign in to view attendance.</Text>
      ) : role === 'teacher' ? (
        teacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>You have not created any events yet.</Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <TeacherEventCard event={item} />}
          />
        )
      ) : records.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>
              <Text style={styles.eventMeta}>{item.eventId}</Text>
              <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function TeacherEventCard({ event }: { event: TeacherEventAttendance }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.count}>{event.attendeeCount} attendee(s)</Text>
      <Text style={styles.eventMeta}>{event.eventCode}</Text>
      {event.startTime && (
        <Text style={styles.eventMeta}>Starts: {formatDate(event.startTime)}</Text>
      )}
      {event.attendees.length === 0 ? (
        <Text style={styles.eventMeta}>No scans yet.</Text>
      ) : (
        event.attendees.map((attendee) => (
          <View key={`${attendee.studentId}-${attendee.scannedAt}`} style={styles.attendee}>
            <Text style={styles.eventMeta}>{shortId(attendee.studentId)}</Text>
            <Text style={styles.eventMeta}>{formatDate(attendee.scannedAt)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
  error: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  count: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  attendee: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 8,
  },
});
