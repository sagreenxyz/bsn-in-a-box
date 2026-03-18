/**
 * retrievalScheduler.ts
 *
 * Implements the forgetting curve management system for BSN in a Box.
 * Based on Ebbinghaus's forgetting curve and modern spaced repetition research,
 * this module calculates retrieval due dates using an exponential spacing
 * algorithm and returns a prioritized daily study agenda.
 *
 * The spacing intervals (1, 3, 7, 14, 30 days) represent evidence-based
 * intervals at which reviewing material dramatically slows the rate of
 * forgetting. Each successful retrieval at the correct interval extends the
 * time before the next review is needed.
 */

import { getProgress, saveProgress, RETRIEVAL_INTERVALS_DAYS } from './progressStore.js';
import type { RetrievalEvent } from './progressStore.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** A prioritized retrieval agenda item for display on the dashboard. */
export interface RetrievalAgendaItem {
  /** The module to retrieve. */
  moduleId: string;
  /** Display title for the module (requires contentRegistry lookup by caller). */
  moduleTitle: string;
  /** The due date in ISO date format (YYYY-MM-DD). */
  dueDate: string;
  /** Days past due (0 = due today, positive = overdue, negative = future). */
  daysOverdue: number;
  /** Urgency classification for visual display. */
  urgency: 'overdue' | 'due-today' | 'due-this-week';
  /** Which interval this is (0–4), corresponding to RETRIEVAL_INTERVALS_DAYS. */
  intervalIndex: number;
  /** Previous retrieval score (0–100), null if this is the first retrieval. */
  previousScore: number | null;
}

/** The complete daily study agenda with priorities. */
export interface StudyAgenda {
  /** Modules with retrieval events overdue (past their due date). */
  overdue: RetrievalAgendaItem[];
  /** Modules with retrieval events due today. */
  dueToday: RetrievalAgendaItem[];
  /** Modules with retrieval events due within the next 7 days. */
  dueThisWeek: RetrievalAgendaItem[];
  /** Total count of items needing attention (overdue + due today). */
  urgentCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a prioritized daily study agenda from the student's retrieval queue.
 * Overdue retrievals are listed first, followed by today's due events, then
 * events due this week. New content is deferred when overdue retrievals exist —
 * consolidating prior learning takes priority over acquiring new information.
 *
 * @param moduleTitles - A map of moduleId to display title for agenda labeling.
 * @returns A StudyAgenda with items organized by urgency.
 */
export function buildStudyAgenda(moduleTitles: Record<string, string>): StudyAgenda {
  const state = getProgress();
  const today = getTodayString();
  const oneWeekFromNow = getDateString(7);

  const overdue: RetrievalAgendaItem[] = [];
  const dueToday: RetrievalAgendaItem[] = [];
  const dueThisWeek: RetrievalAgendaItem[] = [];

  for (const event of state.retrievalQueue) {
    if (event.completed) continue;
    if (event.dueDate > oneWeekFromNow) continue;

    const daysOverdue = daysBetween(event.dueDate, today);
    const item: RetrievalAgendaItem = {
      moduleId: event.moduleId,
      moduleTitle: moduleTitles[event.moduleId] ?? event.moduleId,
      dueDate: event.dueDate,
      daysOverdue,
      urgency:
        daysOverdue > 0
          ? 'overdue'
          : daysOverdue === 0
          ? 'due-today'
          : 'due-this-week',
      intervalIndex: event.intervalIndex,
      previousScore: event.score,
    };

    if (daysOverdue > 0) {
      overdue.push(item);
    } else if (daysOverdue === 0) {
      dueToday.push(item);
    } else {
      dueThisWeek.push(item);
    }
  }

  // Sort overdue by most overdue first.
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  // Sort due-today by module sequence (approximated by moduleId).
  dueToday.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  // Sort this-week by due date ascending.
  dueThisWeek.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    overdue,
    dueToday,
    dueThisWeek,
    urgentCount: overdue.length + dueToday.length,
  };
}

