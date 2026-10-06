import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';

const ACCENT = COLORS.primary;

export default function Index() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="qr-code" size={24} color={ACCENT} />
          </View>
          <Text style={styles.brandName}>QR-ATT</Text>
        </View>

        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.hudRingOuter} />
          <View pointerEvents="none" style={styles.hudRingInner} />
          <View style={styles.heroTop}>
            <View style={styles.liveDot} />
            <Text style={styles.heroEyebrow}>ATTENDANCE NETWORK</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          </View>
          <Text style={styles.title}>Attendance, made simple.</Text>
          <Text style={styles.subtitle}>
            Check in to school events in seconds. Just scan the event QR code.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [
              styles.heroAction,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="scan-outline" size={20} color={ACCENT} />
            <Text style={styles.heroActionLabel}>Scan event QR</Text>
            <Ionicons name="arrow-forward" size={18} color={ACCENT} />
          </Pressable>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>QR-ATT / SECURE ACCESS</Text>
            <Text style={styles.heroFooterText}>SYS 01</Text>
          </View>
        </View>

        <View style={styles.highlights}>
          <Highlight icon="flash" title="Fast" detail="Instant scan" />
          <View style={styles.highlightDivider} />
          <Highlight icon="shield-checkmark" title="Secure" detail="Your check-ins" />
          <View style={styles.highlightDivider} />
          <Highlight icon="cloud-done" title="Saved" detail="Always available" />
        </View>

        <View style={styles.actions}>
          <ActionButton
            title="View Attendance History"
            icon="time-outline"
            onPress={() => router.push('/history')}
          />
          <ActionButton
            title="Manage Profile"
            icon="person-outline"
            onPress={() => router.push('/profile')}
          />
        </View>

        <View style={styles.howItWorks}>
          <View style={styles.howIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color={COLORS.textSecondary}
            />
          </View>
          <View style={styles.howCopy}>
            <Text style={styles.howTitle}>How it works</Text>
            <Text style={styles.howDescription}>
              1. Teacher creates an event QR · 2. Students scan · 3. Attendance
              is recorded automatically
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type HighlightProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
};

function Highlight({ icon, title, detail }: HighlightProps) {
  return (
    <View style={styles.highlight}>
      <View style={styles.highlightTitle}>
        <Ionicons
          name={icon}
          size={14}
          color={COLORS.primary}
        />
        <Text style={styles.highlightLabel}>{title}</Text>
      </View>
      <Text style={styles.highlightDetail}>{detail}</Text>
    </View>
  );
}

type ActionButtonProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function ActionButton({ title, icon, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={COLORS.primary} />
      <Text style={styles.actionLabel}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 22,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hero: {
    backgroundColor: '#0A2632',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C5361',
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  hudRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(34,196,214,0.12)',
    right: -72,
    top: 50,
  },
  hudRingInner: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: 'rgba(34,196,214,0.1)',
    right: -48,
    top: 74,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#54D6A2',
    marginRight: 8,
  },
  heroEyebrow: {
    flex: 1,
    color: '#9BC4CC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27606A',
    backgroundColor: '#102F3A',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#54D6A2',
  },
  onlineText: {
    color: '#A9D8CC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#E7F8FA',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    marginBottom: 9,
  },
  subtitle: {
    color: '#9AB8BE',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  heroAction: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroActionLabel: {
    flex: 1,
    color: '#05212A',
    fontSize: 14,
    fontWeight: '800',
  },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,207,217,0.16)',
    marginTop: 16,
    paddingTop: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroFooterText: {
    color: '#6F9AA3',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  highlights: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 22,
  },
  highlight: { flex: 1, alignItems: 'center', gap: 5 },
  highlightTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  highlightLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  highlightDetail: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  highlightDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  actions: { gap: 12, marginBottom: 22 },
  action: {
    minHeight: 58,
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pressed: { opacity: 0.78 },
  actionLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  howItWorks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  howIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  howCopy: { flex: 1 },
  howTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  howDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
