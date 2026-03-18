/**
 * progressStore.test.ts
 *
 * Unit tests for the progressStore module, covering:
 *   - First-launch default state initialization
 *   - Schema version mismatch handling
 *   - completeModule behavior
 *   - recordQuizAttempt gate logic (boundary conditions at 75% and 76%)
 *   - isPhaseUnlocked logic
 *   - isModuleUnlocked prerequisite checking
 *   - resetAllProgress safety mechanism
 *   - exportProgress / importProgress round-trip
 *   - evaluateCalibration overconfidence/underconfidence classification
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProgress,
  saveProgress,
  createInitialProgressState,
  completeModule,
  recordQuizAttempt,
  isPhaseUnlocked,
  isModuleUnlocked,
  resetAllProgress,
  exportProgress,
  importProgress,
  recordCalibration,
  evaluateCalibration,
  processRetrievalQueue,
  STORAGE_KEY,
  SCHEMA_VERSION,
  RESET_CONFIRMATION_TOKEN,
} from '../src/lib/progressStore';

// ─── Mock localStorage ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } });

beforeEach(() => {
  localStorageMock.clear();
});

// ─── getProgress ─────────────────────────────────────────────────────────────

describe('getProgress', () => {
  it('returns a fully initialized default state on first launch (empty localStorage)', () => {
    const state = getProgress();
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.phases['1'].unlocked).toBe(true);
    expect(state.phases['2'].unlocked).toBe(false);
    expect(state.phases['3'].unlocked).toBe(false);
    expect(state.phases['4'].unlocked).toBe(false);
    expect(state.retrievalQueue).toEqual([]);
    expect(state.calibrationHistory).toEqual([]);
  });

  it('returns a fresh state when localStorage contains invalid JSON', () => {
    localStorageMock.setItem(STORAGE_KEY, 'not-valid-json{{{');
    const state = getProgress();
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.phases['1'].unlocked).toBe(true);
  });

  it('returns a fresh state on schema version mismatch', () => {
    const badState = { schemaVersion: 999, phases: {} };
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(badState));
    const state = getProgress();
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Object.keys(state.phases)).toHaveLength(4);
  });

  it('restores a previously saved state correctly', () => {
    const initial = createInitialProgressState();
    initial.studyStreak.currentStreak = 5;
    saveProgress(initial);
    const restored = getProgress();
    expect(restored.studyStreak.currentStreak).toBe(5);
  });
});

// ─── completeModule ───────────────────────────────────────────────────────────

describe('completeModule', () => {
  it('marks a module as completed and records timestamp', () => {
    completeModule('p1-d1-u1-m01', ['ethics', 'communication'], '1', 'professional-identity', 'nursing-profession');
    const state = getProgress();
    const mod = state.phases['1'].domains['professional-identity'].units['nursing-profession'].modules['p1-d1-u1-m01'];
    expect(mod.status).toBe('completed');
    expect(mod.completedAt).not.toBeNull();
  });

  it('schedules a retrieval event after module completion', () => {
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    const state = getProgress();
    const retrieval = state.retrievalQueue.find((e) => e.moduleId === 'p1-d1-u1-m01');
    expect(retrieval).toBeDefined();
    expect(retrieval?.intervalIndex).toBe(0);
    expect(retrieval?.completed).toBe(false);
  });

  it('does not re-complete an already completed module', () => {
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    const firstState = getProgress();
    const firstTimestamp = firstState.phases['1'].domains['professional-identity'].units['nursing-profession'].modules['p1-d1-u1-m01'].completedAt;

    // Simulate time passing
    vi.useFakeTimers();
    vi.advanceTimersByTime(5000);
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    vi.useRealTimers();

    const secondState = getProgress();
    const secondTimestamp = secondState.phases['1'].domains['professional-identity'].units['nursing-profession'].modules['p1-d1-u1-m01'].completedAt;
    expect(firstTimestamp).toBe(secondTimestamp);
  });
});

// ─── recordQuizAttempt ────────────────────────────────────────────────────────

describe('recordQuizAttempt', () => {
  it('returns passed=true when score exactly equals threshold (76%)', () => {
    const result = recordQuizAttempt('unit-gate-1', 76, 'unit-gate', 76);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(76);
    expect(result.threshold).toBe(76);
  });

  it('returns passed=false when score is one point below threshold (75%)', () => {
    const result = recordQuizAttempt('unit-gate-1', 75, 'unit-gate', 76);
    expect(result.passed).toBe(false);
  });

  it('unlocks the next phase when a phase gateway is passed', () => {
    recordQuizAttempt('phase-1', 80, 'phase-gateway', 76);
    const state = getProgress();
    expect(state.phases['2'].unlocked).toBe(true);
  });

  it('does not unlock the next phase when a phase gateway is failed', () => {
    recordQuizAttempt('phase-1', 70, 'phase-gateway', 76);
    const state = getProgress();
    expect(state.phases['2'].unlocked).toBe(false);
  });

  it('returns remediation module IDs for concepts scoring below threshold', () => {
    const result = recordQuizAttempt('unit-gate-1', 60, 'unit-gate', 76, {
      'ethics': 50,
      'communication': 80,
    });
    expect(result.remediationModuleIds).toContain('ethics');
    expect(result.remediationModuleIds).not.toContain('communication');
  });
});

// ─── isPhaseUnlocked ──────────────────────────────────────────────────────────

describe('isPhaseUnlocked', () => {
  it('Phase 1 is always unlocked', () => {
    expect(isPhaseUnlocked(1)).toBe(true);
  });

  it('Phase 2 is locked by default', () => {
    expect(isPhaseUnlocked(2)).toBe(false);
  });

  it('Phase 2 unlocks after Phase 1 gateway is passed', () => {
    recordQuizAttempt('phase-1', 76, 'phase-gateway', 76);
    expect(isPhaseUnlocked(2)).toBe(true);
  });
});

// ─── isModuleUnlocked ─────────────────────────────────────────────────────────

describe('isModuleUnlocked', () => {
  it('a module with no prerequisites is always unlocked', () => {
    expect(isModuleUnlocked('p1-d1-u1-m01', [])).toBe(true);
  });

  it('a module with unmet prerequisites is locked', () => {
    expect(isModuleUnlocked('p1-d1-u1-m02', ['p1-d1-u1-m01'])).toBe(false);
  });

  it('a module unlocks when its prerequisite is completed', () => {
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    expect(isModuleUnlocked('p1-d1-u1-m02', ['p1-d1-u1-m01'])).toBe(true);
  });
});

// ─── resetAllProgress ─────────────────────────────────────────────────────────

describe('resetAllProgress', () => {
  it('returns false and does nothing with wrong token', () => {
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    const result = resetAllProgress('wrong-token');
    expect(result).toBe(false);
    const state = getProgress();
    expect(state.phases['1'].domains['professional-identity']).toBeDefined();
  });

  it('returns false with empty string', () => {
    expect(resetAllProgress('')).toBe(false);
  });

  it('resets all progress with the exact confirmation token', () => {
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    const result = resetAllProgress(RESET_CONFIRMATION_TOKEN);
    expect(result).toBe(true);
    const state = getProgress();
    expect(state.retrievalQueue).toHaveLength(0);
    expect(Object.keys(state.phases['1'].domains)).toHaveLength(0);
  });
});

// ─── exportProgress / importProgress ─────────────────────────────────────────

describe('exportProgress / importProgress', () => {
  it('round-trips state correctly through export and import', () => {
    completeModule('p1-d1-u1-m01', ['ethics'], '1', 'professional-identity', 'nursing-profession');
    const json = exportProgress();
    localStorageMock.clear();

    const result = importProgress(json);
    expect(result.success).toBe(true);

    const restored = getProgress();
    const mod = restored.phases['1']?.domains['professional-identity']?.units['nursing-profession']?.modules['p1-d1-u1-m01'];
    expect(mod?.status).toBe('completed');
  });

  it('rejects invalid JSON', () => {
    const result = importProgress('not json{{');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects JSON with wrong schema version', () => {
    const bad = JSON.stringify({ schemaVersion: 999, phases: {} });
    const result = importProgress(bad);
    expect(result.success).toBe(false);
  });
});

// ─── evaluateCalibration ──────────────────────────────────────────────────────

describe('evaluateCalibration', () => {
  it('classifies overconfident topics correctly', () => {
    recordCalibration('unit-1', { ethics: 4 }); // confidence 4 → predicted ~95%
    const result = evaluateCalibration('unit-1', { ethics: 50 }); // actual 50%
    expect(result.overconfidentTopics).toContain('ethics');
  });

  it('classifies underconfident topics correctly', () => {
    recordCalibration('unit-2', { communication: 1 }); // confidence 1 → predicted ~10%
    const result = evaluateCalibration('unit-2', { communication: 90 }); // actual 90%
    expect(result.underconfidentTopics).toContain('communication');
  });

  it('classifies accurately predicted topics correctly', () => {
    recordCalibration('unit-3', { safety: 3 }); // confidence 3 → predicted ~70%
    const result = evaluateCalibration('unit-3', { safety: 72 }); // actual 72%
    expect(result.accurateTopics).toContain('safety');
  });

  it('returns explanation prose when no calibration record exists', () => {
    const result = evaluateCalibration('nonexistent-unit', { ethics: 80 });
    expect(result.explanation.length).toBeGreaterThan(20);
    expect(result.calibrationAccuracy).toBe(0);
  });
});

// ─── processRetrievalQueue ────────────────────────────────────────────────────

describe('processRetrievalQueue', () => {
  it('returns empty array when no retrievals are due', () => {
    const state = createInitialProgressState();
    // Add a future retrieval event.
    state.retrievalQueue.push({
      moduleId: 'p1-d1-u1-m01',
      dueDate: '2099-01-01',
      intervalIndex: 0,
      completed: false,
      score: null,
    });
    saveProgress(state);
    const due = processRetrievalQueue();
    expect(due).toHaveLength(0);
  });

  it('returns events that are past due', () => {
    const state = createInitialProgressState();
    state.retrievalQueue.push({
      moduleId: 'p1-d1-u1-m01',
      dueDate: '2000-01-01', // far in the past
      intervalIndex: 0,
      completed: false,
      score: null,
    });
    saveProgress(state);
    const due = processRetrievalQueue();
    expect(due).toHaveLength(1);
    expect(due[0].moduleId).toBe('p1-d1-u1-m01');
  });

  it('does not return already-completed events', () => {
    const state = createInitialProgressState();
    state.retrievalQueue.push({
      moduleId: 'p1-d1-u1-m01',
      dueDate: '2000-01-01',
      intervalIndex: 0,
      completed: true,
      score: 85,
    });
    saveProgress(state);
    const due = processRetrievalQueue();
    expect(due).toHaveLength(0);
  });
});
