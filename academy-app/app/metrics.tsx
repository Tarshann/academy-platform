import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

type MetricCategory = 'speed' | 'power' | 'agility' | 'endurance' | 'strength' | 'flexibility';

const METRIC_PRESETS: { name: string; category: MetricCategory; unit: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Vertical Jump', category: 'power', unit: 'inches', icon: 'arrow-up-outline' },
  { name: '40-Yard Dash', category: 'speed', unit: 'seconds', icon: 'speedometer-outline' },
  { name: 'Pro Agility (5-10-5)', category: 'agility', unit: 'seconds', icon: 'repeat-outline' },
  { name: 'Broad Jump', category: 'power', unit: 'inches', icon: 'resize-outline' },
  { name: 'Shuttle Run', category: 'agility', unit: 'seconds', icon: 'swap-horizontal-outline' },
  { name: 'Mile Run', category: 'endurance', unit: 'minutes', icon: 'timer-outline' },
  { name: 'Bench Press', category: 'strength', unit: 'lbs', icon: 'barbell-outline' },
  { name: 'Squat', category: 'strength', unit: 'lbs', icon: 'barbell-outline' },
  { name: 'Sprint Speed', category: 'speed', unit: 'mph', icon: 'flash-outline' },
  { name: 'Sit & Reach', category: 'flexibility', unit: 'inches', icon: 'body-outline' },
  { name: 'L-Drill', category: 'agility', unit: 'seconds', icon: 'git-branch-outline' },
  { name: 'Push-Ups (1 min)', category: 'endurance', unit: 'reps', icon: 'fitness-outline' },
];

const CATEGORY_COLORS: Record<MetricCategory, string> = {
  speed: '#3498db',
  power: '#e74c3c',
  agility: '#2ecc71',
  endurance: '#f39c12',
  strength: '#9b59b6',
  flexibility: '#1abc9c',
};

function getCategoryIcon(category: MetricCategory): keyof typeof Ionicons.glyphMap {
  const icons: Record<MetricCategory, keyof typeof Ionicons.glyphMap> = {
    speed: 'speedometer-outline',
    power: 'flash-outline',
    agility: 'repeat-outline',
    endurance: 'timer-outline',
    strength: 'barbell-outline',
    flexibility: 'body-outline',
  };
  return icons[category];
}

