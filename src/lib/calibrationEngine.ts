/**
 * calibrationEngine.ts
 *
 * Implements the metacognitive calibration system for BSN in a Box.
 * Metacognitive calibration — the alignment between what a student believes
 * they know and what they actually know — is one of the strongest predictors
 * of clinical judgment quality. A nurse who thinks she knows drug interactions
 * she does not actually know is more dangerous than a nurse who knows she
 * doesn't know them and looks them up.
 *
 * This module compares confidence predictions (captured before each unit) to
 * actual quiz performance (captured after), classifies each topic as accurately
 * predicted, overconfident, or underconfident, and generates prose explanations
 * tailored to each pattern.
 */

import { getProgress, saveProgress, evaluateCalibration } from './progressStore.js';
import type { CalibrationResult, ConfidenceMap, ScoreMap } from './progressStore.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** A student's calibration accuracy over all units attempted. */
export interface RunningCalibrationScore {
  /**
   * Overall accuracy proportion (0–1): how often the student's confidence
   * predictions fell within ±15 points of their actual performance.
   */
  overallAccuracy: number;
  /** Number of units for which calibration data exists. */
  unitsEvaluated: number;
  /**
   * Trend: whether calibration accuracy is improving, declining, or stable
   * across the most recent three evaluated units.
   */
  trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
  /**
   * The concepts where overconfidence has appeared most frequently across
   * all units — these deserve the student's focused metacognitive attention.
   */
  persistentlyOverconfidentConcepts: string[];
  /**
   * The concepts where underconfidence appears most frequently — areas where
   * the student's self-perception lags behind their actual capability.
   */
  persistentlyUnderconfidentConcepts: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Processes the calibration result for a unit and returns both the individual
 * result and a summary of the student's running calibration accuracy.
 *
 * This is the primary entry point called after a unit assessment is scored.
 *
 * @param unitId - The unit identifier.
 * @param scores - Actual topic scores from the unit assessment (0–100 per topic).
 * @returns The CalibrationResult for this unit.
 */
export function processUnitCalibration(unitId: string, scores: ScoreMap): CalibrationResult {
  return evaluateCalibration(unitId, scores);
}

/**
 * Calculates the student's running calibration accuracy across all units
 * for which both predictions and actuals exist. Returns a comprehensive
 * summary including trend analysis and persistently miscalibrated concepts.
 *
 * @returns A RunningCalibrationScore reflecting the student's metacognitive trajectory.
 */
export function getRunningCalibrationScore(): RunningCalibrationScore {
  const state = getProgress();

  const completedCalibrations = state.calibrationHistory.filter(
    (record) => record.result !== null
  );

  if (completedCalibrations.length === 0) {
    return {
      overallAccuracy: 0,
      unitsEvaluated: 0,
      trend: 'insufficient-data',
      persistentlyOverconfidentConcepts: [],
      persistentlyUnderconfidentConcepts: [],
    };
  }

  // Calculate overall accuracy as mean of per-unit calibration accuracies.
  const accuracyValues = completedCalibrations.map(
    (r) => r.result?.calibrationAccuracy ?? 0
  );
  const overallAccuracy =
    accuracyValues.reduce((sum, v) => sum + v, 0) / accuracyValues.length;

  // Determine trend from the most recent three units.
  let trend: RunningCalibrationScore['trend'] = 'insufficient-data';
  if (accuracyValues.length >= 3) {
    const recent = accuracyValues.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const delta = last - first;
    if (delta > 0.05) trend = 'improving';
    else if (delta < -0.05) trend = 'declining';
    else trend = 'stable';
  }

  // Count overconfident and underconfident concept appearances.
  const overconfidentCounts: Record<string, number> = {};
  const underconfidentCounts: Record<string, number> = {};

  for (const record of completedCalibrations) {
    if (!record.result) continue;
    for (const concept of record.result.overconfidentTopics) {
      overconfidentCounts[concept] = (overconfidentCounts[concept] ?? 0) + 1;
    }
    for (const concept of record.result.underconfidentTopics) {
      underconfidentCounts[concept] = (underconfidentCounts[concept] ?? 0) + 1;
    }
  }

  const persistentlyOverconfidentConcepts = Object.entries(overconfidentCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([concept]) => concept);

  const persistentlyUnderconfidentConcepts = Object.entries(underconfidentCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([concept]) => concept);

  return {
    overallAccuracy,
    unitsEvaluated: completedCalibrations.length,
    trend,
    persistentlyOverconfidentConcepts,
    persistentlyUnderconfidentConcepts,
  };
}

/**
 * Generates a prose summary of the student's overall calibration trajectory,
 * suitable for display on the dashboard or progress page. The summary
 * acknowledges both strengths and growth areas honestly.
 *
 * @returns A prose string explaining the student's metacognitive trajectory.
 */
export function generateCalibrationNarrative(): string {
  const running = getRunningCalibrationScore();

  if (running.unitsEvaluated === 0) {
    return (
      'Your metacognitive calibration data will appear here once you have completed ' +
      'your first unit assessment. Before each unit begins, you will rate your confidence ' +
      'on each topic. After the assessment, the system compares your predictions to your ' +
      'actual performance. Over time, this comparison reveals patterns in how accurately ' +
      'you know what you know — a skill that is as important in nursing practice as any ' +
      'clinical fact.'
    );
  }

  const accuracyPercent = Math.round(running.overallAccuracy * 100);
  let narrative = `Across ${running.unitsEvaluated} unit${running.unitsEvaluated === 1 ? '' : 's'} evaluated, your confidence predictions have aligned with your actual performance ${accuracyPercent}% of the time. `;

  if (running.trend === 'improving') {
    narrative +=
      'The trend in your calibration accuracy is moving in a positive direction — your self-assessments are becoming more precise as you progress through the curriculum. This reflects growing metacognitive awareness, which is one of the hallmarks of expert clinical reasoning. ';
  } else if (running.trend === 'declining') {
    narrative +=
      'Your calibration accuracy has shown a slight decline over your most recent units. This is not unusual when moving into new, more complex content — the initial encounter with unfamiliar material often creates false confidence because the student does not yet know enough to recognize what they do not know. The remedy is intentional: before each unit, take the confidence rating seriously rather than defaulting to a comfortable middle rating. ';
  } else if (running.trend === 'stable') {
    narrative +=
      'Your calibration accuracy has been consistent across recent units. Consistency is a useful baseline, but growing clinical expertise should eventually show an upward trend as your self-knowledge deepens. ';
  }

  if (running.persistentlyOverconfidentConcepts.length > 0) {
    narrative +=
      `You have consistently overestimated your confidence on: ${running.persistentlyOverconfidentConcepts.join(', ')}. ` +
      'These are the areas where deliberate, active practice — not re-reading — will make the most difference. ';
  }

  if (running.persistentlyUnderconfidentConcepts.length > 0) {
    narrative +=
      `Your performance has consistently exceeded your self-predictions on: ${running.persistentlyUnderconfidentConcepts.join(', ')}. ` +
      'Trust your preparation more in these areas. ';
  }

  return narrative;
}
