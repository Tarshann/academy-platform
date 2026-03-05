import * as StoreReview from 'expo-store-review';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  messageCount: 'rating_message_count',
  sessionCount: 'rating_session_count',
  lastPromptDate: 'rating_last_prompt',
  hasRated: 'rating_completed',
};

const MESSAGE_THRESHOLD = 5;
const SESSION_THRESHOLD = 3;
const COOLDOWN_DAYS = 30;

async function getInt(key: string): Promise<number> {
  const val = await SecureStore.getItemAsync(key);
  return val ? parseInt(val, 10) || 0 : 0;
}

async function setInt(key: string, val: number): Promise<void> {
  await SecureStore.setItemAsync(key, String(val));
}

/**
 * Check if the user has already completed a rating or is within the cooldown period.
 */
async function shouldSuppress(): Promise<boolean> {
  const hasRated = await SecureStore.getItemAsync(KEYS.hasRated);
  if (hasRated === 'true') return true;

  const lastPrompt = await SecureStore.getItemAsync(KEYS.lastPromptDate);
  if (lastPrompt) {
    const daysSince = (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60 * 24);
    if (daysSince < COOLDOWN_DAYS) return true;
  }

  return false;
}

async function tryShowPrompt(): Promise<boolean> {
  if (await shouldSuppress()) return false;

  const available = await StoreReview.isAvailableAsync();
  if (!available) return false;

  // Record that we prompted
  await SecureStore.setItemAsync(KEYS.lastPromptDate, String(Date.now()));

  await StoreReview.requestReview();
  return true;
}

/**
 * Call after the user sends a message (DM or chat).
 * Triggers rating prompt after MESSAGE_THRESHOLD messages.
 */
export async function trackMessageSent(): Promise<void> {
  try {
    const count = (await getInt(KEYS.messageCount)) + 1;
    await setInt(KEYS.messageCount, count);

    if (count === MESSAGE_THRESHOLD) {
      await tryShowPrompt();
    }
  } catch {
    // Silent — never interrupt the user's flow for rating tracking
  }
}

/**
 * Call when the user registers for a session/program.
 * Triggers rating prompt after SESSION_THRESHOLD registrations.
 */
export async function trackSessionRegistration(): Promise<void> {
  try {
    const count = (await getInt(KEYS.sessionCount)) + 1;
    await setInt(KEYS.sessionCount, count);

    if (count === SESSION_THRESHOLD) {
      await tryShowPrompt();
    }
  } catch {
    // Silent
  }
}

/**
 * Mark that the user has completed a review (call from a "rate us" button if you add one).
 */
export async function markRatingCompleted(): Promise<void> {
  await SecureStore.setItemAsync(KEYS.hasRated, 'true');
}