// Simple mini bar chart for trend visualization
function TrendBars({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <View style={styles.trendContainer}>
      {values.slice(-8).map((v, i) => {
        const height = 8 + ((v - min) / range) * 24;
        return (
          <View
            key={i}
            style={[
              styles.trendBar,
              {
                height,
                backgroundColor: i === values.length - 1 ? ACADEMY_GOLD : '#ddd',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// Record Metric Form
function RecordMetricForm({
  athleteId,
  onSuccess,
  onCancel,
}: {
  athleteId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState<typeof METRIC_PRESETS[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState<MetricCategory>('power');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const recordMutation = trpc.metrics.admin.record.useMutation({
    onSuccess: () => {
      trackEvent('metric_recorded', {
        metricName: selectedPreset?.name || customName,
        athleteId,
      });
      onSuccess();
    },
    onError: (err) => {
      Alert.alert('Error', err.message);
    },
  });

  const handleSubmit = () => {
    const metricName = isCustom ? customName.trim() : selectedPreset?.name;
    const unit = isCustom ? customUnit.trim() : selectedPreset?.unit;
    const category = isCustom ? customCategory : selectedPreset?.category;

    if (!metricName || !unit || !category || !value.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      Alert.alert('Invalid Value', 'Please enter a valid number.');
      return;
    }

    recordMutation.mutate({
      athleteId,
      metricName,
      category,
      value: numValue.toFixed(2),
      unit,
      notes: notes.trim() || undefined,
      sessionDate: new Date().toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formOverlay}
    >
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Record Metric</Text>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          {/* Toggle Custom */}
          <TouchableOpacity
            style={styles.customToggle}
            onPress={() => setIsCustom(!isCustom)}
          >
            <Text style={styles.customToggleText}>
              {isCustom ? 'Use Preset Metric' : 'Create Custom Metric'}
            </Text>
            <Ionicons
              name={isCustom ? 'list-outline' : 'create-outline'}
              size={16}
              color={ACADEMY_GOLD}
            />
          </TouchableOpacity>

          {!isCustom ? (
            /* Preset Grid */
            <View style={styles.presetGrid}>
              {METRIC_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={[
                    styles.presetChip,
                    selectedPreset?.name === preset.name && styles.presetChipActive,
                  ]}
                  onPress={() => setSelectedPreset(preset)}
                >
                  <Ionicons
                    name={preset.icon}
                    size={16}
                    color={selectedPreset?.name === preset.name ? '#fff' : NAVY}
                  />
                  <Text
                    style={[
                      styles.presetChipText,
                      selectedPreset?.name === preset.name && { color: '#fff' },
                    ]}
                  >
                    {preset.name}
                  </Text>
                  <Text
                    style={[
                      styles.presetUnitText,
                      selectedPreset?.name === preset.name && { color: 'rgba(255,255,255,0.7)' },
                    ]}
                  >
                    ({preset.unit})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Custom Fields */
            <View style={styles.customFields}>
              <TextInput
                style={styles.input}
                placeholder="Metric Name (e.g., Box Jump)"
                placeholderTextColor="#999"
                value={customName}
                onChangeText={setCustomName}
              />
              <TextInput
                style={styles.input}
                placeholder="Unit (e.g., inches, seconds, lbs)"
                placeholderTextColor="#999"
                value={customUnit}
                onChangeText={setCustomUnit}
              />
              <View style={styles.categoryRow}>
                {(Object.keys(CATEGORY_COLORS) as MetricCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: customCategory === cat ? CATEGORY_COLORS[cat] : '#f0f0f0',
                      },
                    ]}
                    onPress={() => setCustomCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        customCategory === cat && { color: '#fff' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Value Input */}
          <View style={styles.valueRow}>
            <TextInput
              style={[styles.input, styles.valueInput]}
              placeholder="Value"
              placeholderTextColor="#999"
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
            />
            <View style={styles.unitLabel}>
              <Text style={styles.unitLabelText}>
                {isCustom ? customUnit || 'unit' : selectedPreset?.unit || 'unit'}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes (optional)"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              recordMutation.isPending && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={recordMutation.isPending}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>
              {recordMutation.isPending ? 'Saving...' : 'Record Metric'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function MetricsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const me = trpc.auth.me.useQuery();
  const isAdmin = me.data?.role === 'admin';

  // For admin: show all metrics; for athletes: show own metrics
  const allMetrics = trpc.metrics.admin.list.useQuery(undefined, { enabled: isAdmin });
  const myMetrics = trpc.metrics.getByAthlete.useQuery(
    { athleteId: me.data?.id ?? 0 },
    { enabled: !!me.data?.id && !isAdmin }
  );

  const metrics = isAdmin ? allMetrics : myMetrics;

  // Group metrics by metric name, filtered by search query
  const groupedMetrics = useMemo(() => {
    if (!metrics.data) return new Map<string, any[]>();
    const query = searchQuery.toLowerCase().trim();
    const grouped = new Map<string, any[]>();
    for (const m of metrics.data) {
      // Filter by search query when present
      if (query && !m.metricName.toLowerCase().includes(query) &&
          !m.category.toLowerCase().includes(query)) {
        continue;
      }
      const key = m.metricName;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }
    return grouped;
  }, [metrics.data, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await metrics.refetch();
    setRefreshing(false);
  };

  const handleRecordSuccess = () => {
    setShowForm(false);
    metrics.refetch();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Athlete Metrics</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              setSelectedAthleteId(me.data?.id ?? null);
              setShowForm(true);
            }}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={24} color={ACADEMY_GOLD} />
          </TouchableOpacity>
        )}
        {!isAdmin && <View style={{ width: 40 }} />}
      </View>

      {/* Search (admin) */}
      {isAdmin && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athlete or metric..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Metric Categories Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendRow}>
        {(Object.entries(CATEGORY_COLORS) as [MetricCategory, string][]).map(([cat, color]) => (
          <View key={cat} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{cat}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Metrics List */}
      <FlatList
        data={Array.from(groupedMetrics.entries())}
        keyExtractor={([name]) => name}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !metrics.isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No metrics recorded</Text>
              <Text style={styles.emptySubtitle}>
                {isAdmin
                  ? 'Tap + to record athlete measurements'
                  : 'Your coach will add metrics after assessments'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: [metricName, entries] }) => {
          const latest = entries[0];
          const category = latest.category as MetricCategory;
          const values = [...entries].reverse().map((e: any) => parseFloat(e.value));

          return (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View
                  style={[
                    styles.metricIcon,
                    { backgroundColor: CATEGORY_COLORS[category] + '20' },
                  ]}
                >
                  <Ionicons
                    name={getCategoryIcon(category)}
                    size={18}
                    color={CATEGORY_COLORS[category]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metricName}>{metricName}</Text>
                  <Text style={styles.metricCategory}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
                <View style={styles.latestValue}>
                  <Text style={styles.latestValueText}>
                    {parseFloat(latest.value).toFixed(1)}
                  </Text>
                  <Text style={styles.latestUnitText}>{latest.unit}</Text>
                </View>
              </View>

              {/* Trend visualization */}
              {values.length > 1 && <TrendBars values={values} />}

              {/* Meta */}
              <View style={styles.metricMeta}>
                <Text style={styles.metricMetaText}>
                  {entries.length} recording{entries.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.metricMetaText}>
                  Last: {new Date(latest.sessionDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Record Form Modal */}
      {showForm && selectedAthleteId && (
        <RecordMetricForm
          athleteId={selectedAthleteId}
          onSuccess={handleRecordSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: NAVY },
  legendRow: { paddingHorizontal: 16, paddingVertical: 12, maxHeight: 50 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#888', textTransform: 'capitalize' },
  listContent: { padding: 16, paddingBottom: 100 },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricName: { fontSize: 15, fontWeight: '600', color: NAVY },
  metricCategory: { fontSize: 12, color: '#888', marginTop: 1 },
  latestValue: { alignItems: 'flex-end' },
  latestValueText: { fontSize: 22, fontWeight: '700', color: NAVY },
  latestUnitText: { fontSize: 11, color: '#888' },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: 48,
  },
  trendBar: { flex: 1, borderRadius: 3, minHeight: 4 },
  metricMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metricMetaText: { fontSize: 11, color: '#aaa' },
  // Form
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: NAVY },
  formScroll: { paddingHorizontal: 20 },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  customToggleText: { fontSize: 13, fontWeight: '600', color: ACADEMY_GOLD },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  presetChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  presetChipText: { fontSize: 13, fontWeight: '500', color: NAVY },
  presetUnitText: { fontSize: 11, color: '#999' },
  customFields: { gap: 10, marginBottom: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'capitalize' },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: NAVY,
  },
  valueRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  valueInput: { flex: 1 },
  unitLabel: {
    backgroundColor: '#f0e8d5',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  unitLabelText: { fontSize: 13, fontWeight: '600', color: NAVY },
  notesInput: { marginBottom: 16, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACADEMY_GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: NAVY },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 40 },
  skeletonBlock: { backgroundColor: '#e8e8e8', borderRadius: 6 },
});
