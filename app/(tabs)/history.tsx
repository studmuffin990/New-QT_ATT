import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
      <Text style={styles.description}>
        {role === 'teacher'
          ? 'See attendance activity for the events you create.'
          : 'Your scanned event check-ins are collected here.'}
      </Text>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.subtitle}>Loading your activity...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <View style={styles.stateIcon}>
            <Ionicons name="cloud-offline-outline" size={28} color={COLORS.danger} />
          </View>
          <Text style={styles.stateTitle}>Could not load activity</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !user ? (
        <EmptyState
          icon="person-circle-outline"
          title="Sign in to continue"
          message="Sign in to view your attendance activity."
          actionTitle="Sign In"
          onPress={() => router.replace('/login')}
        />
      ) : role === 'teacher' ? (
        teacherEvents.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No events yet"
            message="Create an event to start collecting attendance."
            actionTitle="Create an Event"
            onPress={() => router.push('/teacher')}
          />
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <TeacherEventCard event={item} />}
          />
        )
      ) : records.length === 0 ? (
        <EmptyState
          icon="qr-code-outline"
          title="No attendance yet"
          message="Scan an event QR code and your check-in will appear here."
          actionTitle="Scan an Event"
          onPress={() => router.push('/scan')}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeading}>
                <View style={styles.eventIcon}>
                  <Ionicons name="checkmark-circle-outline" size={21} color={COLORS.primary} />
                </View>
                <View style={styles.cardTitleCopy}>
                  <Text style={styles.eventTitle}>{item.eventTitle}</Text>
                  <Text style={styles.eventMeta}>Event {item.eventId}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
              </View>
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
      <View style={styles.cardHeading}>
        <View style={styles.eventIcon}>
          <Ionicons name="calendar-outline" size={21} color={COLORS.primary} />
        </View>
        <View style={styles.cardTitleCopy}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventMeta}>{event.eventCode}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.count}>{event.attendeeCount}</Text>
        </View>
      </View>
      <Text style={styles.countCaption}>attendee(s)</Text>
      {event.startTime && (
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.eventMeta}>Starts: {formatDate(event.startTime)}</Text>
        </View>
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

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionTitle: string;
  onPress: () => void;
};

function EmptyState({
  icon,
  title,
  message,
  actionTitle,
  onPress,
}: EmptyStateProps) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={30} color={COLORS.primary} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.stateAction,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.stateActionLabel}>{actionTitle}</Text>
        <Ionicons name="arrow-forward" size={17} color={COLORS.textOnPrimary} />
      </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 22,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 14,
  },
  error: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  cardTitleCopy: { flex: 1 },
  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: COLORS.surface,
  },
  countCaption: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: -9,
    marginBottom: 12,
    marginLeft: 54,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 3,
  },
  eventTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  count: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '800',
  },
  stateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: 'center',
    marginTop: 8,
  },
  stateIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: 14,
  },
  stateTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  stateAction: {
    minHeight: 48,
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateActionLabel: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: { opacity: 0.8 },
  attendee: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 8,
  },
});
