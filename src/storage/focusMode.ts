// src/storage/focusMode.ts
import { FocusModeState } from '../types';

const KEY = 'focustube_focus_mode';

const DEFAULT_STATE: FocusModeState = {
  active: false,
  topic: '',
  durationMs: 0,
  startTime: 0
};

/**
 * Get current Focus Mode state. Evaluates expiration.
 */
export async function getFocusState(): Promise<FocusModeState> {
  try {
    const data = await chrome.storage.local.get(KEY);
    const state: FocusModeState = data[KEY] || DEFAULT_STATE;

    if (state.active) {
      // Check for expiration if duration is not 0 (0 = indefinite)
      if (state.durationMs > 0 && Date.now() > state.startTime + state.durationMs) {
        state.active = false;
        await chrome.storage.local.set({ [KEY]: state });
      }
    }

    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Update Focus Mode state.
 */
export async function setFocusState(state: FocusModeState): Promise<void> {
  await chrome.storage.local.set({ [KEY]: state });
}
