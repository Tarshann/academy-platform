import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
  Dimensions,
  Easing,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography, spacing, radii } from '../../lib/theme';
import { AnimatedCard } from '../../components/AnimatedCard';
import { AnimatedCounter } from '../../components/AnimatedCounter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// SPIN WHEEL COMPONENT
// ============================================================================

const WHEEL_SEGMENTS = [
  { label: '10 pts', color: '#E74C3C', accent: '#C0392B', icon: 'star' as const },
  { label: '25 pts', color: '#3498DB', accent: '#2980B9', icon: 'star' as const },
  { label: '50 pts', color: '#2ECC71', accent: '#27AE60', icon: 'diamond' as const },
  { label: 'Free Spin', color: '#F39C12', accent: '#E67E22', icon: 'refresh' as const },
  { label: '100 pts', color: '#9B59B6', accent: '#8E44AD', icon: 'trophy' as const },
  { label: '2x Spins', color: '#1ABC9C', accent: '#16A085', icon: 'refresh' as const },
  { label: 'Badge', color: '#E67E22', accent: '#D35400', icon: 'medal' as const },
  { label: 'Spin Again', color: '#607D8B', accent: '#455A64', icon: 'refresh' as const },
];

const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 64, 300);

function SpinWheelGame({ onClose }: { onClose: () => void }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0.5)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ type: string; value: string; points: number } | null>(null);

  const spinMutation = trpc.games.spinWheel.useMutation();
  const playsQuery = trpc.games.dailyPlaysRemaining.useQuery({ gameType: 'spin_wheel' });
  const noSpinsLeft = playsQuery.data ? playsQuery.data.remaining <= 0 : false;

  // Pulsing glow on the spin button
  useEffect(() => {
    if (!isSpinning && !noSpinsLeft) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSpinning, noSpinsLeft]);

  const handleSpin = async () => {
    if (isSpinning || noSpinsLeft) return;
    setIsSpinning(true);
    setResult(null);
    resultFadeAnim.setValue(0);
    resultScaleAnim.setValue(0.5);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await spinMutation.mutateAsync();

      // Spin animation with deceleration
      const totalRotations = 5 + Math.random() * 3;
      spinAnim.setValue(0);
      Animated.timing(spinAnim, {
        toValue: totalRotations,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResult(res.reward);
        setIsSpinning(false);
        playsQuery.refetch();
        trackEvent('game_played', { game: 'spin_wheel', reward: res.reward.type });

        // Animate result card in
        Animated.parallel([
          Animated.timing(resultFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(resultScaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
        ]).start();
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
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Gold Rush</Text>
        <View style={styles.playsRemaining}>
          <Ionicons name="flash" size={14} color={colors.gold} />
          <Text style={styles.playsText}>
            {playsQuery.data?.remaining ?? '...'}/{playsQuery.data?.max ?? 3}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.spinScrollContent} showsVerticalScrollIndicator={false}>
        {/* Wheel */}
        <View style={styles.wheelOuter}>
          {/* Outer ring glow */}
          <View style={styles.wheelGlowRing} />

          {/* Outer ring */}
          <LinearGradient
            colors={[colors.gold, colors.goldDark, colors.gold]}
            style={styles.wheelRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View
              style={[styles.wheel, { transform: [{ rotate: rotation }] }]}
            >
              {WHEEL_SEGMENTS.map((seg, i) => {
                const angle = (i * 360) / WHEEL_SEGMENTS.length;
                const rad = (angle * Math.PI) / 180;
                const radius = (WHEEL_SIZE - 32) / 2 - 24;
                const cx = radius * Math.sin(rad);
                const cy = -radius * Math.cos(rad);
                return (
                  <View
                    key={i}
                    style={[
                      styles.wheelSegment,
                      {
                        transform: [
                          { translateX: cx },
                          { translateY: cy },
                          { rotate: `${angle}deg` },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[seg.color, seg.accent]}
                      style={styles.segmentGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    >
                      <Ionicons name={seg.icon} size={12} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.segmentText}>{seg.label}</Text>
                    </LinearGradient>
                  </View>
                );
              })}

              {/* Center hub */}
              <LinearGradient
                colors={[colors.gold, colors.goldDark]}
                style={styles.wheelCenter}
              >
                <Text style={styles.wheelCenterText}>GO</Text>
              </LinearGradient>
            </Animated.View>
          </LinearGradient>

          {/* Pointer */}
          <View style={styles.pointerContainer}>
            <View style={styles.pointerShadow} />
            <View style={styles.pointer} />
          </View>
        </View>

        {/* Result */}
        {result && (
          <Animated.View style={[styles.resultWrapper, { opacity: resultFadeAnim, transform: [{ scale: resultScaleAnim }] }]}>
            <LinearGradient
              colors={result.type === 'none'
                ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
                : ['rgba(207,184,124,0.2)', 'rgba(207,184,124,0.05)']}
              style={styles.resultCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.resultIconCircle, result.type !== 'none' && styles.resultIconCircleWin]}>
                <Ionicons
                  name={result.type === 'none' ? 'refresh-outline' : result.type === 'badge' ? 'medal' : 'gift'}
                  size={32}
                  color={result.type === 'none' ? colors.textMuted : colors.gold}
                />
              </View>
              <Text style={styles.resultTitle}>
                {result.type === 'none' ? 'Try Again!' : 'You Won!'}
              </Text>
              <Text style={[styles.resultValue, result.type !== 'none' && { color: colors.gold }]}>
                {result.type === 'points' && (result.value.includes('Free Spin') ? result.value : `${result.value} Points`)}
                {result.type === 'badge' && result.value}
                {result.type === 'none' && 'Better luck next time'}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Spin Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignSelf: 'center', marginTop: 24 }}>
          <TouchableOpacity
            onPress={handleSpin}
            disabled={isSpinning || noSpinsLeft}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(isSpinning || noSpinsLeft)
                ? ['#555', '#444']
                : [colors.gold, colors.goldDark]}
              style={[styles.spinButton, !(isSpinning || noSpinsLeft) && shadows.glow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isSpinning ? (
                <Ionicons name="sync" size={22} color="#fff" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.spinButtonText}>
                {isSpinning ? 'SPINNING...' : noSpinsLeft ? 'NO SPINS LEFT' : 'SPIN'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
  const questionFade = useRef(new Animated.Value(1)).current;
  const scoreScaleAnim = useRef(new Animated.Value(0)).current;

  const questionsQuery = trpc.games.triviaQuestions.useQuery({ count: 5 });
  const submitMutation = trpc.games.submitTrivia.useMutation();
  const playsQuery = trpc.games.dailyPlaysRemaining.useQuery({ gameType: 'trivia' });

  const questions = questionsQuery.data ?? [];
  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option: 'a' | 'b' | 'c' | 'd') => {
    if (selectedOption) return;
    setSelectedOption(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newAnswers = [...answers, { questionId: currentQuestion.id, selectedOption: option }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        // Fade out, change question, fade in
        Animated.timing(questionFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
          setCurrentIndex(currentIndex + 1);
          setSelectedOption(null);
          Animated.timing(questionFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        });
      } else {
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
              // Animate score
              Animated.spring(scoreScaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
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
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Academy Trivia</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.centeredContent}>
          <Ionicons name="hourglass-outline" size={40} color={colors.gold} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Academy Trivia</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.centeredContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No trivia questions available yet</Text>
          <Text style={styles.emptySubtitle}>Check back soon — new questions are on the way!</Text>
        </View>
      </View>
    );
  }

  if (showResults && results) {
    const percentage = Math.round((results.correct / results.total) * 100);
    const isPerfect = results.correct === results.total;
    const isGood = results.correct > results.total / 2;

    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Results</Text>
          <View style={{ width: 48 }} />
        </View>
        <ScrollView contentContainerStyle={styles.resultsScrollContent}>
          {/* Score circle */}
          <Animated.View style={{ transform: [{ scale: scoreScaleAnim }] }}>
            <LinearGradient
              colors={isPerfect ? [colors.gold, colors.goldDark] : isGood ? ['#2ECC71', '#27AE60'] : ['#E74C3C', '#C0392B']}
              style={styles.scoreCircle}
            >
              <Text style={styles.scorePercentage}>{percentage}%</Text>
              <Text style={styles.scoreLabel}>{results.correct}/{results.total}</Text>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.triviaResultTitle}>
            {isPerfect ? 'PERFECT!' : isGood ? 'GREAT JOB!' : 'KEEP TRYING!'}
          </Text>

          <View style={styles.pointsEarnedBadge}>
            <Ionicons name="star" size={18} color={colors.gold} />
            <Text style={styles.pointsEarnedText}>+{results.totalPoints} points earned</Text>
          </View>

          {/* Individual results */}
          <View style={styles.triviaResultsList}>
            {results.results.map((r: any, i: number) => (
              <View key={i} style={styles.triviaResultRow}>
                <View style={[styles.resultDot, { backgroundColor: r.correct ? '#2ECC71' : '#E74C3C' }]}>
                  <Ionicons
                    name={r.correct ? 'checkmark' : 'close'}
                    size={14}
                    color="#fff"
                  />
                </View>
                <Text style={styles.triviaResultLabel}>Question {i + 1}</Text>
                <Text style={[styles.triviaResultPoints, { color: r.correct ? '#2ECC71' : colors.textMuted }]}>
                  {r.correct ? `+${r.points}` : '0'} pts
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => {
              setCurrentIndex(0);
              setAnswers([]);
              setShowResults(false);
              setResults(null);
              setSelectedOption(null);
              scoreScaleAnim.setValue(0);
              questionsQuery.refetch();
            }}
          >
            <LinearGradient
              colors={[colors.gold, colors.goldDark]}
              style={[styles.playAgainBtn, shadows.glow]}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.playAgainText}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
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
        <LinearGradient
          colors={[colors.gold, colors.goldLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.progressBarFill,
            { width: `${((currentIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <Animated.View style={[styles.triviaContent, { opacity: questionFade }]}>
        {/* Question card */}
        <LinearGradient
          colors={['rgba(207,184,124,0.12)', 'rgba(255,255,255,0.04)']}
          style={styles.questionCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {currentQuestion.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name="basketball-outline" size={12} color={colors.gold} />
              <Text style={styles.questionCategory}>{currentQuestion.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <View style={styles.questionMeta}>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={12} color={colors.gold} />
              <Text style={styles.questionPoints}>{currentQuestion.pointValue} pts</Text>
            </View>
            {currentQuestion.difficulty && (
              <Text style={[styles.difficultyText, {
                color: currentQuestion.difficulty === 'easy' ? '#2ECC71' :
                       currentQuestion.difficulty === 'hard' ? '#E74C3C' : colors.warning,
              }]}>
                {currentQuestion.difficulty.toUpperCase()}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionBtn, isSelected && styles.optionSelected]}
                onPress={() => handleAnswer(opt.key)}
                disabled={!!selectedOption}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[colors.gold, colors.goldDark]}
                    style={styles.optionLetter}
                  >
                    <Text style={[styles.optionLetterText, { color: '#fff' }]}>
                      {opt.key.toUpperCase()}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.optionLetter}>
                    <Text style={styles.optionLetterText}>
                      {opt.key.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.optionText, isSelected && { color: colors.textPrimary, fontWeight: '600' }]}>
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
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
  const cardScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const cardFlips = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const scratchMutation = trpc.games.scratchCard.useMutation();
  const playsQuery = trpc.games.dailyPlaysRemaining.useQuery({ gameType: 'scratch_card' });

  const handleScratch = async (cardId: number) => {
    const cardIndex = cardId - 1;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.scratched) return;

    if (playsQuery.data && playsQuery.data.remaining <= 0) {
      Alert.alert('No Scratches Left', 'Come back tomorrow for more cards!');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Press animation
    Animated.sequence([
      Animated.timing(cardScales[cardIndex], { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(cardScales[cardIndex], { toValue: 1.05, duration: 200, useNativeDriver: true }),
      Animated.timing(cardScales[cardIndex], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    try {
      const res = await scratchMutation.mutateAsync();

      // Flip animation
      Animated.timing(cardFlips[cardIndex], {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();

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

  const getRewardIcon = (type: string, value?: string): keyof typeof Ionicons.glyphMap => {
    if (value?.includes('Free Spin')) return 'refresh';
    switch (type) {
      case 'points': return 'star';
      case 'badge': return 'medal';
      default: return 'refresh';
    }
  };

  const getRewardColor = (type: string, value?: string) => {
    if (value?.includes('Free Spin')) return '#1ABC9C';
    switch (type) {
      case 'points': return colors.gold;
      case 'badge': return '#9B59B6';
      default: return colors.textMuted;
    }
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Scratch & Win</Text>
        <View style={styles.playsRemaining}>
          <Ionicons name="flash" size={14} color={colors.gold} />
          <Text style={styles.playsText}>
            {playsQuery.data?.remaining ?? '...'}/{playsQuery.data?.max ?? 3}
          </Text>
        </View>
      </View>

      <View style={styles.scratchContent}>
        <Text style={styles.scratchInstructions}>
          Tap a card to reveal your prize!
        </Text>

        <View style={styles.cardsRow}>
          {cards.map((card, index) => {
            const flipRotation = cardFlips[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            });

            return (
              <Animated.View
                key={card.id}
                style={{ transform: [{ scale: cardScales[index] }, { rotateY: flipRotation }] }}
              >
                <TouchableOpacity
                  onPress={() => handleScratch(card.id)}
                  disabled={card.scratched || scratchMutation.isPending}
                  activeOpacity={0.8}
                >
                  {card.scratched && card.result ? (
                    <LinearGradient
                      colors={card.result.type === 'none'
                        ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']
                        : ['rgba(207,184,124,0.15)', 'rgba(207,184,124,0.05)']}
                      style={[styles.scratchCard, styles.scratchCardRevealed]}
                    >
                      <View style={[styles.revealedIconCircle, { borderColor: getRewardColor(card.result.type, card.result.value) }]}>
                        <Ionicons
                          name={getRewardIcon(card.result.type, card.result.value)}
                          size={28}
                          color={getRewardColor(card.result.type, card.result.value)}
                        />
                      </View>
                      <Text style={[styles.revealedValue, { color: getRewardColor(card.result.type, card.result.value) }]}>
                        {card.result.type === 'points' && (card.result.value.includes('Free Spin') ? card.result.value : `${card.result.value} pts`)}
                        {card.result.type === 'badge' && card.result.value}
                        {card.result.type === 'none' && 'Try Again'}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <LinearGradient
                      colors={[colors.gold, colors.goldDark, '#8B7340']}
                      style={[styles.scratchCard, shadows.elevated]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {/* Shimmer dots */}
                      <View style={[styles.shimmerDot, { top: 12, left: 12 }]} />
                      <View style={[styles.shimmerDot, { top: 12, right: 12 }]} />
                      <View style={[styles.shimmerDot, { bottom: 12, left: 12 }]} />
                      <View style={[styles.shimmerDot, { bottom: 12, right: 12 }]} />
                      <View style={[styles.shimmerDot, { top: '45%', left: '15%' }]} />
                      <View style={[styles.shimmerDot, { top: '35%', right: '15%' }]} />

                      <View style={styles.scratchQuestionMark}>
                        <Text style={styles.scratchQuestionText}>?</Text>
                      </View>
                      <Text style={styles.scratchPrompt}>TAP TO SCRATCH</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Summary after all scratched */}
        {cards.every((c) => c.scratched) && (
          <View style={styles.scratchSummary}>
            <Text style={styles.scratchSummaryTitle}>All cards revealed!</Text>
            <Text style={styles.scratchSummaryPoints}>
              +{cards.reduce((sum, c) => sum + (c.result?.points ?? 0), 0)} points earned
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCards([
                  { id: 1, scratched: false, result: null },
                  { id: 2, scratched: false, result: null },
                  { id: 3, scratched: false, result: null },
                ]);
                cardFlips.forEach(f => f.setValue(0));
              }}
            >
              <LinearGradient
                colors={[colors.gold, colors.goldDark]}
                style={[styles.playAgainBtn, shadows.glow]}
              >
                <Ionicons name="layers-outline" size={20} color="#fff" />
                <Text style={styles.playAgainText}>New Cards</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN GAMES HUB
// ============================================================================

type GameView = 'hub' | 'spin' | 'trivia' | 'scratch';

const GAME_CONFIGS = [
  {
    key: 'spin' as const,
    title: 'Gold Rush',
    subtitle: 'Spin the wheel for points & prizes',
    icon: 'trophy' as const,
    gradientColors: ['#E74C3C', '#C0392B'] as const,
    limit: '3 spins/day',
  },
  {
    key: 'trivia' as const,
    title: 'Academy Trivia',
    subtitle: 'Test your sports knowledge',
    icon: 'school' as const,
    gradientColors: ['#3498DB', '#2980B9'] as const,
    limit: '5 rounds/day',
  },
  {
    key: 'scratch' as const,
    title: 'Scratch & Win',
    subtitle: 'Reveal mystery prizes',
    icon: 'gift' as const,
    gradientColors: ['#2ECC71', '#27AE60'] as const,
    limit: '3 cards/day',
  },
];

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

  return (
    <ScrollView
      style={styles.hubContainer}
      contentContainerStyle={styles.hubContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Points Header */}
      <AnimatedCard index={0} animation="fade-up">
        <LinearGradient
          colors={['rgba(207,184,124,0.15)', 'rgba(207,184,124,0.03)']}
          style={[styles.pointsCard, shadows.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pointsRow}>
            <View>
              <Text style={styles.pointsLabel}>YOUR POINTS</Text>
              <AnimatedCounter
                value={points.data?.totalPoints ?? 0}
                style={{ fontFamily: 'BebasNeue', fontSize: 48, color: colors.gold }}
              />
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={18} color="#E74C3C" />
              <Text style={styles.streakText}>
                {points.data?.currentStreak ?? 0}
              </Text>
            </View>
          </View>
          <View style={styles.pointsDivider} />
          <View style={styles.pointsStats}>
            <View style={styles.pointsStat}>
              <Text style={styles.pointsStatValue}>{(points.data?.lifetimePoints ?? 0).toLocaleString()}</Text>
              <Text style={styles.pointsStatLabel}>Lifetime Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.pointsStat}>
              <Text style={styles.pointsStatValue}>{points.data?.longestStreak ?? 0}</Text>
              <Text style={styles.pointsStatLabel}>Best Streak</Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedCard>

      {/* Games Grid */}
      <Text style={styles.sectionTitle}>PLAY & EARN</Text>
      <View style={styles.gamesGrid}>
        {GAME_CONFIGS.map((game, i) => (
          <AnimatedCard key={game.key} index={i + 1} animation="fade-up">
            <TouchableOpacity
              onPress={() => {
                trackEvent('game_opened', { game: game.key });
                setActiveGame(game.key);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={[styles.gameCard, shadows.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gameCardRow}>
                  <LinearGradient
                    colors={game.gradientColors as any}
                    style={styles.gameIconCircle}
                  >
                    <Ionicons name={game.icon} size={24} color="#fff" />
                  </LinearGradient>
                  <View style={styles.gameCardInfo}>
                    <Text style={styles.gameCardTitle}>{game.title}</Text>
                    <Text style={styles.gameCardSubtitle}>{game.subtitle}</Text>
                  </View>
                  <View style={styles.gameCardArrow}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </View>
                <View style={styles.gameCardFooter}>
                  <Ionicons name="flash" size={12} color={colors.gold} />
                  <Text style={styles.gameCardLimit}>{game.limit}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedCard>
        ))}
      </View>

      {/* Leaderboard */}
      <Text style={styles.sectionTitle}>LEADERBOARD</Text>
      <AnimatedCard index={4}>
        <View style={[styles.leaderboardCard, shadows.card]}>
          {(leaderboard.data ?? []).length === 0 ? (
            <View style={styles.emptyLeaderboardContainer}>
              <Ionicons name="podium-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyLeaderboard}>
                Be the first to play and claim the top spot!
              </Text>
            </View>
          ) : (
            (leaderboard.data ?? []).slice(0, 10).map((entry: any, index: number) => {
              const isMe = entry.userId === me.data?.id;
              const isTop3 = index < 3;
              const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

              return (
                <View key={entry.userId} style={[styles.leaderboardRow, isMe && styles.leaderboardRowMe]}>
                  {isTop3 ? (
                    <LinearGradient
                      colors={[medalColors[index], medalColors[index] + 'AA']}
                      style={styles.rankBadgeTop}
                    >
                      <Text style={styles.rankTextTop}>{index + 1}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.leaderboardName, isMe && { color: colors.gold }]}>
                      {isMe ? 'You' : (entry.displayName || `Player #${entry.userId}`)}
                    </Text>
                    {entry.currentStreak > 0 && (
                      <View style={styles.leaderboardStreakRow}>
                        <Ionicons name="flame" size={10} color="#E74C3C" />
                        <Text style={styles.leaderboardStreak}>{entry.currentStreak} day streak</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.leaderboardPoints}>
                    {(entry.lifetimePoints ?? 0).toLocaleString()}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </AnimatedCard>

      {/* Recent Activity */}
      {(history.data?.length ?? 0) > 0 && (
        <>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <AnimatedCard index={5}>
            <View style={[styles.historyCard, shadows.card]}>
              {(history.data ?? []).map((entry: any) => {
                const gameIcon = entry.gameType === 'spin_wheel' ? 'sync-outline' as const
                  : entry.gameType === 'trivia' ? 'school-outline' as const
                  : 'gift-outline' as const;
                const gameName = entry.gameType === 'spin_wheel' ? 'Gold Rush'
                  : entry.gameType === 'trivia' ? 'Trivia'
                  : 'Scratch Card';

                return (
                  <View key={entry.id} style={styles.historyRow}>
                    <View style={styles.historyIcon}>
                      <Ionicons name={gameIcon} size={16} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyGame}>{gameName}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.playedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[
                      styles.historyPoints,
                      { color: entry.pointsEarned > 0 ? '#2ECC71' : colors.textMuted },
                    ]}>
                      {entry.pointsEarned > 0 ? `+${entry.pointsEarned}` : '0'} pts
                    </Text>
                  </View>
                );
              })}
            </View>
          </AnimatedCard>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ── Hub ──────────────────────────────────────────────────────────
  hubContainer: { flex: 1, backgroundColor: colors.background },
  hubContent: { padding: spacing.base, paddingBottom: 40 },
  pointsCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(207,184,124,0.15)',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pointsLabel: {
    ...typography.overline,
    marginBottom: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(231,76,60,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.2)',
  },
  streakText: { fontSize: 16, fontWeight: '700', color: '#E74C3C', fontFamily: 'BebasNeue' },
  pointsDivider: {
    height: 1,
    backgroundColor: 'rgba(207,184,124,0.12)',
    marginVertical: spacing.base,
  },
  pointsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsStat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  pointsStatValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, fontFamily: 'BebasNeue' },
  pointsStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    ...typography.overline,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  gamesGrid: { gap: spacing.md, marginBottom: spacing.xl },
  gameCard: {
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gameIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCardInfo: { flex: 1 },
  gameCardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  gameCardSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  gameCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  gameCardLimit: { fontSize: 12, color: colors.gold, fontWeight: '600' },

  // ── Leaderboard ──────────────────────────────────────────────────
  leaderboardCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderboardRowMe: {
    backgroundColor: 'rgba(207,184,124,0.08)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  rankTextTop: { fontSize: 15, fontWeight: '800', color: '#fff' },
  leaderboardName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaderboardStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  leaderboardStreak: { fontSize: 11, color: '#E74C3C' },
  leaderboardPoints: { fontSize: 16, fontWeight: '700', color: colors.gold, fontFamily: 'BebasNeue' },
  emptyLeaderboardContainer: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyLeaderboard: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  // ── History ──────────────────────────────────────────────────────
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(207,184,124,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyGame: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  historyDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  historyPoints: { fontSize: 14, fontWeight: '700' },

  // ── Game Screens Shared ──────────────────────────────────────────
  gameContainer: { flex: 1, backgroundColor: colors.background },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.base,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, fontFamily: 'BebasNeue', letterSpacing: 1 },
  playsRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(207,184,124,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(207,184,124,0.2)',
  },
  playsText: { fontSize: 14, fontWeight: '700', color: colors.gold, fontFamily: 'BebasNeue' },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },

  // ── Spin Wheel ───────────────────────────────────────────────────
  spinScrollContent: { alignItems: 'center', paddingBottom: 40 },
  wheelOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  wheelGlowRing: {
    position: 'absolute',
    width: WHEEL_SIZE + 20,
    height: WHEEL_SIZE + 20,
    borderRadius: (WHEEL_SIZE + 20) / 2,
    backgroundColor: 'rgba(207,184,124,0.08)',
  },
  wheelRing: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    width: WHEEL_SIZE - 12,
    height: WHEEL_SIZE - 12,
    borderRadius: (WHEEL_SIZE - 12) / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSegment: {
    position: 'absolute',
    width: 56,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 4,
  },
  segmentText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  wheelCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  wheelCenterText: { fontSize: 18, fontWeight: '900', color: '#fff', fontFamily: 'BebasNeue', letterSpacing: 2 },
  pointerContainer: {
    marginTop: -14,
    alignItems: 'center',
    zIndex: 10,
  },
  pointerShadow: {
    position: 'absolute',
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0,0,0,0.3)',
    transform: [{ rotate: '180deg' }],
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.gold,
    backgroundColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  resultWrapper: { marginHorizontal: 20, marginTop: 8 },
  resultCard: {
    padding: 24,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(207,184,124,0.2)',
  },
  resultIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconCircleWin: {
    backgroundColor: 'rgba(207,184,124,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(207,184,124,0.3)',
  },
  resultTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, fontFamily: 'BebasNeue', letterSpacing: 1 },
  resultValue: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  spinButton: {
    borderRadius: 30,
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 64,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  spinButtonText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 3, fontFamily: 'BebasNeue' },

  // ── Trivia ───────────────────────────────────────────────────────
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.base,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  triviaContent: { flex: 1, padding: spacing.lg },
  questionCard: {
    borderRadius: radii.lg,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(207,184,124,0.12)',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  questionCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1.5,
  },
  questionText: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, lineHeight: 26 },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(207,184,124,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  questionPoints: { fontSize: 12, color: colors.gold, fontWeight: '600' },
  difficultyText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  optionsContainer: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionSelected: {
    backgroundColor: 'rgba(207,184,124,0.15)',
    borderColor: colors.gold,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  optionText: { fontSize: 15, color: colors.textSecondary, flex: 1 },

  // ── Trivia Results ───────────────────────────────────────────────
  resultsScrollContent: { alignItems: 'center', padding: 24, paddingBottom: 40 },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scorePercentage: { fontSize: 40, fontWeight: '800', color: '#fff', fontFamily: 'BebasNeue' },
  scoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  triviaResultTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, fontFamily: 'BebasNeue', letterSpacing: 2, marginBottom: 8 },
  pointsEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(207,184,124,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(207,184,124,0.2)',
  },
  pointsEarnedText: { fontSize: 15, color: colors.gold, fontWeight: '600' },
  triviaResultsList: { width: '100%', marginBottom: 8 },
  triviaResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resultDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triviaResultLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  triviaResultPoints: { fontSize: 14, fontWeight: '700' },
  playAgainBtn: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playAgainText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // ── Scratch Cards ────────────────────────────────────────────────
  scratchContent: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchInstructions: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardsRow: { flexDirection: 'row', gap: 16 },
  scratchCard: {
    width: (SCREEN_WIDTH - 96) / 3,
    height: ((SCREEN_WIDTH - 96) / 3) * 1.45,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scratchCardRevealed: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  shimmerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  scratchQuestionMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scratchQuestionText: { fontSize: 28, fontWeight: '800', color: '#fff', fontFamily: 'BebasNeue' },
  scratchPrompt: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  revealedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  revealedValue: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  scratchSummary: { alignItems: 'center', marginTop: 32 },
  scratchSummaryTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, fontFamily: 'BebasNeue', letterSpacing: 1 },
  scratchSummaryPoints: { fontSize: 16, color: colors.gold, fontWeight: '600', marginTop: 4 },
});
