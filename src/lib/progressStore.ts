/**
 * progressStore.ts
 *
 * The single source of truth for all student state in BSN in a Box.
 * All state is persisted exclusively in browser LocalStorage under the key
 * 'bsn_progress'. This module is designed with the same rigor as a production
 * relational database schema: typed, versioned, and migration-safe.
 *
 * Architecture principle: every function in this module that reads from
 * LocalStorage handles null, undefined, and schema-version mismatches
 * gracefully, returning a fully initialized default state rather than throwing.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** The LocalStorage key under which all progress data is persisted. */
export const STORAGE_KEY = 'bsn_progress';

/** Current schema version — increment when making breaking changes to types. */
export const SCHEMA_VERSION = 1;

/** Spaced retrieval intervals in days after module completion. */
export const RETRIEVAL_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

/** Default competency gate threshold (percentage). */
export const DEFAULT_GATE_THRESHOLD = 76;

/** Safety-critical gate threshold (percentage). */
export const SAFETY_GATE_THRESHOLD = 80;

/** Phase gateway thresholds. Phases 1–3 require 76%, Phase 4 requires 80%. */
export const PHASE_GATEWAY_THRESHOLDS: Record<number, number> = {
  1: 76,
  2: 76,
  3: 76,
  4: 80,
};

/** Confirmation token required for complete progress reset. */
export const RESET_CONFIRMATION_TOKEN = 'CONFIRMED_RESET';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Lifecycle status of a single learning module. */
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';

/** Knowledge freshness derived from spaced retrieval schedule. */
export type FreshnessFlag = 'fresh' | 'due' | 'overdue';

/** The student's preferred input mode for a lesson. */
export type LessonMode = 'read' | 'listen' | 'visual';

/** NGN item type categories for quiz engine routing. */
export type QuizType =
  | 'module-check'
  | 'unit-gate'
  | 'phase-gateway'
  | 'retrieval'
  | 'dosage';

/** Result of a quiz attempt, describing what state changed. */
export interface UnlockResult {
  /** Whether the gate threshold was met on this attempt. */
  passed: boolean;
  /** The score achieved (0–100). */
  score: number;
  /** The threshold that was required. */
  threshold: number;
  /** What was unlocked, if anything. */
  unlocked: string | null;
  /** Targeted remediation module IDs based on incorrect answers. */
  remediationModuleIds: string[];
}

/** Result of importing a progress JSON file. */
export interface ImportResult {
  /** Whether the import succeeded. */
  success: boolean;
  /** Human-readable description of what happened or what validation failed. */
  message: string;
  /** Individual validation errors, if any. */
  errors: string[];
}

/** Student's self-rated confidence before a unit. */
export interface ConfidenceRating {
  /** ISO timestamp when confidence was recorded. */
  recordedAt: string;
  /** Keyed by topic label, value 1–4 (know nothing, heard of it, understand it, could teach it). */
  ratings: Record<string, number>;
}

/** A map of topic labels to confidence ratings (1–4). */
export type ConfidenceMap = Record<string, number>;

/** A map of topic labels to actual quiz scores (0–100). */
export type ScoreMap = Record<string, number>;

/** Result of comparing confidence predictions to actual performance. */
export interface CalibrationResult {
  /** Topics where prediction was within ±10 points of actual. */
  accurateTopics: string[];
  /** Topics where confidence exceeded actual score by >10 points. */
  overconfidentTopics: string[];
  /** Topics where confidence was below actual score by >10 points. */
  underconfidentTopics: string[];
  /**
   * Prose explanation of the calibration pattern, written in plain clinical
   * English suitable for display directly to the student.
   */
  explanation: string;
  /** Running accuracy score: proportion of topics accurately predicted. */
  calibrationAccuracy: number;
}

/** A student's response to one elaborative interrogation prompt. */
export interface ElaborativeResponse {
  /** Index of the prompt within the module (0-based). */
  promptIndex: number;
  /** The student's free-text response. */
  response: string;
  /** Student's self-rating of response quality (1–5). */
  selfRating: number;
  /** ISO timestamp. */
  recordedAt: string;
}

/** A spaced retrieval event tied to a specific module. */
export interface RetrievalEvent {
  /** The module to be retrieved. */
  moduleId: string;
  /** ISO date on which this retrieval is due. */
  dueDate: string;
  /** Retrieval interval number (0–4, corresponding to RETRIEVAL_INTERVALS_DAYS). */
  intervalIndex: number;
  /** Whether this event has been completed. */
  completed: boolean;
  /** Score on the retrieval quiz (0–100), null if not yet attempted. */
  score: number | null;
}

