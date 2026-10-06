import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { signOut, useAuth } from '@/lib/auth';
import { getProfile, updateProfile, type Role } from '@/lib/profiles';

const ROLE_COLORS: Record<Role, string> = {
  teacher: '#17677A',
  student: '#08766F',
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setName('');
      setRole('student');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const profile = await getProfile(user.id);
      const metadataRole = user.user_metadata?.role;
      setRole(
        profile?.role ??
          (metadataRole === 'teacher' || metadataRole === 'student'
            ? metadataRole
            : 'student')
      );
      const metadataName = user.user_metadata?.full_name;
      setName(
        profile?.full_name?.trim() ||
          (typeof metadataName === 'string' ? metadataName.trim() : '')
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not load your profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const openNameEditor = () => {
    setNameDraft(name);
    setSaveError(null);
    setNameModalVisible(true);
  };

  const saveName = async () => {
    const trimmedName = nameDraft.trim();
    if (!trimmedName) {
      setSaveError('Please enter your name.');
      return;
    }
    if (!user) {
      setSaveError('Sign in again before updating your name.');
      return;
    }

    setSavingName(true);
    setSaveError(null);
    try {
      const result = await updateProfile(user.id, { full_name: trimmedName });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setName(trimmedName);
      setNameModalVisible(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Could not save your name.'
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      const result = await signOut();
      if (result.error) {
        setSignOutError(result.error);
        return;
      }
      router.replace('/login');
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'Could not sign out.'
      );
    } finally {
      setSigningOut(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.signedOut}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>You are not signed in.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.signOutButton}
            onPress={() => router.replace('/login')}
          >
            <Ionicons name="log-in-outline" size={21} color={COLORS.textSecondary} />
            <Text style={styles.signOutLabel}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = name || 'Unnamed user';
  const avatarText = (name.trim()[0] || 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Manage your account information</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : loadError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {loadError}
          </Text>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarText}</Text>
              </View>
              <View style={styles.identityCopy}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: ROLE_COLORS[role] },
                  ]}
                >
                  <Text style={styles.roleLabel}>{role.toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{user.email || 'No email address'}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <Text style={styles.sectionLabel}>DISPLAY NAME</Text>
            <Pressable
              accessibilityRole="button"
              onPress={openNameEditor}
              style={({ pressed }) => [
                styles.editNameButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="create-outline"
                size={22}
                color={COLORS.textSecondary}
              />
              <Text style={styles.editNameLabel}>
                {name ? 'Edit your name' : 'Add your name'}
              </Text>
            </Pressable>

            <InfoBlock label="EMAIL" value={user.email || 'No email address'} />
            <InfoBlock label="USER ID" value={user.id} />
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.pressed,
            signingOut && styles.disabled,
          ]}
        >
          {signingOut ? (
            <ActivityIndicator color={COLORS.textSecondary} />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={22}
              color={COLORS.textSecondary}
            />
          )}
          <Text style={styles.signOutLabel}>
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </Pressable>
        {signOutError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {signOutError}
          </Text>
        ) : null}
        <Text style={styles.secureNote}>Signed in securely · QR-ATT v1.0</Text>
      </ScrollView>

      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Display name</Text>
            <Text style={styles.modalSubtitle}>
              Choose the name shown on your profile.
            </Text>
            <TextInput
              autoFocus
              editable={!savingName}
              maxLength={80}
              onChangeText={setNameDraft}
              onSubmitEditing={() => void saveName()}
              placeholder="Your name"
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="done"
              style={styles.nameInput}
              value={nameDraft}
            />
            {saveError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {saveError}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={savingName}
                onPress={() => setNameModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={savingName}
                onPress={() => void saveName()}
                style={[styles.saveButton, savingName && styles.disabled]}
              >
                {savingName ? (
                  <ActivityIndicator color={COLORS.textOnPrimary} />
                ) : (
                  <Text style={styles.saveLabel}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 20,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  avatarText: { color: COLORS.primary, fontSize: 27, fontWeight: '800' },
  identityCopy: { flex: 1, alignItems: 'flex-start' },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 7,
  },
  roleLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  email: { color: COLORS.textSecondary, fontSize: 14, marginTop: 3 },
  separator: { height: 1, backgroundColor: COLORS.border, marginBottom: 20 },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 10,
    marginLeft: 4,
  },
  editNameButton: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  editNameLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  infoBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  signOutButton: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  signOutLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  secureNote: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 22,
    marginBottom: 6,
  },
  loader: { marginVertical: 48 },
  error: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.55 },
  signedOut: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 24, 31, 0.4)',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },
  nameInput: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    minWidth: 88,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  cancelLabel: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '700' },
  saveButton: {
    minWidth: 88,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  saveLabel: { color: COLORS.textOnPrimary, fontSize: 15, fontWeight: '700' },
});
