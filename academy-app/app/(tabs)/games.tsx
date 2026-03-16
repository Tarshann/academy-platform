import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
  FlatList,
} from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography } from '../../lib/theme';
import { GradientCard, GlassCard } from '../../components/GradientCard';
import { AnimatedCard } from '../../components/AnimatedCard';
import { AnimatedCounter } from '../../components/AnimatedCounter';

// ============================================================================
// SPIN WHEEL COMPONENT
// ============================================================================

const WHEEL_SEGMENTS = [
  { label: '10 pts', color: '#e74c3c' },
  { label: '25 pts', color: '#3498db' },
  { label: '50 pts', color: '#2ecc71' },
  { label: '10% Off', color: '#f39c12' },
  { label: '100 pts', color: '#9b59b6' },
  { label: '25% Off', color: '#1abc9c' },
  { label: 'Badge', color: '#e67e22' },
  { label: 'Spin Again', color: '#34495e' },
];

function SpinWheelGame({ onClose }: { onClose: () => void }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ type: string; value: string; points: number } | null>(null);

  const spinMutation = trpc.games.spinWheel.useMutation();
  const playsQuery = trpc.games.dailyPlaysRemaining.useQuery({ gameType: 'spin_wheel' });
  const noSpinsLeft = playsQuery.data ? playsQuery.data.remaining <= 0 : false;

  const handleSpin = async () => {
    if (isSpinning || noSpinsLeft) return;
    if (playsQuery.data && playsQuery.data.remaining <= 0) {
      Alert.alert('No Spins Left', 'Come back tomorrow for more spins!');
      return;
    }

    setIsSpinning(true);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await spinMutation.mutateAsync();

      // Animate the wheel
      const randomRotations = 3 + Math.random() * 3;
      spinAnim.setValue(0);
      Animated.timing(spinAnim, {
        toValue: randomRotations,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResult(res.reward);
        setIsSpinning(false);
        playsQuery.refetch();
        trackEvent('game_played', { game: 'spin_wheel', reward: res.reward.type });
      });
    } catch (err: any) {
      setIsSpinning(false);
      Alert.alert('Error', err.message);
    }
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Gold Rush</Text>
        <View style={styles.playsRemaining}>
          <Text style={styles.playsText}>
            {playsQuery.data?.remaining ?? '...'}/{playsQuery.data?.max ?? 3}
          </Text>
        </View>
      </View>

      <View style={styles.wheelContainer}>
        {/* Wheel */}
        <Animated.View
          style={[styles.wheel, shadows.glow, { transform: [{ rotate: rotation }] }]}
        >
          {WHEEL_SEGMENTS.map((seg, i) => {
            const angle = (i * 360) / WHEEL_SEGMENTS.length;
            return (
              <View
                key={i}
                style={[
                  styles.wheelSegment,
                  {
                    backgroundColor: seg.color,
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -60 },
                    ],
                  },
                ]}
              >
                <Text style={styles.segmentText}>{seg.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Pointer */}
        <View style={styles.pointer}>
          <Ionicons name="caret-down" size={32} color={colors.gold} />
        </View>
      </View>

      {/* Result */}
      {result && (
        <GlassCard style={styles.resultCard}>
          <Ionicons
            name={result.type === 'none' ? 'refresh-outline' : 'gift-outline'}
            size={32}
            color={result.type === 'none' ? colors.textMuted : colors.gold}
          />
          <Text style={styles.resultTitle}>
            {result.type === 'none' ? 'Try Again!' : 'You Won!'}
          </Text>
          <Text style={styles.resultValue}>
            {result.type === 'points' && `${result.value} Points`}
            {result.type === 'discount' && `${result.value} Discount`}
            {result.type === 'badge' && result.value}
            {result.type === 'none' && 'Better luck next time'}
          </Text>
        </GlassCard>
      )}

      {/* Spin Button */}
      <TouchableOpacity
        style={[styles.spinButton, !(isSpinning || noSpinsLeft) && shadows.glow, (isSpinning || noSpinsLeft) && { opacity: 0.5 }]}
        onPress={handleSpin}
        disabled={isSpinning || noSpinsLeft}
        activeOpacity={0.7}
      >
        <Text style={styles.spinButtonText}>
          {isSpinning ? 'Spinning...' : noSpinsLeft ? 'NO SPINS LEFT' : 'SPIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// TRIVIA GAME COMPONENT
// ============================================================================

function TriviaGame({ onClose }: { onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; selectedOption: 'a' | 'b' | 'c' | 'd' }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const questionsQuery = trpc.games.triviaQuestions.useQuery({ count: 5 });
  const submitMutation = trpc.games.submitTrivia.useMutation();
  const playsQuery = trpc.games.dailyPlaysRemaining.useQuery({ gameType: 'trivia' });

  const questions = questionsQuery.data ?? [];
  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option: 'a' | 'b' | 'c' | 'd') => {
    if (selectedOption) return; // Already answered
    setSelectedOption(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newAnswers = [...answers, { questionId: currentQuestion.id, selectedOption: option }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        // Submit all answers
        submitMutation.mutate(
          { answers: newAnswers },
          {
            onSuccess: (data) => {
              setResults(data);
              setShowResults(true);
              playsQuery.refetch();
              Haptics.notificationAsync(
                data.correct > data.total / 2
                  ? Haptics.NotificationFeedbackType.Success
                  : Haptics.NotificationFeedbackType.Warning
              );
              trackEvent('game_played', { game: 'trivia', correct: data.correct, total: data.total });
            },
            onError: (err) => Alert.alert('Error', err.message),
          }
        );
      }
    }, 800);
  };

  if (questionsQuery.isLoading) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Academy Trivia</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Academy Trivia</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 12 }}>
            No trivia questions available yet
          </Text>
        </View>
      </View>
    );
  }

  if (showResults && results) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Results</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <View style={styles.triviaResultCircle}>
            <Text style={[styles.triviaResultScore, { fontFamily: typography.display.fontFamily }]}>
              {results.correct}/{results.total}
            </Text>
          </View>
          <Text style={styles.triviaResultTitle}>
            {results.correct === results.total ? 'Perfect!' :
             results.correct > results.total / 2 ? 'Great Job!' : 'Keep Trying!'}
          </Text>
          <Text style={styles.triviaResultPoints}>
            +{results.totalPoints} points earned
          </Text>

          {/* Individual Results */}
          <ScrollView style={styles.triviaResultsList}>
            {results.results.map((r: any, i: number) => (
              <View key={i} style={styles.triviaResultRow}>
                <Ionicons
                  name={r.correct ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={r.correct ? '#27ae60' : '#e74c3c'}
                />
                <Text style={styles.triviaResultText}>
                  Q{i + 1}: {r.correct ? `+${r.points} pts` : 'Incorrect'}
                </Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.playAgainBtn, shadows.glow]}
            onPress={() => {
              setCurrentIndex(0);
              setAnswers([]);
              setShowResults(false);
              setResults(null);
              setSelectedOption(null);
              questionsQuery.refetch();
            }}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const options = [
    { key: 'a' as const, text: currentQuestion.optionA },
    { key: 'b' as const, text: currentQuestion.optionB },
    { key: 'c' as const, text: currentQuestion.optionC },
    { key: 'd' as const, text: currentQuestion.optionD },
  ];

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Academy Trivia</Text>
        <View style={styles.playsRemaining}>
          <Text style={styles.playsText}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((currentIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.triviaContent}>
        {/* Question */}
        <View style={styles.questionCard}>
          {currentQuestion.category && (
            <Text style={styles.questionCategory}>{currentQuestion.category.toUpperCase()}</Text>
          )}
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <Text style={styles.questionPoints}>
            {currentQuestion.pointValue} points
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.optionBtn,
                selectedOption === opt.key && styles.optionSelected,
              ]}
              onPress={() => handleAnswer(opt.key)}
              disabled={!!selectedOption}
              activeOpacity={0.7}
            >
              <View style={[
                styles.optionLetter,
                selectedOption === opt.key && styles.optionLetterSelected,
              ]}>
                <Text style={[
                  styles.optionLetterText,
                  selectedOption === opt.key && { color: colors.textPrimary },
                ]}>
                  {opt.key.toUpperCase()}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                selectedOption === opt.key && { color: colors.textPrimary },
              ]}>
                {opt.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// SCRATCH CARD COMPONENT
// ============================================================================

function ScratchCardGame({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState([
    { id: 1, scratched: false, result: null as any },
    { id: 2, scratched: false, result: null as any },
    { id: 3, scratched: false, result: null as any },
  ]);

  const scratchMutation = trpc.games.scratchCard.useMutation();
  const playsQuery = trpc.games.dailyPlaysRemaining.useQuery({ gameType: 'scratch_card' });

  const handleScratch = async (cardId: number) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.scratched) return;

    if (playsQuery.data && playsQuery.data.remaining <= 0) {
      Alert.alert('No Scratches Left', 'Come back tomorrow for more cards!');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const res = await scratchMutation.mutateAsync();
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, scratched: true, result: res.reward } : c
        )
      );
      playsQuery.refetch();

      if (res.reward.type !== 'none') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      trackEvent('game_played', { game: 'scratch_card', reward: res.reward.type });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Scratch & Win</Text>
        <View style={styles.playsRemaining}>
          <Text style={styles.playsText}>
            {playsQuery.data?.remaining ?? '...'}/{playsQuery.data?.max ?? 3}
          </Text>
        </View>
      </View>

      <View style={styles.scratchContent}>
        <Text style={styles.scratchInstructions}>
          Tap a card to scratch and reveal your prize!
        </Text>

        <View style={styles.cardsRow}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.scratchCard,
                !card.scratched && shadows.glow,
                card.scratched && styles.scratchCardRevealed,
              ]}
              onPress={() => handleScratch(card.id)}
              disabled={card.scratched || scratchMutation.isPending}
              activeOpacity={0.7}
            >
              {card.scratched && card.result ? (
                <View style={styles.revealedContent}>
                  <Ionicons
                    name={
                      card.result.type === 'points'
                        ? 'star'
                        : card.result.type === 'discount'
                        ? 'pricetag'
                        : card.result.type === 'badge'
                        ? 'medal'
                        : 'refresh'
                    }
                    size={36}
                    color={card.result.type === 'none' ? colors.textMuted : colors.gold}
                  />
                  <Text style={styles.revealedValue}>
                    {card.result.type === 'points' && `${card.result.value} pts`}
                    {card.result.type === 'discount' && `${card.result.value} Off`}
                    {card.result.type === 'badge' && card.result.value}
                    {card.result.type === 'none' && card.result.value}
                  </Text>
                </View>
              ) : (
                <View style={styles.unscratchedContent}>
                  <Ionicons name="help" size={40} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.scratchPrompt}>Tap to Scratch</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {cards.every((c) => c.scratched) && (
          <TouchableOpacity
            style={styles.playAgainBtn}
            onPress={() => {
              setCards([
                { id: 1, scratched: false, result: null },
                { id: 2, scratched: false, result: null },
                { id: 3, scratched: false, result: null },
              ]);
            }}
          >
            <Text style={styles.playAgainText}>New Cards</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN GAMES HUB
// ============================================================================

type GameView = 'hub' | 'spin' | 'trivia' | 'scratch';

export default function GamesHubScreen() {
  const [activeGame, setActiveGame] = useState<GameView>('hub');
  const [refreshing, setRefreshing] = useState(false);

  const points = trpc.games.myPoints.useQuery();
  const leaderboard = trpc.games.leaderboard.useQuery();
  const history = trpc.games.myHistory.useQuery({ limit: 10 });
  const me = trpc.auth.me.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([points.refetch(), leaderboard.refetch(), history.refetch()]);
    setRefreshing(false);
  };

  if (activeGame === 'spin') return <SpinWheelGame onClose={() => { setActiveGame('hub'); points.refetch(); }} />;
  if (activeGame === 'trivia') return <TriviaGame onClose={() => { setActiveGame('hub'); points.refetch(); }} />;
  if (activeGame === 'scratch') return <ScratchCardGame onClose={() => { setActiveGame('hub'); points.refetch(); }} />;

  const games = [
    {
      key: 'spin' as const,
      title: 'Gold Rush',
      subtitle: 'Spin to win points & rewards',
      icon: 'trophy-outline' as const,
      color: '#e74c3c',
      limit: '3 spins/day',
    },
    {
      key: 'trivia' as const,
      title: 'Academy Trivia',
      subtitle: 'Test your sports knowledge',
      icon: 'help-circle-outline' as const,
      color: '#3498db',
      limit: '5 rounds/day',
    },
    {
      key: 'scratch' as const,
      title: 'Scratch & Win',
      subtitle: 'Reveal mystery prizes',
      icon: 'gift-outline' as const,
      color: '#2ecc71',
      limit: '3 cards/day',
    },
  ];

  return (
    <ScrollView
      style={styles.hubContainer}
      contentContainerStyle={styles.hubContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Points Header */}
      <GradientCard
        gradientColors={[colors.cardElevated, colors.card]}
        style={styles.pointsCard}
      >
        <View style={styles.pointsCardInner}>
          <View style={styles.pointsRow}>
            <View>
              <Text style={styles.pointsLabel}>YOUR POINTS</Text>
              <AnimatedCounter
                value={points.data?.totalPoints ?? 0}
                style={{...typography.display, color: colors.gold}}
              />
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={18} color="#e74c3c" />
              <Text style={styles.streakText}>
                {points.data?.currentStreak ?? 0} day streak
              </Text>
            </View>
          </View>
          <View style={styles.pointsStats}>
            <View style={styles.pointsStat}>
              <Text style={[styles.pointsStatValue, typography.displaySmall]}>{points.data?.lifetimePoints ?? 0}</Text>
              <Text style={styles.pointsStatLabel}>Lifetime</Text>
            </View>
            <View style={styles.pointsStat}>
              <Text style={[styles.pointsStatValue, typography.displaySmall]}>{points.data?.longestStreak ?? 0}</Text>
              <Text style={styles.pointsStatLabel}>Best Streak</Text>
            </View>
          </View>
        </View>
      </GradientCard>

      {/* Games Grid */}
      <Text style={[styles.sectionTitle, typography.overline]}>PLAY & EARN</Text>
      <View style={styles.gamesGrid}>
        {games.map((game, i) => (
          <AnimatedCard key={game.key} index={i} animation="fade-up">
            <GradientCard borderOnly borderWidth={1}>
              <TouchableOpacity
                style={styles.gameCard}
                onPress={() => {
                  trackEvent('game_opened', { game: game.key });
                  setActiveGame(game.key);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.gameIconCircle, { backgroundColor: game.color + '20' }, {...shadows.glow, shadowColor: game.color}]}>
                  <Ionicons name={game.icon} size={28} color={game.color} />
                </View>
                <Text style={[styles.gameCardTitle, typography.title]}>{game.title}</Text>
                <Text style={styles.gameCardSubtitle}>{game.subtitle}</Text>
                <Text style={styles.gameCardLimit}>{game.limit}</Text>
              </TouchableOpacity>
            </GradientCard>
          </AnimatedCard>
        ))}
      </View>

      {/* Leaderboard */}
      <Text style={[styles.sectionTitle, typography.overline]}>LEADERBOARD</Text>
      <AnimatedCard index={4}>
        <GlassCard style={styles.leaderboardCard}>
          {(leaderboard.data ?? []).slice(0, 10).map((entry: any, index: number) => (
            <View key={entry.userId} style={styles.leaderboardRow}>
              <View style={[
                styles.rankBadge,
                index < 3 && styles.rankBadgeTop3,
                index < 3 && { backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32'][index] },
              ]}>
                <Text style={[styles.rankText, index < 3 && { color: '#fff' }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderboardName}>
                  {entry.userId === me.data?.id ? 'You' : `Player #${entry.userId}`}
                </Text>
                {entry.currentStreak > 0 && (
                  <Text style={styles.leaderboardStreak}>
                    {entry.currentStreak} day streak
                  </Text>
                )}
              </View>
              <Text style={[styles.leaderboardPoints, { fontFamily: 'BebasNeue' }]}>
                {entry.lifetimePoints.toLocaleString()} pts
              </Text>
            </View>
          ))}
          {(leaderboard.data?.length ?? 0) === 0 && (
            <Text style={styles.emptyLeaderboard}>
              Be the first to play and claim the top spot!
            </Text>
          )}
        </GlassCard>
      </AnimatedCard>

      {/* Recent Activity */}
      {(history.data?.length ?? 0) > 0 && (
        <>
          <Text style={[styles.sectionTitle, typography.overline]}>RECENT ACTIVITY</Text>
          <AnimatedCard index={5}>
            <GlassCard style={styles.historyCard}>
              {(history.data ?? []).map((entry: any) => (
                <View key={entry.id} style={styles.historyRow}>
                  <Ionicons
                    name={
                      entry.gameType === 'spin_wheel'
                        ? 'sync-outline'
                        : entry.gameType === 'trivia'
                        ? 'help-circle-outline'
                        : 'gift-outline'
                    }
                    size={18}
                    color={colors.gold}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyGame}>
                      {entry.gameType === 'spin_wheel' ? 'Gold Rush' :
                       entry.gameType === 'trivia' ? 'Trivia' : 'Scratch Card'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(entry.playedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.historyPoints,
                    entry.pointsEarned > 0 ? { color: '#27ae60' } : { color: colors.textMuted },
                  ]}>
                    {entry.pointsEarned > 0 ? `+${entry.pointsEarned}` : '0'} pts
                  </Text>
                </View>
              ))}
            </GlassCard>
          </AnimatedCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Hub
  hubContainer: { flex: 1, backgroundColor: colors.background },
  hubContent: { padding: 16, paddingBottom: 32 },
  pointsCard: {
    marginBottom: 24,
  },
  pointsCardInner: {
    padding: 20,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  pointsValue: { ...typography.display, color: colors.gold },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  pointsStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  pointsStat: {},
  pointsStatValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  pointsStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  gamesGrid: { gap: 12, marginBottom: 24 },
  gameCard: {
    padding: 20,
    flexDirection: 'column',
  },
  gameIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameCardTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  gameCardSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  gameCardLimit: { fontSize: 11, color: colors.gold, fontWeight: '600', marginTop: 8 },
  // Leaderboard
  leaderboardCard: {
    padding: 16,
    marginBottom: 24,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop3: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  rankText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  leaderboardName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaderboardStreak: { fontSize: 11, color: '#e74c3c' },
  leaderboardPoints: { fontSize: 14, fontWeight: '700', color: colors.gold },
  emptyLeaderboard: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  // History
  historyCard: { padding: 16 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyGame: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  historyDate: { fontSize: 11, color: colors.textMuted },
  historyPoints: { fontSize: 14, fontWeight: '700' },
  // Game screens shared
  gameContainer: { flex: 1, backgroundColor: colors.background },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  gameTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  playsRemaining: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playsText: { fontSize: 13, fontWeight: '600', color: colors.gold },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  // Spin Wheel
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  wheel: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.cardElevated,
    borderWidth: 4,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheelSegment: {
    position: 'absolute',
    width: 60,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  pointer: { marginTop: -10, alignItems: 'center' },
  resultCard: {
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    gap: 8,
  },
  resultTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  resultValue: { fontSize: 16, color: colors.gold, fontWeight: '600' },
  spinButton: {
    backgroundColor: colors.gold,
    borderRadius: 30,
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  spinButtonText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  // Trivia
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  triviaContent: { flex: 1, padding: 20 },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  questionCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  questionText: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, lineHeight: 26 },
  questionPoints: { fontSize: 12, color: colors.textMuted, marginTop: 12 },
  optionsContainer: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterSelected: { backgroundColor: 'rgba(255,255,255,0.3)' },
  optionLetterText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  optionText: { fontSize: 15, color: colors.textSecondary, flex: 1 },
  // Trivia Results
  triviaResultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  triviaResultScore: { fontSize: 36, fontWeight: '800', color: colors.gold },
  triviaResultTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  triviaResultPoints: { fontSize: 16, color: colors.gold, marginBottom: 20 },
  triviaResultsList: { width: '100%', maxHeight: 200 },
  triviaResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  triviaResultText: { fontSize: 14, color: colors.textSecondary },
  playAgainBtn: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  playAgainText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  // Scratch Cards
  scratchContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchInstructions: { fontSize: 16, color: colors.textSecondary, marginBottom: 30, textAlign: 'center' },
  cardsRow: { flexDirection: 'row', gap: 14 },
  scratchCard: {
    width: 100,
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
  },
  scratchCardRevealed: { backgroundColor: colors.cardElevated },
  unscratchedContent: { alignItems: 'center', gap: 8 },
  scratchPrompt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  revealedContent: { alignItems: 'center', gap: 8 },
  revealedValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
});