/** A calibration record for a single unit. */
export interface CalibrationRecord {
  /** The unit this calibration applies to. */
  unitId: string;
  /** ISO timestamp when predictions were recorded. */
  predictedAt: string;
  /** The student's confidence predictions before the unit. */
  predictions: ConfidenceMap;
  /** Actual quiz scores after the unit, null until assessment completed. */
  actuals: ScoreMap | null;
  /** Calculated calibration result, null until actuals are available. */
  result: CalibrationResult | null;
}

/** A single entry in the reflective journal. */
export interface JournalEntry {
  /** The module this entry is associated with. */
  moduleId: string;
  /** Index of the elaborative prompt (0-based). */
  promptIndex: number;
  /** The student's free-text response. */
  response: string;
  /** Student's self-rating of response quality (1–5). */
  selfRating: number;
  /** ISO timestamp. */
  recordedAt: string;
  /**
   * The model expert answer shown after submission — stored so the student
   * can return to the journal and compare at any time.
   */
  modelAnswer: string;
}

/** A record of a student's clinical decision in a simulation scenario. */
export interface ClinicalLogEntry {
  /** The scenario ID this entry belongs to. */
  scenarioId: string;
  /** The patient this scenario features. */
  patientId: string;
  /** The node ID where this decision was made. */
  nodeId: string;
  /** The choice ID the student selected. */
  choiceId: string;
  /** Whether the choice was correct. */
  isCorrect: boolean;
  /** ISO timestamp. */
  recordedAt: string;
}

/** A nursing care plan created by the student using the diagnosis builder. */
export interface CarePlan {
  /** Unique identifier for this care plan. */
  id: string;
  /** The patient context (may be a longitudinal patient or hypothetical). */
  patientContext: string;
  /** NANDA diagnosis label. */
  diagnosisLabel: string;
  /** Related factors (etiology). */
  relatedFactors: string[];
  /** Defining characteristics (evidence). */
  definingCharacteristics: string[];
  /** NOC outcomes selected. */
  outcomes: string[];
  /** NIC interventions selected. */
  interventions: string[];
  /** ISO timestamp when plan was created. */
  createdAt: string;
  /** ISO timestamp when plan was last updated. */
  updatedAt: string;
}

/** Study streak tracking. */
export interface StreakState {
  /** Current consecutive study days. */
  currentStreak: number;
  /** Longest streak ever achieved. */
  longestStreak: number;
  /** ISO date of the most recent study day. */
  lastStudyDate: string | null;
  /** Array of ISO date strings for each day with study activity this week. */
  thisWeek: string[];
}

/** Persistent user preferences. */
export interface UserPreferences {
  /** Color scheme preference. */
  theme: 'dark' | 'light' | 'system';
  /** Font size multiplier (0.8 = smaller, 1.0 = default, 1.2 = larger). */
  fontScale: number;
  /** Preferred lesson input mode — applied globally as default. */
  defaultLessonMode: LessonMode;
  /** Whether the reading progress bar is shown in lessons. */
  showReadingProgress: boolean;
  /** Whether spaced retrieval reminders are shown on the dashboard. */
  showRetrievalReminders: boolean;
}

/** State tracking of a student's encounters with a longitudinal patient. */
export interface PatientEncounterState {
  /** The patient identifier. */
  patientId: string;
  /** Module IDs where this patient has been encountered. */
  encountersCompleted: string[];
  /**
   * The student's clinical decisions during productive failure encounters,
   * keyed by moduleId, stored as free-text decision description.
   */
  productiveFailureDecisions: Record<string, string>;
  /** The student's notes about this patient across all encounters. */
  notes: string;
}

/** Mastery level for a single core nursing concept. */
export interface ConceptMasteryState {
  /** The concept tag string. */
  concept: string;
  /**
   * Running weighted score across all assessments touching this concept (0–100).
   * Weighted by recency — more recent assessments count more.
   */
  masteryScore: number;
  /** ISO timestamp of most recent assessment touching this concept. */
  lastAssessedAt: string | null;
  /** Number of assessment items touching this concept completed. */
  itemsAttempted: number;
  /** Number of assessment items touching this concept answered correctly. */
  itemsCorrect: number;
}

