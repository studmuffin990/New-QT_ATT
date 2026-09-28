import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { signOut, useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      {user ? (
        <>
          <Text style={styles.subtitle}>{user.email}</Text>
          <AppButton title="Log Out" icon="log-out-outline" onPress={handleSignOut} />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>You are not logged in.</Text>
          <AppButton
            theme="primary"
            title="Log In"
            icon="log-in-outline"
            onPress={() => router.replace('/login')}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  title: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});
