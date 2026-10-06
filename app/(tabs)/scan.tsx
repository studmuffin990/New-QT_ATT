import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';

export default function ScanScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionSubtitle}>Preparing your camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionSubtitle}>
          Allow camera access so you can scan an event QR code and record your
          attendance.
        </Text>
        <AppButton
          theme="primary"
          title="Allow Camera"
          icon="camera-outline"
          onPress={requestPermission}
        />
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setLastData(data);
    if (!user?.id) {
      setMessage('Sign in before recording attendance.');
      setSuccess(false);
      return;
    }

    setSubmitting(true);
    registerAttendance(data, user.id)
      .then((result) => {
        setMessage(result.message);
        setSuccess(result.success);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? `Could not record attendance: ${error.message}`
            : 'Could not record attendance. Please try again.'
        );
        setSuccess(false);
      })
      .finally(() => setSubmitting(false));
  };

  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setSuccess(false);
    setSubmitting(false);
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.scanHeader}>
          <Text style={styles.scanTitle}>Scan attendance QR</Text>
          <Text style={styles.scanSubtitle}>
            Align the event code inside the frame
          </Text>
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            {!scanned && (
              <View style={styles.frameHint}>
                <Ionicons name="qr-code-outline" size={45} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultHeading}>
            <Ionicons
              name={scanned ? (success ? 'checkmark-circle' : 'alert-circle') : 'scan-outline'}
              size={22}
              color={
                scanned
                  ? success
                    ? COLORS.success
                    : COLORS.danger
                  : COLORS.primary
              }
            />
            <Text style={styles.resultTitle}>
              {scanned ? (submitting ? 'Recording attendance...' : 'Scan complete') : 'Ready to scan'}
            </Text>
          </View>
          {message ? (
            <Text
              style={[
                styles.resultMessage,
                success ? styles.successText : styles.errorText,
              ]}
            >
              {message}
            </Text>
          ) : (
            <Text style={styles.resultMessage}>
              Keep the QR code steady and centered in the frame.
            </Text>
          )}
          {lastData ? (
            <Text numberOfLines={2} style={styles.scanData}>
              Code: {lastData}
            </Text>
          ) : null}
          {scanned ? (
            <AppButton
              theme="primary"
              title="Scan Another Code"
              icon="refresh-outline"
              onPress={handleScanAgain}
              disabled={submitting}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#101820',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(12, 34, 38, 0.48)',
  },
  scanHeader: { alignItems: 'center' },
  scanTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  scanSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    marginTop: 7,
  },
  frameWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 264,
    height: 264,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderColor: '#FFFFFF',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  frameHint: {
    width: 82,
    height: 82,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  resultCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 7,
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  resultMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  successText: { color: COLORS.success, fontWeight: '600' },
  errorText: { color: COLORS.danger, fontWeight: '600' },
  scanData: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 5,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: 18,
  },
  permissionTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
});