/** State of a single learning module. */
export interface ModuleState {
  /** Current lifecycle status. */
  status: ModuleStatus;
  /** ISO timestamp when module was first opened, null if not started. */
  startedAt: string | null;
  /** ISO timestamp when module was marked complete, null if not completed. */
  completedAt: string | null;
  /** ISO timestamp of the most recent retrieval quiz attempt, null if none. */
  lastRetrievalAt: string | null;
  /** Score on the most recent retrieval quiz (0–100), null if none attempted. */
  retrievalScore: number | null;
  /** Current knowledge freshness based on spaced retrieval schedule. */
  freshnessFlag: FreshnessFlag;
  /**
   * The student's pre-instruction clinical decision from the productive failure
   * encounter. Null if productiveFailureEnabled is false for this module or if
   * the pre-instruction encounter has not yet occurred.
   */
  productiveFailureAttempt: string | null;
  /** All elaborative interrogation responses for this module. */
  elaborativeResponses: ElaborativeResponse[];
  /** The student's preferred input mode for this specific module. */
  modePreference: LessonMode | null;
}

/** State of a single unit within a domain. */
export interface UnitState {
  /** Whether this unit is accessible to the student. */
  unlocked: boolean;
  /** Whether all modules in this unit have been completed. */
  completed: boolean;
  /** Score on the unit gate exam (0–100), null if not yet attempted. */
  gateScore: number | null;
  /** Number of gate exam attempts. */
  gateAttempts: number;
  /**
   * The student's confidence self-ratings captured before the unit begins.
   * Used for metacognitive calibration comparison after assessment.
   */
  confidenceRating: ConfidenceRating | null;
  /** State of each module within this unit, keyed by moduleId. */
  modules: Record<string, ModuleState>;
}

/** State of a single domain within a phase. */
export interface DomainState {
  /** State of each unit within this domain, keyed by unitId. */
  units: Record<string, UnitState>;
}

/** State of a complete curriculum phase. */
export interface PhaseState {
  /** Whether this phase is accessible to the student. Phase 1 is always unlocked. */
  unlocked: boolean;
  /** Whether all content in this phase has been completed. */
  completed: boolean;
  /** Score on the phase gateway exam (0–100), null if not yet attempted. */
  gatewayScore: number | null;
  /** Number of gateway exam attempts. */
  gatewayAttempts: number;
  /** State of each domain within this phase, keyed by domainId. */
  domains: Record<string, DomainState>;
}

/** A summary of progress within a phase, used for dashboard display. */
export interface PhaseProgressSummary {
  phase: number;
  totalModules: number;
  completedModules: number;
  percentComplete: number;
  gatewayStatus: 'not_attempted' | 'failed' | 'passed';
  gatewayScore: number | null;
  /** Concept tags with the lowest mastery scores within this phase. */
  weakestConceptTags: string[];
}

