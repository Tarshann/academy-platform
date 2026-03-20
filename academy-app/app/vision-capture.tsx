import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows, spacing, radii } from '../lib/theme';
import { pickImage } from '../lib/chat-images';

type CaptureMode = 'idle' | 'recording' | 'uploading' | 'processing' | 'review';

interface ExtractedMetric {
  metric: string;
  category: string;
  value: number;
  unit: string;
  rawCount?: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'audio' | 'visual' | 'inferred';
}

interface ExtractedAthlete {
  extractedName: string;
  matchedName: string;
  athleteId: number;
  nameConfidence: 'high' | 'medium' | 'low';
  metrics: ExtractedMetric[];
  observations?: string;
}

interface ExtractionData {
  captureId: number;
  athletes: ExtractedAthlete[];
  sessionNotes?: string;
  rawTranscript?: string;
  unparsed?: string[];
  processingTimeMs: number;
}

const CONFIDENCE_ICONS: Record<string, string> = {
  high: '🟢',
  medium: '🟡',
  low: '🔴',
};

export default function VisionCaptureScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [drillContext, setDrillContext] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalValue, setDateModalValue] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: members } = trpc.admin.members.list.useQuery();
  const chatTokenQuery = trpc.auth.chatToken.useQuery(undefined, { staleTime: 5 * 60_000 });

  const extractMutation = trpc.visionCapture.extract.useMutation({
    onSuccess: (data) => {
      const result = data as ExtractionData;
      setExtraction(result);
      const checks: Record<string, boolean> = {};
      result.athletes.forEach((a, ai) => {
        a.metrics.forEach((_, mi) => {
          checks[`${ai}-${mi}`] = true;
        });
      });
      setChecked(checks);
      setMode('review');
      trackEvent('vision_capture_extraction_complete', {
        mode: 'voice',
        athlete_count: result.athletes.length,
        metric_count: result.athletes.reduce((s, a) => s + a.metrics.length, 0),
        processing_ms: result.processingTimeMs,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      Alert.alert('Extraction Failed', err.message || 'Please try again.');
      setMode('idle');
      trackEvent('vision_capture_extraction_failed', { mode: 'voice', error: err.message || 'unknown' });
    },
  });

  const confirmMutation = trpc.visionCapture.confirm.useMutation({
    onSuccess: (data) => {
      const prMsg = data.prsDetected > 0 ? ` ${data.prsDetected} PRs!` : '';
      Alert.alert('Success', `${data.metricsCreated} metrics saved.${prMsg}`);
      trackEvent('vision_capture_confirmed', {
        metric_count: data.metricsCreated,
        pr_count: data.prsDetected,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to save metrics.');
    },
  });

  // ── Voice Recording ──

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice capture.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecordingDuration(0);
      setMode('recording');
      trackEvent('vision_capture_recording_started', { mode: 'voice' });

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => {
          if (d >= 119) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      trackEvent('vision_capture_recording_stopped', {
        mode: 'voice',
        duration_seconds: recordingDuration,
      });

      if (!uri) {
        Alert.alert('Error', 'No audio recorded.');
        setMode('idle');
        return;
      }

      setMode('uploading');

      // Upload via capture endpoint using chat session token
      const token = chatTokenQuery.data?.token;
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please wait a moment and try again.');
        setMode('idle');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'voice-capture.m4a',
        type: 'audio/m4a',
      } as any);
      formData.append('token', token);

      const response = await fetch(`${API_URL}/api/capture/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url, mimeType } = await response.json();

      trackEvent('vision_capture_uploaded', {
        mode: 'voice',
        media_type: mimeType || 'audio/m4a',
        file_size_bytes: 0,
      });

      setMode('processing');
      extractMutation.mutate({
        mediaUrl: url,
        mediaType: (mimeType || 'audio/m4a') as 'audio/m4a',
        mode: 'voice',
        drillContext: drillContext || undefined,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to process recording.');
      setMode('idle');
    }
  }, [recordingDuration, drillContext, chatTokenQuery.data?.token]);

  // ── Photo Capture ──

  const handlePhoto = useCallback(async (source: 'camera' | 'library') => {
    trackEvent('vision_capture_started', { mode: 'photo' });

    const asset = await pickImage(source);
    if (!asset) return;

    setMode('uploading');

    try {
      const token = chatTokenQuery.data?.token;
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please wait a moment and try again.');
        setMode('idle');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const formData = new FormData();
      const uriParts = asset.uri.split('/');
      const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      formData.append('token', token);

      const response = await fetch(`${API_URL}/api/capture/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Upload failed (${response.status}): ${errBody}`);
      }
      const { url } = await response.json();

      trackEvent('vision_capture_uploaded', {
        mode: 'photo',
        media_type: 'image/jpeg',
        file_size_bytes: asset.fileSize || 0,
      });

      setMode('processing');
      extractMutation.mutate({
        mediaUrl: url,
        mediaType: 'image/jpeg',
        mode: 'photo',
        drillContext: drillContext || undefined,
      });
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      Alert.alert('Upload Error', msg);
      setMode('idle');
    }
  }, [drillContext, chatTokenQuery.data?.token]);

  // ── Review helpers ──

  const toggleCheck = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    trackEvent('vision_capture_metric_edited', { field: 'checked' });
  };

  const updateAthleteId = (athleteIdx: number, newId: number) => {
    if (!extraction) return;
    const member = (members as any[])?.find((m: any) => m.id === newId);
    const updated = { ...extraction };
    updated.athletes = [...updated.athletes];
    updated.athletes[athleteIdx] = {
      ...updated.athletes[athleteIdx],
      athleteId: newId,
      matchedName: member?.name || updated.athletes[athleteIdx].matchedName,
      nameConfidence: 'high',
    };
    setExtraction(updated);
    trackEvent('vision_capture_athlete_reassigned', { athlete_id: newId });
  };

  const showAthletePicker = (athleteIdx: number) => {
    const memberList = (members as any[]) || [];
    if (memberList.length === 0) {
      Alert.alert('No Members', 'No members found to assign.');
      return;
    }

    const options = memberList.map((m: any) => m.name || `ID ${m.id}`);
    options.push('Cancel');

    Alert.alert(
      'Assign Athlete',
      'Select the correct athlete for this entry:',
      options.map((label: string, idx: number) => ({
        text: label,
        style: idx === options.length - 1 ? 'cancel' as const : 'default' as const,
        onPress: idx < options.length - 1 ? () => updateAthleteId(athleteIdx, memberList[idx].id) : undefined,
      }))
    );
  };

  const handleConfirm = () => {
    if (!extraction) return;

    const metrics: any[] = [];
    extraction.athletes.forEach((athlete, ai) => {
      athlete.metrics.forEach((metric, mi) => {
        if (checked[`${ai}-${mi}`] && athlete.athleteId > 0) {
          metrics.push({
            athleteId: athlete.athleteId,
            metricName: metric.metric,
            category: metric.category,
            value: String(metric.value),
            unit: metric.unit,
            notes: athlete.observations || undefined,
            sessionDate: new Date(sessionDate).toISOString(),
          });
        }
      });
    });

    if (metrics.length === 0) {
      Alert.alert('No Metrics', 'Assign athletes and check metrics to confirm.');
      return;
    }

    confirmMutation.mutate({
      captureId: extraction.captureId,
      metrics,
      sessionNotes: extraction.sessionNotes,
    });
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Review Screen ──

  if (mode === 'review' && extraction) {
    const totalMetrics = extraction.athletes.reduce((s, a) => s + a.metrics.length, 0);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Review Results</Text>
            <Text style={styles.subtitle}>
              {extraction.athletes.length} athlete{extraction.athletes.length !== 1 ? 's' : ''} · {totalMetrics} metric{totalMetrics !== 1 ? 's' : ''} · {(extraction.processingTimeMs / 1000).toFixed(1)}s
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
          {extraction.rawTranscript && (
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptText}>"{extraction.rawTranscript}"</Text>
            </View>
          )}

          {extraction.athletes.map((athlete, ai) => (
            <View key={ai} style={styles.athleteCard}>
              <View style={styles.athleteHeader}>
                <Text style={styles.confidenceIcon}>
                  {CONFIDENCE_ICONS[athlete.nameConfidence]}
                </Text>
                <Text style={styles.athleteName} numberOfLines={1}>
                  {athlete.nameConfidence === 'high'
                    ? athlete.matchedName
                    : `${athlete.extractedName} → ${athlete.matchedName}?`}
                </Text>
                <TouchableOpacity
                  style={styles.reassignButton}
                  onPress={() => showAthletePicker(ai)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="person-outline" size={14} color={colors.gold} />
                  <Text style={styles.reassignText}>
                    {athlete.athleteId > 0 ? 'Change' : 'Assign'}
                  </Text>
                </TouchableOpacity>
              </View>

              {athlete.metrics.map((metric, mi) => {
                const key = `${ai}-${mi}`;
                return (
                  <View key={mi} style={styles.metricRow}>
                    <TouchableOpacity
                      onPress={() => toggleCheck(key)}
                      style={[
                        styles.checkButton,
                        checked[key] && styles.checkButtonActive,
                      ]}
                    >
                      <Ionicons
                        name={checked[key] ? 'checkmark' : 'close'}
                        size={16}
                        color={checked[key] ? colors.background : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metricName}>{metric.metric}</Text>
                      <Text style={styles.metricValue}>
                        {metric.value} {metric.unit}
                        {metric.rawCount ? ` (${metric.rawCount})` : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.confidenceBadge,
                        {
                          backgroundColor:
                            metric.confidence === 'high'
                              ? 'rgba(46,204,113,0.15)'
                              : metric.confidence === 'medium'
                                ? 'rgba(243,156,18,0.15)'
                                : 'rgba(231,76,60,0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confidenceText,
                          {
                            color:
                              metric.confidence === 'high'
                                ? colors.success
                                : metric.confidence === 'medium'
                                  ? colors.warning
                                  : colors.error,
                          },
                        ]}
                      >
                        {metric.confidence}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {athlete.observations && (
                <Text style={styles.observations}>📝 {athlete.observations}</Text>
              )}
            </View>
          ))}

          {extraction.sessionNotes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>💡 {extraction.sessionNotes}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Session Date:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDateModalValue(sessionDate);
                setDateModalVisible(true);
              }}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.gold} />
              <Text style={styles.dateValue}>{sessionDate}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, (confirmMutation.isPending || checkedCount === 0) && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={confirmMutation.isPending || checkedCount === 0}
          >
            {confirmMutation.isPending ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Confirm {checkedCount} Metric{checkedCount !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={() => {
              trackEvent('vision_capture_discarded', { reason: 'user' });
              router.back();
            }}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
        </View>

        {/* Cross-platform date edit modal */}
        <Modal
          visible={dateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Session Date</Text>
              <Text style={styles.modalSubtitle}>Enter date (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.modalInput}
                value={dateModalValue}
                onChangeText={setDateModalValue}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                autoFocus
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setSessionDate(new Date().toISOString().slice(0, 10));
                    setDateModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setDateModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateModalValue)) {
                      setSessionDate(dateModalValue);
                      setDateModalVisible(false);
                    } else {
                      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format.');
                    }
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.background }]}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Capture Selection Screen ──

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Quick Capture</Text>
          <Text style={styles.subtitle}>Record training results in seconds.</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Voice Recap Card */}
        <View style={styles.captureCard}>
          <Ionicons name="mic-outline" size={32} color={colors.gold} />
          <Text style={styles.cardTitle}>Voice Recap</Text>
          <Text style={styles.cardDescription}>Speak your results after the drill</Text>

          {mode === 'recording' ? (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
              <Text style={styles.recordingHint}>
                Say names and numbers clearly
              </Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Ionicons name="stop" size={20} color="#fff" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, mode !== 'idle' && styles.buttonDisabled]}
              onPress={() => {
                trackEvent('vision_capture_started', { mode: 'voice' });
                startRecording();
              }}
              disabled={mode !== 'idle'}
            >
              <Text style={styles.actionButtonText}>Start Recording</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Capture Card */}
        <View style={styles.captureCard}>
          <Ionicons name="camera-outline" size={32} color={colors.gold} />
          <Text style={styles.cardTitle}>Photo Capture</Text>
          <Text style={styles.cardDescription}>Snap a stopwatch, whiteboard, or measurement</Text>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSmall, mode !== 'idle' && styles.buttonDisabled]}
              onPress={() => handlePhoto('camera')}
              disabled={mode !== 'idle'}
            >
              <Ionicons name="camera" size={16} color={colors.background} style={{ marginRight: 4 }} />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSmall, styles.actionButtonOutline, mode !== 'idle' && styles.buttonDisabled]}
              onPress={() => handlePhoto('library')}
              disabled={mode !== 'idle'}
            >
              <Ionicons name="images" size={16} color={colors.gold} style={{ marginRight: 4 }} />
              <Text style={[styles.actionButtonText, { color: colors.gold }]}>Library</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Processing State */}
        {(mode === 'uploading' || mode === 'processing') && (
          <View style={styles.processingCard}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={styles.processingText}>
              {mode === 'uploading' ? 'Uploading...' : 'Analyzing capture...'}
            </Text>
            <Text style={styles.processingHint}>This may take a few seconds</Text>
          </View>
        )}

        {/* Drill Context */}
        {mode === 'idle' && (
          <View style={styles.contextSection}>
            <Text style={styles.contextLabel}>Drill context (optional)</Text>
            <TextInput
              style={styles.contextInput}
              placeholder="e.g., 3pt shooting, agility drills"
              placeholderTextColor={colors.textMuted}
              value={drillContext}
              onChangeText={setDrillContext}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    padding: spacing.lg,
  },
  captureCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.subtle,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonSmall: {
    flex: 1,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  actionButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  recordingContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.error,
    fontVariant: ['tabular-nums'],
  },
  recordingHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stopButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    gap: 4,
    minHeight: 44,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  processingCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.subtle,
  },
  processingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  processingHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  contextSection: {
    marginTop: spacing.md,
  },
  contextLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  contextInput: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
  },

  // ── Review Screen Styles ──

  athleteCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  confidenceIcon: {
    fontSize: 16,
  },
  reassignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    minHeight: 28,
  },
  reassignText: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  dateValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  athleteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    marginBottom: 4,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  metricValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  observations: {
    fontSize: 12,
    color: colors.textMuted,
    paddingLeft: 36,
    marginTop: 4,
  },
  transcriptCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  transcriptText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  discardButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  discardButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.gold,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
