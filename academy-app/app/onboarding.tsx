import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows, typography } from '../lib/theme';
import { Loading } from '../components/Loading';

const STEPS = ['Role', 'Sport', 'Goals', 'Complete'] as const;

type Role = 'athlete' | 'parent';
type Sport = 'basketball' | 'flag_football' | 'soccer' | 'multi_sport';
type Goal = 'try-it-out' | 'commit' | 'tryout-prep';

const ROLES: { key: Role; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { key: 'athlete', label: 'Athlete', icon: 'fitness-outline', description: 'I train at The Academy' },
  { key: 'parent', label: 'Parent', icon: 'people-outline', description: 'My child trains at The Academy' },
];

const SPORTS: { key: Sport; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'basketball', label: 'Basketball', icon: 'basketball-outline' },
  { key: 'flag_football', label: 'Flag Football', icon: 'american-football-outline' },
  { key: 'soccer', label: 'Soccer', icon: 'football-outline' },
  { key: 'multi_sport', label: 'Multiple Sports', icon: 'medal-outline' },
];

const GOALS: { key: Goal; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'try-it-out', label: 'Try It Out', description: 'Exploring training options for the first time', icon: 'eye-outline' },
  { key: 'commit', label: 'Committed', description: 'Ready to train consistently and improve', icon: 'flame-outline' },
  { key: 'tryout-prep', label: 'Tryout Prep', description: 'Preparing for team tryouts or combine events', icon: 'trophy-outline' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [completing, setCompleting] = useState(false);

  const progress = trpc.onboarding.getProgress.useQuery();
  const updateProfile = trpc.onboarding.updateProfile.useMutation();
  const completeStep = trpc.onboarding.completeStep.useMutation();
  const completeOnboarding = trpc.onboarding.complete.useMutation();

  // Resume from partial progress
  useEffect(() => {
    if (progress.data && !progress.data.completed) {
      const completedSteps = progress.data.steps.map((s: any) => s.step);
      if (completedSteps.includes('set_goals')) {
        setCurrentStep(3);
      } else if (completedSteps.includes('select_sport')) {
        setCurrentStep(2);
      } else if (completedSteps.length > 0) {
        setCurrentStep(1);
      }
    }
  }, [progress.data]);

  // If already completed, go to dashboard
  useEffect(() => {
    if (progress.data?.completed) {
      router.replace('/(tabs)');
    }
  }, [progress.data?.completed]);

  const handleNext = async () => {
    try {
      if (currentStep === 0 && selectedRole) {
        await updateProfile.mutateAsync({ extendedRole: selectedRole });
        trackEvent('onboarding_role_selected', { role: selectedRole });
        setCurrentStep(1);
      } else if (currentStep === 1 && selectedSports.length > 0) {
        await updateProfile.mutateAsync({ sport: selectedSports.join(',') });
        await completeStep.mutateAsync({ step: 'select_sport' });
        trackEvent('onboarding_sport_selected', { sports: selectedSports.join(',') });
        setCurrentStep(2);
      } else if (currentStep === 2 && selectedGoal) {
        await updateProfile.mutateAsync({ goals: selectedGoal });
        await completeStep.mutateAsync({ step: 'set_goals' });
        trackEvent('onboarding_goal_selected', { goal: selectedGoal });
        setCurrentStep(3);
      }
    } catch (err) {
      console.error('[Onboarding] Step error:', err);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeStep.mutateAsync({ step: 'complete' });
      await completeOnboarding.mutateAsync();
      trackEvent('onboarding_completed');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[Onboarding] Complete error:', err);
      setCompleting(false);
    }
  };

  if (progress.isLoading) {
    return <Loading />;
  }

  const canProceed =
    (currentStep === 0 && selectedRole !== null) ||
    (currentStep === 1 && selectedSports.length > 0) ||
    (currentStep === 2 && selectedGoal !== null);

  const isSubmitting = updateProfile.isPending || completeStep.isPending;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                i <= currentStep && styles.progressDotActive,
              ]}
            />
            {i < STEPS.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  i < currentStep && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.stepLabels}>
        {STEPS.map((step, i) => (
          <Text
            key={step}
            style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}
          >
            {step}
          </Text>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Role */}
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Who are you?</Text>
            <Text style={styles.stepSubtitle}>Select your role at The Academy</Text>
            <View style={styles.cardGrid}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleCard,
                    selectedRole === role.key && styles.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole(role.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.roleIconWrap,
                      selectedRole === role.key && styles.roleIconWrapSelected,
                    ]}
                  >
                    <Ionicons
                      name={role.icon}
                      size={32}
                      color={selectedRole === role.key ? colors.card : colors.gold}
                    />
                  </View>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Sport */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What sports?</Text>
            <Text style={styles.stepSubtitle}>Select one or more sports</Text>
            <View style={styles.chipGrid}>
              {SPORTS.map((sport) => {
                const selected = selectedSports.includes(sport.key);
                return (
                  <TouchableOpacity
                    key={sport.key}
                    style={[styles.sportChip, selected && styles.sportChipSelected]}
                    onPress={() => {
                      setSelectedSports((prev) =>
                        selected
                          ? prev.filter((s) => s !== sport.key)
                          : [...prev, sport.key]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={sport.icon}
                      size={22}
                      color={selected ? colors.card : colors.gold}
                    />
                    <Text
                      style={[
                        styles.sportChipText,
                        selected && styles.sportChipTextSelected,
                      ]}
                    >
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Goals */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>This helps us customize your experience</Text>
            <View style={styles.goalList}>
              {GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.key}
                  style={[
                    styles.goalCard,
                    selectedGoal === goal.key && styles.goalCardSelected,
                  ]}
                  onPress={() => setSelectedGoal(goal.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.goalIconWrap,
                      selectedGoal === goal.key && styles.goalIconWrapSelected,
                    ]}
                  >
                    <Ionicons
                      name={goal.icon}
                      size={22}
                      color={selectedGoal === goal.key ? colors.card : colors.gold}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalDesc}>{goal.description}</Text>
                  </View>
                  {selectedGoal === goal.key && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Complete */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.completeWrap}>
              <LinearGradient
                colors={[colors.gold, '#e6c76a']}
                style={styles.completeIcon}
              >
                <Ionicons name="checkmark-done" size={48} color={colors.card} />
              </LinearGradient>
              <Text style={styles.completeTitle}>You're all set!</Text>
              <Text style={styles.completeSubtitle}>
                Welcome to The Academy. Let's start training.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.card} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, completing && styles.nextBtnDisabled]}
            onPress={handleComplete}
            disabled={completing}
            activeOpacity={0.7}
          >
            {completing ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Go to Dashboard</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.card} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.gold,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: colors.gold,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginTop: 6,
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 60,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.gold,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  // Role cards
  cardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
    minHeight: 160,
  },
  roleCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.cardElevated,
  },
  roleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleIconWrapSelected: {
    backgroundColor: colors.gold,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Sport chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
    minWidth: '45%',
    minHeight: 56,
  },
  sportChipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  sportChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sportChipTextSelected: {
    color: colors.card,
  },
  // Goals
  goalList: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
    minHeight: 72,
  },
  goalCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.cardElevated,
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconWrapSelected: {
    backgroundColor: colors.gold,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  goalDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  // Complete
  completeWrap: {
    alignItems: 'center',
    paddingTop: 48,
  },
  completeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Bottom bar
  bottomBar: {
    padding: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    minHeight: 56,
    ...shadows.glow,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.card,
  },
});