/** The root state object — everything the system knows about the student. */
export interface ProgressState {
  /**
   * Schema version number. Checked on every read. If a mismatch is detected,
   * migration is attempted before falling back to a fresh initial state.
   */
  schemaVersion: number;
  /** State of each curriculum phase, keyed by phase number (1–4). */
  phases: Record<string, PhaseState>;
  /**
   * Concept mastery across the 35 core nursing concepts.
   * Keyed by concept tag string.
   */
  conceptMastery: Record<string, ConceptMasteryState>;
  /**
   * State of encounters with the six longitudinal patients.
   * Keyed by patient ID string.
   */
  longitudinalPatients: Record<string, PatientEncounterState>;
  /** Queue of scheduled spaced retrieval events. */
  retrievalQueue: RetrievalEvent[];
  /** History of metacognitive calibration records. */
  calibrationHistory: CalibrationRecord[];
  /** Reflective journal entries from elaborative interrogation prompts. */
  reflectiveJournal: JournalEntry[];
  /** Clinical decision log from simulation scenarios. */
  clinicalLog: ClinicalLogEntry[];
  /** Nursing care plans created by the student. */
  carePlans: CarePlan[];
  /** Study streak data. */
  studyStreak: StreakState;
  /** Persistent user preferences. */
  preferences: UserPreferences;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT STATE FACTORIES
// ─────────────────────────────────────────────────────────────────────────────

/** @returns A fresh, fully initialized ModuleState for a not-yet-started module. */
function createDefaultModuleState(): ModuleState {
  return {
    status: 'not_started',
    startedAt: null,
    completedAt: null,
    lastRetrievalAt: null,
    retrievalScore: null,
    freshnessFlag: 'fresh',
    productiveFailureAttempt: null,
    elaborativeResponses: [],
    modePreference: null,
  };
}

/** @returns A fresh UnitState with the given unlocked status. */
function createDefaultUnitState(unlocked: boolean): UnitState {
  return {
    unlocked,
    completed: false,
    gateScore: null,
    gateAttempts: 0,
    confidenceRating: null,
    modules: {},
  };
}

/** @returns A fresh DomainState. */
function createDefaultDomainState(): DomainState {
  return { units: {} };
}

/** @returns A fresh PhaseState. Phase 1 is always unlocked. */
function createDefaultPhaseState(phase: number): PhaseState {
  return {
    unlocked: phase === 1,
    completed: false,
    gatewayScore: null,
    gatewayAttempts: 0,
    domains: {},
  };
}

/** @returns A fresh ConceptMasteryState for a given concept. */
function createDefaultConceptMastery(concept: string): ConceptMasteryState {
  return {
    concept,
    masteryScore: 0,
    lastAssessedAt: null,
    itemsAttempted: 0,
    itemsCorrect: 0,
  };
}

/** @returns A fresh PatientEncounterState for a given patient. */
function createDefaultPatientEncounterState(patientId: string): PatientEncounterState {
  return {
    patientId,
    encountersCompleted: [],
    productiveFailureDecisions: {},
    notes: '',
  };
}

/** @returns The default user preferences. */
function createDefaultPreferences(): UserPreferences {
  return {
    theme: 'dark',
    fontScale: 1.0,
    defaultLessonMode: 'read',
    showReadingProgress: true,
    showRetrievalReminders: true,
  };
}

/** @returns A fully initialized ProgressState with no prior study history. */
export function createInitialProgressState(): ProgressState {
  return {
    schemaVersion: SCHEMA_VERSION,
    phases: {
      '1': createDefaultPhaseState(1),
      '2': createDefaultPhaseState(2),
      '3': createDefaultPhaseState(3),
      '4': createDefaultPhaseState(4),
    },
    conceptMastery: {},
    longitudinalPatients: {},
    retrievalQueue: [],
    calibrationHistory: [],
    reflectiveJournal: [],
    clinicalLog: [],
    carePlans: [],
    studyStreak: {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      thisWeek: [],
    },
    preferences: createDefaultPreferences(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE STORE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the student's progress from LocalStorage and returns a fully initialized
 * ProgressState. Safe to call on first launch — returns a fresh default state
 * when LocalStorage is empty. Handles schema version mismatches by returning a
 * fresh state rather than crashing.
 *
 * @returns The current ProgressState, always fully typed and never null.
 */
export function getProgress(): ProgressState {
  if (typeof window === 'undefined') {
    return createInitialProgressState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return createInitialProgressState();
    }

    const parsed = JSON.parse(raw) as Partial<ProgressState>;

    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      // Future migrations would be handled here before falling back.
      console.warn(
        `BSN progress schema version mismatch (stored: ${parsed.schemaVersion}, expected: ${SCHEMA_VERSION}). Returning fresh state.`
      );
      return createInitialProgressState();
    }

    // Merge stored state with defaults to handle newly added fields.
    return {
      ...createInitialProgressState(),
      ...parsed,
      preferences: {
        ...createDefaultPreferences(),
        ...(parsed.preferences ?? {}),
      },
    };
  } catch (error) {
    console.error('BSN: Failed to parse progress from LocalStorage:', error);
    return createInitialProgressState();
  }
}

/**
 * Persists the complete ProgressState to LocalStorage. Handles storage quota
 * exceptions gracefully by logging the error rather than crashing the application.
 *
 * @param state - The complete ProgressState to persist.
 */
export function saveProgress(state: ProgressState): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(
        'BSN: LocalStorage quota exceeded. Progress could not be saved. ' +
          'Consider exporting your progress and clearing old data in Settings.'
      );
    } else {
      console.error('BSN: Failed to save progress:', error);
    }
  }
}

/**
 * Marks a module as complete, records the completion timestamp, schedules the
 * first spaced retrieval event, updates concept mastery for all tags on that
 * module, and checks whether the parent unit is now fully complete.
 *
 * @param moduleId - The unique module slug to mark complete.
 * @param conceptTags - The concept tags from this module's frontmatter.
 * @param phaseId - The phase this module belongs to.
 * @param domainId - The domain this module belongs to.
 * @param unitId - The unit this module belongs to.
 */