/**
 * Records the result of a retrieval quiz and schedules the next retrieval
 * event based on performance. If the student passed, the next interval is
 * scheduled. If they failed, the module's freshness is flagged for review
 * and the interval resets to the beginning.
 *
 * @param moduleId - The module for which retrieval was completed.
 * @param score - The retrieval quiz score (0–100).
 * @param passingThreshold - Minimum score to count as a successful retrieval.
 */
export function recordRetrievalResult(
  moduleId: string,
  score: number,
  passingThreshold: number = 76
): void {
  const state = getProgress();
  const now = new Date().toISOString();

  // Find the pending retrieval event for this module.
  const eventIndex = state.retrievalQueue.findIndex(
    (e) => e.moduleId === moduleId && !e.completed
  );

  if (eventIndex === -1) return;

  const event = state.retrievalQueue[eventIndex];
  event.completed = true;
  event.score = score;

  const passed = score >= passingThreshold;

  if (passed) {
    // Schedule the next retrieval at the next interval, if one exists.
    const nextIntervalIndex = event.intervalIndex + 1;
    if (nextIntervalIndex < RETRIEVAL_INTERVALS_DAYS.length) {
      const nextDays = RETRIEVAL_INTERVALS_DAYS[nextIntervalIndex];
      state.retrievalQueue.push({
        moduleId,
        dueDate: getDateString(nextDays),
        intervalIndex: nextIntervalIndex,
        completed: false,
        score: null,
      });
    }
    // Update module freshness.
    updateModuleFreshness(state, moduleId, 'fresh', now);
  } else {
    // Failed retrieval: reset to interval 0 (1 day from now).
    state.retrievalQueue.push({
      moduleId,
      dueDate: getDateString(1),
      intervalIndex: 0,
      completed: false,
      score: null,
    });
    // Flag module for review.
    updateModuleFreshness(state, moduleId, 'overdue', now);
  }

  saveProgress(state);
}

/**
 * Scans the retrieval queue and updates freshness flags for all modules
 * based on their current due date. Called on app initialization to ensure
 * the dashboard reflects current state.
 */
export function refreshFreshnessFlags(): void {
  const state = getProgress();
  const today = getTodayString();
  const updated = new Set<string>();

  for (const event of state.retrievalQueue) {
    if (event.completed || updated.has(event.moduleId)) continue;

    let freshness: 'fresh' | 'due' | 'overdue';
    const daysOverdue = daysBetween(event.dueDate, today);

    if (daysOverdue <= 0) {
      freshness = 'fresh';
    } else if (daysOverdue <= 3) {
      freshness = 'due';
    } else {
      freshness = 'overdue';
    }

    updateModuleFreshness(state, event.moduleId, freshness, null);
    updated.add(event.moduleId);
  }

  saveProgress(state);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the freshnessFlag on a module state, searching across all phases,
 * domains, and units.
 */
function updateModuleFreshness(
  state: ReturnType<typeof getProgress>,
  moduleId: string,
  freshness: 'fresh' | 'due' | 'overdue',
  retrievalTimestamp: string | null
): void {
  for (const phase of Object.values(state.phases)) {
    for (const domain of Object.values(phase.domains)) {
      for (const unit of Object.values(domain.units)) {
        if (unit.modules[moduleId]) {
          unit.modules[moduleId].freshnessFlag = freshness;
          if (retrievalTimestamp) {
            unit.modules[moduleId].lastRetrievalAt = retrievalTimestamp;
          }
          return;
        }
      }
    }
  }
}

/** @returns Today's date as a YYYY-MM-DD string. */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * @param daysFromNow - Number of days from today.
 * @returns A YYYY-MM-DD date string for that future date.
 */
export function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Calculates the number of days between two ISO date strings.
 * Positive values indicate that dateA is in the past relative to dateB.
 *
 * @param dateA - The earlier date (YYYY-MM-DD).
 * @param dateB - The reference date (YYYY-MM-DD), typically today.
 * @returns Number of days (positive = overdue, 0 = due today, negative = future).
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