export function completeModule(
  moduleId: string,
  conceptTags: string[],
  phaseId: string,
  domainId: string,
  unitId: string
): void {
  const state = getProgress();
  const now = new Date().toISOString();

  // Ensure the hierarchy exists.
  if (!state.phases[phaseId]) {
    state.phases[phaseId] = createDefaultPhaseState(parseInt(phaseId, 10));
  }
  if (!state.phases[phaseId].domains[domainId]) {
    state.phases[phaseId].domains[domainId] = createDefaultDomainState();
  }
  if (!state.phases[phaseId].domains[domainId].units[unitId]) {
    state.phases[phaseId].domains[domainId].units[unitId] = createDefaultUnitState(true);
  }
  if (!state.phases[phaseId].domains[domainId].units[unitId].modules[moduleId]) {
    state.phases[phaseId].domains[domainId].units[unitId].modules[moduleId] =
      createDefaultModuleState();
  }

  const moduleState =
    state.phases[phaseId].domains[domainId].units[unitId].modules[moduleId];

  // Only update if not already completed.
  if (moduleState.status !== 'completed') {
    moduleState.status = 'completed';
    moduleState.completedAt = now;
    if (!moduleState.startedAt) {
      moduleState.startedAt = now;
    }
    moduleState.freshnessFlag = 'fresh';

    // Schedule first retrieval event (due 1 day after completion).
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + RETRIEVAL_INTERVALS_DAYS[0]);
    state.retrievalQueue.push({
      moduleId,
      dueDate: dueDate.toISOString().split('T')[0],
      intervalIndex: 0,
      completed: false,
      score: null,
    });

    // Update concept mastery for all tags on this module.
    for (const tag of conceptTags) {
      if (!state.conceptMastery[tag]) {
        state.conceptMastery[tag] = createDefaultConceptMastery(tag);
      }
      state.conceptMastery[tag].lastAssessedAt = now;
    }

    // Update study streak.
    updateStudyStreak(state, now);
  }

  saveProgress(state);
}

/**
 * Updates the study streak based on today's activity.
 * Called whenever meaningful study activity occurs.
 */
function updateStudyStreak(state: ProgressState, isoTimestamp: string): void {
  const today = isoTimestamp.split('T')[0];
  const streak = state.studyStreak;

  if (streak.lastStudyDate === today) {
    return; // Already credited today.
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (streak.lastStudyDate === yesterdayStr) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastStudyDate = today;

  if (!streak.thisWeek.includes(today)) {
    streak.thisWeek.push(today);
    // Keep only the last 7 days.
    if (streak.thisWeek.length > 7) {
      streak.thisWeek.shift();
    }
  }
}

/**
 * Records a quiz attempt, determines whether the gate threshold was met,
 * triggers unlock if the threshold is met, and returns a typed result
 * describing what changed.
 *
 * @param examId - The module, unit, or phase identifier for this exam.
 * @param score - The score achieved (0–100).
 * @param type - The quiz type (module-check, unit-gate, phase-gateway, etc.).
 * @param threshold - The minimum passing score (default 76).
 * @param conceptScores - Optional breakdown of scores by concept tag for remediation.
 * @returns An UnlockResult describing the outcome.
 */
export function recordQuizAttempt(
  examId: string,
  score: number,
  type: QuizType,
  threshold: number = DEFAULT_GATE_THRESHOLD,
  conceptScores: ScoreMap = {}
): UnlockResult {
  const state = getProgress();
  const passed = score >= threshold;

  // Determine remediation targets from concept scores below threshold.
  const remediationModuleIds: string[] = Object.entries(conceptScores)
    .filter(([, conceptScore]) => conceptScore < threshold)
    .map(([concept]) => concept);

  // Update concept mastery scores.
  const now = new Date().toISOString();
  for (const [concept, conceptScore] of Object.entries(conceptScores)) {
    if (!state.conceptMastery[concept]) {
      state.conceptMastery[concept] = createDefaultConceptMastery(concept);
    }
    const mastery = state.conceptMastery[concept];
    mastery.itemsAttempted += 1;
    if (conceptScore >= threshold) mastery.itemsCorrect += 1;
    // Weighted running average: new score counts 30%, history 70%.
    mastery.masteryScore = Math.round(mastery.masteryScore * 0.7 + conceptScore * 0.3);
    mastery.lastAssessedAt = now;
  }

  // Handle phase gateway results.
  if (type === 'phase-gateway') {
    const phaseNum = parseInt(examId.replace('phase-', ''), 10);
    const phaseKey = String(phaseNum);
    if (state.phases[phaseKey]) {
      state.phases[phaseKey].gatewayAttempts += 1;
      if (passed) {
        state.phases[phaseKey].gatewayScore = score;
        state.phases[phaseKey].completed = true;
        // Unlock the next phase.
        const nextPhaseKey = String(phaseNum + 1);
        if (state.phases[nextPhaseKey]) {
          state.phases[nextPhaseKey].unlocked = true;
        }
      }
    }
  }

  saveProgress(state);

  return {
    passed,
    score,
    threshold,
    unlocked: passed ? examId : null,
    remediationModuleIds,
  };
}

/**
 * Determines whether a given phase is accessible to the student.
 * Phase 1 is always unlocked. Phases 2–4 require the prior phase's
 * gateway exam score to meet or exceed the phase's threshold.
 *
 * @param phase - The phase number (1–4).
 * @returns True if the phase is unlocked.
 */
export function isPhaseUnlocked(phase: 1 | 2 | 3 | 4): boolean {
  if (phase === 1) return true;

  const state = getProgress();
  const phaseKey = String(phase);
  return state.phases[phaseKey]?.unlocked === true;
}

/**
 * Determines whether a specific module is accessible to the student.
 * A module unlocks when all prerequisite moduleIds in the content registry
 * have been completed. The first module in Phase 1 has no prerequisites
 * and is always accessible.
 *
 * @param moduleId - The module slug to check.
 * @param prerequisiteIds - The prerequisite module IDs from the content registry.
 * @returns True if the module is unlocked.
 */
export function isModuleUnlocked(moduleId: string, prerequisiteIds: string[]): boolean {
  if (prerequisiteIds.length === 0) return true;

  const state = getProgress();

  return prerequisiteIds.every((prereqId) => {
    // Search for the prerequisite module across all phases, domains, and units.
    for (const phase of Object.values(state.phases)) {
      for (const domain of Object.values(phase.domains)) {
        for (const unit of Object.values(domain.units)) {
          if (unit.modules[prereqId]?.status === 'completed') {
            return true;
          }
        }
      }
    }
    return false;
  });
}

/**
 * Returns a progress summary for a single curriculum phase, used to populate
 * the dashboard phase cards and the NCLEX readiness meter.
 *
 * @param phase - The phase number (1–4).
 * @returns A PhaseProgressSummary with completion statistics.
 */
export function getPhaseProgress(phase: number): PhaseProgressSummary {
  const state = getProgress();
  const phaseKey = String(phase);
  const phaseState = state.phases[phaseKey];

  if (!phaseState) {
    return {
      phase,
      totalModules: 0,
      completedModules: 0,
      percentComplete: 0,
      gatewayStatus: 'not_attempted',
      gatewayScore: null,
      weakestConceptTags: [],
    };
  }

  let totalModules = 0;
  let completedModules = 0;

  for (const domain of Object.values(phaseState.domains)) {
    for (const unit of Object.values(domain.units)) {
      for (const moduleState of Object.values(unit.modules)) {
        totalModules += 1;
        if (moduleState.status === 'completed') completedModules += 1;
      }
    }
  }

  const percentComplete = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  let gatewayStatus: PhaseProgressSummary['gatewayStatus'] = 'not_attempted';
  if (phaseState.gatewayAttempts > 0) {
    const threshold = PHASE_GATEWAY_THRESHOLDS[phase] ?? 76;
    gatewayStatus =
      (phaseState.gatewayScore ?? 0) >= threshold ? 'passed' : 'failed';
  }

  // Find the weakest concept tags by mastery score.
  const weakestConceptTags = Object.values(state.conceptMastery)
    .filter((c) => c.itemsAttempted > 0)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map((c) => c.concept);

  return {
    phase,
    totalModules,
    completedModules,
    percentComplete,
    gatewayStatus,
    gatewayScore: phaseState.gatewayScore,
    weakestConceptTags,
  };
}

/**
 * Stores the student's pre-unit confidence predictions for later calibration
 * comparison. Called when the MetacognitionPanel is submitted before a unit begins.
 *
 * @param unitId - The unit identifier.
 * @param predictions - A map of topic labels to confidence ratings (1–4).
 */
export function recordCalibration(unitId: string, predictions: ConfidenceMap): void {
  const state = getProgress();
  const now = new Date().toISOString();

  // Replace any existing prediction for this unit (student may re-rate before starting).
  state.calibrationHistory = state.calibrationHistory.filter(
    (record) => record.unitId !== unitId || record.actuals !== null
  );

  state.calibrationHistory.push({
    unitId,
    predictedAt: now,
    predictions,
    actuals: null,
    result: null,
  });

  saveProgress(state);
}

/**
 * Compares the student's pre-unit confidence predictions to actual quiz performance,
 * classifies each topic as accurately predicted, overconfident, or underconfident,
 * and generates a prose explanation of the calibration result.
 *
 * @param unitId - The unit identifier.
 * @param scores - A map of topic labels to actual quiz scores (0–100).
 * @returns A CalibrationResult with classification and prose explanation.
 */
export function evaluateCalibration(unitId: string, scores: ScoreMap): CalibrationResult {
  const state = getProgress();

  // Find the most recent unresolved calibration record for this unit.
  const record = state.calibrationHistory
    .slice()
    .reverse()
    .find((r) => r.unitId === unitId && r.actuals === null);

  if (!record) {
    return {
      accurateTopics: [],
      overconfidentTopics: [],
      underconfidentTopics: [],
      explanation:
        'No confidence predictions were recorded before this unit, so calibration comparison is not available.',
      calibrationAccuracy: 0,
    };
  }

  const accurateTopics: string[] = [];
  const overconfidentTopics: string[] = [];
  const underconfidentTopics: string[] = [];

  // Convert confidence ratings (1–4) to a 0–100 scale for comparison:
  // 1 = ~10%, 2 = ~40%, 3 = ~70%, 4 = ~95%
  const confidenceToScore: Record<number, number> = { 1: 10, 2: 40, 3: 70, 4: 95 };

  for (const [topic, actual] of Object.entries(scores)) {
    const confidenceRating = record.predictions[topic];
    if (confidenceRating === undefined) continue;

    const predictedScore = confidenceToScore[confidenceRating] ?? 50;
    const gap = predictedScore - actual;

    if (Math.abs(gap) <= 15) {
      accurateTopics.push(topic);
    } else if (gap > 15) {
      overconfidentTopics.push(topic);
    } else {
      underconfidentTopics.push(topic);
    }
  }

  const totalTopics = accurateTopics.length + overconfidentTopics.length + underconfidentTopics.length;
  const calibrationAccuracy = totalTopics > 0 ? accurateTopics.length / totalTopics : 1;

  // Generate prose explanation.
  let explanation = '';

  if (overconfidentTopics.length === 0 && underconfidentTopics.length === 0) {
    explanation =
      'Your confidence predictions closely matched your actual quiz performance on this unit. ' +
      'This is a sign of strong metacognitive awareness — you have an accurate sense of what you know and what you still need to study. ' +
      'Students who can accurately predict their own knowledge gaps tend to allocate their study time more effectively and build more durable clinical judgment over time.';
  } else {
    if (overconfidentTopics.length > 0) {
      explanation +=
        `You rated your confidence higher than your quiz performance demonstrated on: ${overconfidentTopics.join(', ')}. ` +
        'This pattern of overconfidence is worth paying close attention to, not because it reflects a failure of effort, but because it creates a specific patient safety risk. ' +
        'When a nurse believes they understand something they do not fully understand, they are less likely to pause and verify their reasoning at the bedside. ' +
        'The remedy is not discouragement — it is targeted re-study of these topics with active self-testing rather than re-reading. ';
    }
    if (underconfidentTopics.length > 0) {
      explanation +=
        `Your actual performance exceeded your predicted confidence on: ${underconfidentTopics.join(', ')}. ` +
        'This underconfidence pattern is also clinically important: nurses who underestimate their knowledge may over-rely on others for decisions they are actually well-prepared to make independently. ' +
        'Your results suggest you have more capacity here than your self-assessment reflects. Trust your preparation on these topics.';
    }
  }

  // Save the result back to the calibration record.
  record.actuals = scores;
  record.result = {
    accurateTopics,
    overconfidentTopics,
    underconfidentTopics,
    explanation,
    calibrationAccuracy,
  };
  saveProgress(state);

  return record.result;
}

/**
 * Returns all retrieval events that are currently due or overdue based on
 * their scheduled due dates. Overdue events are returned first.
 *
 * @returns An array of RetrievalEvent objects that need the student's attention.
 */
export function processRetrievalQueue(): RetrievalEvent[] {
  const state = getProgress();
  const today = new Date().toISOString().split('T')[0];

  return state.retrievalQueue
    .filter((event) => !event.completed && event.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Records the student's response to one elaborative interrogation prompt
 * and saves it to both the module state and the reflective journal.
 *
 * @param moduleId - The module containing the prompt.
 * @param phaseId - The phase this module belongs to.
 * @param domainId - The domain this module belongs to.
 * @param unitId - The unit this module belongs to.
 * @param promptIndex - The 0-based index of the prompt within the module.
 * @param response - The student's free-text response.
 * @param selfRating - The student's self-rating of their response (1–5).
 * @param modelAnswer - The expert model answer shown after submission.
 */
export function recordElaborativeResponse(
  moduleId: string,
  phaseId: string,
  domainId: string,
  unitId: string,
  promptIndex: number,
  response: string,
  selfRating: number,
  modelAnswer: string
): void {
  const state = getProgress();
  const now = new Date().toISOString();

  // Ensure module state exists.
  if (!state.phases[phaseId]?.domains[domainId]?.units[unitId]?.modules[moduleId]) {
    return;
  }

  const elaborativeResponse: ElaborativeResponse = {
    promptIndex,
    response,
    selfRating,
    recordedAt: now,
  };

  const moduleState =
    state.phases[phaseId].domains[domainId].units[unitId].modules[moduleId];

  // Replace existing response for this prompt index if present.
  moduleState.elaborativeResponses = moduleState.elaborativeResponses.filter(
    (r) => r.promptIndex !== promptIndex
  );
  moduleState.elaborativeResponses.push(elaborativeResponse);

  // Add to reflective journal.
  state.reflectiveJournal = state.reflectiveJournal.filter(
    (entry) => !(entry.moduleId === moduleId && entry.promptIndex === promptIndex)
  );
  state.reflectiveJournal.push({
    moduleId,
    promptIndex,
    response,
    selfRating,
    recordedAt: now,
    modelAnswer,
  });

  saveProgress(state);
}

/**
 * Serializes the complete ProgressState as a formatted JSON string suitable
 * for download. Used by the Settings page export function.
 *
 * @returns A pretty-printed JSON string of the complete progress state.
 */
export function exportProgress(): string {
  const state = getProgress();
  return JSON.stringify(state, null, 2);
}

/**
 * Validates and imports a progress JSON string. Only writes to LocalStorage
 * if validation passes. Returns a typed result with success status and any
 * validation errors so the UI can give the student specific feedback.
 *
 * @param json - The JSON string to validate and import.
 * @returns An ImportResult with success flag and any error messages.
 */
export function importProgress(json: string): ImportResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      success: false,
      message: 'The file could not be parsed as valid JSON. Please verify the file was not corrupted during download.',
      errors: ['Invalid JSON syntax'],
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      message: 'The imported file does not contain a valid progress object.',
      errors: ['Root value is not an object'],
    };
  }

  const candidate = parsed as Record<string, unknown>;

  if (typeof candidate['schemaVersion'] !== 'number') {
    errors.push('Missing or invalid schemaVersion field');
  } else if (candidate['schemaVersion'] !== SCHEMA_VERSION) {
    errors.push(
      `Schema version mismatch: file contains version ${candidate['schemaVersion']}, expected ${SCHEMA_VERSION}`
    );
  }

  if (typeof candidate['phases'] !== 'object') {
    errors.push('Missing or invalid phases field');
  }

  if (errors.length > 0) {
    return {
      success: false,
      message: `The progress file could not be imported because it failed validation. ${errors.join('; ')}.`,
      errors,
    };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return {
      success: true,
      message: 'Your progress has been successfully imported. Your study history, completions, and preferences have been restored.',
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      message: 'The progress data was valid but could not be written to storage. Your storage may be full.',
      errors: [String(error)],
    };
  }
}

/**
 * Completely resets all student progress. Only executes if the confirmation
 * token exactly equals 'CONFIRMED_RESET'. Returns false and does nothing
 * otherwise. This is a safety mechanism to prevent accidental data loss.
 *
 * @param confirmationToken - Must exactly equal 'CONFIRMED_RESET' to proceed.
 * @returns True if the reset was performed, false if the token was incorrect.
 */
export function resetAllProgress(confirmationToken: string): boolean {
  if (confirmationToken !== RESET_CONFIRMATION_TOKEN) {
    return false;
  }

  if (typeof window === 'undefined') return false;

  const freshState = createInitialProgressState();
  saveProgress(freshState);
  return true;
}
