/**
 * FlashcardEngine.tsx
 *
 * A full spaced-repetition flashcard system implementing the SM-2 algorithm.
 * Cards are drawn from concept-tagged JSON decks. Students rate their recall
 * quality on a 0-5 scale (0=blackout, 5=perfect recall), and the next review
 * date is scheduled accordingly.
 *
 * State persistence: SM-2 card data (repetition count, ease factor, next review
 * date) is stored in progressStore under the flashcards key.
 *
 * Props:
 *   conceptFilter — optional concept tag to filter cards (undefined = all concepts)
 *   maxCardsPerSession — max cards to review per session (default 20)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getProgress, saveProgress } from '../../lib/progressStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  front: string;
  back: string;
  conceptTags: string[];
  source?: string; // module ID
}

interface SM2Data {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  nextDue: string; // ISO date
}

interface CardState extends Flashcard {
  sm2: SM2Data;
}

const DEFAULT_SM2: SM2Data = {
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
  nextDue: new Date().toISOString(),
};

// ─── SM-2 algorithm ───────────────────────────────────────────────────────────

function sm2Update(data: SM2Data, quality: number): SM2Data {
  // quality: 0-5 (0=blackout, 3=correct with difficulty, 5=perfect)
  let { repetitions, easeFactor, interval } = data;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + interval);

  return { repetitions, easeFactor, interval, nextDue: nextDue.toISOString() };
}

// ─── Sample cards (loaded from public data in production) ─────────────────────

const SAMPLE_CARDS: Flashcard[] = [
  {
    id: 'fc-001',
    front: 'What four elements of the nursing metaparadigm define the discipline of nursing?',
    back: 'Person, Health, Environment, and Nursing. These four concepts define nursing\'s unique perspective: the person who is receiving care, the health along a continuum from illness to wellness, the environment that affects the person, and nursing\'s unique body of knowledge and practice.',
    conceptTags: ['evidence-based-practice', 'health-promotion'],
    source: 'p1-d1-u1-m01',
  },
  {
    id: 'fc-002',
    front: 'What is the legal definition of "malpractice" and what four elements must be proven?',
    back: 'Malpractice is professional negligence — failure to meet the standard of care that causes harm. The four elements: (1) Duty: the nurse accepted responsibility for the patient. (2) Breach: the nurse\'s conduct fell below the standard of care. (3) Causation: the breach caused the harm. (4) Damages: actual measurable harm occurred. ALL four must be proven for liability to attach.',
    conceptTags: ['ethics', 'safety'],
    source: 'p1-d1-u3-m01',
  },
  {
    id: 'fc-003',
    front: 'What is orthostatic hypotension and what does it indicate?',
    back: 'Orthostatic (postural) hypotension is a drop of ≥20 mmHg systolic OR ≥10 mmHg diastolic blood pressure when moving from lying to sitting or standing. It indicates volume depletion (most common), autonomic dysfunction, or medication effect. The underlying mechanism: when upright, venous blood pools in the lower extremities; in hypovolemia, cardiac output cannot compensate, causing BP to fall.',
    conceptTags: ['perfusion', 'safety'],
    source: 'p1-d2-u1-m02',
  },
  {
    id: 'fc-004',
    front: 'A patient\'s serum potassium is 2.8 mEq/L. What are the FIRST three nursing actions?',
    back: '(1) Obtain an ECG immediately — hypokalemia causes flattened T waves, U waves, and increased arrhythmia risk (especially dangerous with digoxin). (2) Notify the provider with the value and ECG findings using SBAR. (3) Prepare potassium replacement as ordered — NEVER IV push; must be diluted and given via pump ≤20 mEq/hr peripheral, use central line for concentrations >40 mEq/L. Monitor cardiac rhythm continuously during replacement.',
    conceptTags: ['safety', 'perfusion'],
    source: 'p1-d2-u1-m02',
  },
  {
    id: 'fc-005',
    front: 'What is the Five Rights of Delegation and which right is most frequently violated?',
    back: 'Right Task, Right Circumstance, Right Person, Right Direction/Communication, Right Supervision/Evaluation. Most frequently violated: Right Person — selecting a UAP who has not demonstrated competency for the specific task, or delegating to someone who is not authorized by agency policy to perform it. Key principle: the nurse RETAINS accountability after delegation — the nurse is responsible for the outcome even though another person performed the task.',
    conceptTags: ['safety', 'leadership', 'collaboration'],
    source: 'p1-d1-u1-m02',
  },
  {
    id: 'fc-006',
    front: 'What is the PAINAD scale and when is it used?',
    back: 'Pain Assessment in Advanced Dementia — a validated behavioral pain assessment tool for patients who cannot self-report. Five behavioral indicators, each scored 0-2: (1) Breathing pattern, (2) Negative vocalization, (3) Facial expression, (4) Body language, (5) Consolability. Total 0-10. Scores: 1-3 = mild, 4-6 = moderate, 7-10 = severe. Used for patients with dementia, delirium, intubation, or any condition preventing reliable self-report.',
    conceptTags: ['pain', 'communication', 'cognition'],
    source: 'p1-d2-u1-m03',
  },
  {
    id: 'fc-007',
    front: 'What is the significance of a respiratory rate of 22/min in a patient whose baseline is 14-16?',
    back: 'Respiratory rate is the most sensitive early indicator of clinical deterioration. A rate of 22 (tachypnea) that represents an increase of 6-8 breaths/min from baseline should prompt immediate assessment. Common causes: sepsis, pulmonary embolism, heart failure, pneumonia, impending respiratory failure, pain, anxiety. The nurse must count RR for a FULL 60 seconds — the most commonly poorly measured vital sign. Do not estimate. Document the true count.',
    conceptTags: ['oxygenation', 'safety'],
    source: 'p1-d2-u1-m02',
  },
  {
    id: 'fc-008',
    front: 'A patient receiving vancomycin has a serum creatinine of 1.8, up from 0.9 on admission. What does this mean and what should the nurse do?',
    back: 'A creatinine increase of 0.9 mg/dL (doubling from baseline) meets criteria for Acute Kidney Injury (AKI) — a rise of ≥0.3 mg/dL in 48 hrs OR 1.5× baseline in 7 days. Vancomycin is nephrotoxic. Actions: (1) Hold next vancomycin dose and notify provider urgently. (2) Monitor hourly urine output — oliguria (<0.5 mL/kg/hr) confirms AKI. (3) Review ALL medications for nephrotoxicity. (4) Ensure adequate hydration. (5) Anticipate orders for renal dosing review of all medications. Pharmacist consultation.',
    conceptTags: ['safety', 'elimination'],
    source: 'p1-d3-u1-m01',
  },
];

// ─── Rating buttons ───────────────────────────────────────────────────────────

const QUALITY_RATINGS = [
  { value: 0, label: 'Blackout', sublabel: 'Complete blank', color: 'border-red-600 hover:bg-red-900/30' },
  { value: 1, label: 'Wrong', sublabel: 'Incorrect response', color: 'border-red-500 hover:bg-red-900/20' },
  { value: 2, label: 'Hard', sublabel: 'Correct after hint', color: 'border-orange-500 hover:bg-orange-900/20' },
  { value: 3, label: 'Good', sublabel: 'Correct with effort', color: 'border-yellow-500 hover:bg-yellow-900/20' },
  { value: 4, label: 'Easy', sublabel: 'Correct, slight hesitation', color: 'border-teal-500 hover:bg-teal-900/20' },
  { value: 5, label: 'Perfect', sublabel: 'Instant recall', color: 'border-green-500 hover:bg-green-900/20' },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface FlashcardEngineProps {
  conceptFilter?: string;
  maxCardsPerSession?: number;
}

export default function FlashcardEngine({
  conceptFilter,
  maxCardsPerSession = 20,
}: FlashcardEngineProps) {
  const [queue, setQueue] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, dueNow: 0 });

  useEffect(() => {
    // Build session queue from due cards
    const progress = getProgress();
    const cardSM2Data: Record<string, SM2Data> = (progress as any).flashcards ?? {};

    const now = new Date();
    const filtered = SAMPLE_CARDS.filter((c) =>
      conceptFilter ? c.conceptTags.includes(conceptFilter) : true
    );

    const withState: CardState[] = filtered.map((card) => ({
      ...card,
      sm2: cardSM2Data[card.id] ?? { ...DEFAULT_SM2 },
    }));

    const due = withState
      .filter((c) => new Date(c.sm2.nextDue) <= now)
      .slice(0, maxCardsPerSession);

    // If fewer due than max, add new cards (never studied)
    const newCards = withState
      .filter((c) => c.sm2.repetitions === 0 && !due.find((d) => d.id === c.id))
      .slice(0, maxCardsPerSession - due.length);

    const session = [...due, ...newCards];
    setQueue(session);
    setSessionStats({ reviewed: 0, dueNow: due.length });
  }, [conceptFilter, maxCardsPerSession]);

  const handleRating = useCallback((quality: number) => {
    const card = queue[currentIndex];
    if (!card) return;

    const newSM2 = sm2Update(card.sm2, quality);

    // Save to progressStore
    try {
      const progress = getProgress();
      if (!(progress as any).flashcards) (progress as any).flashcards = {};
      (progress as any).flashcards[card.id] = newSM2;
      saveProgress(progress);
    } catch (e) {
      console.warn('BSN: Could not save flashcard data:', e);
    }

    if (currentIndex < queue.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setSessionStats((s) => ({ ...s, reviewed: s.reviewed + 1 }));
    } else {
      setSessionComplete(true);
    }
  }, [queue, currentIndex]);

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSessionStats((s) => ({ ...s, reviewed: 0 }));
  };

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center">
        <p className="text-4xl mb-4" aria-hidden="true">🎉</p>
        <h2 className="font-display text-2xl font-bold text-white mb-2">You're all caught up!</h2>
        <p className="text-slate-400">No cards are due for review right now. Come back tomorrow to keep your retrieval practice current.</p>
        {conceptFilter && (
          <p className="mt-2 text-sm text-teal-400">Filtered to concept: <span className="font-semibold capitalize">{conceptFilter.replace(/-/g, ' ')}</span></p>
        )}
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center">
        <p className="text-4xl mb-4" aria-hidden="true">✓</p>
        <h2 className="font-display text-2xl font-bold text-teal-400 mb-2">Session Complete</h2>
        <p className="text-slate-300 mb-2">Reviewed {queue.length} card{queue.length !== 1 ? 's' : ''}.</p>
        <p className="text-sm text-slate-400 mb-6">Cards are scheduled for review based on your ratings. High-quality recalls are scheduled further out; items you struggled with will appear again soon.</p>
        <button onClick={restart} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">
          Review Again
        </button>
      </div>
    );
  }

  const currentCard = queue[currentIndex];
  if (!currentCard) return null;

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400">{currentIndex + 1} / {queue.length}</p>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-navy-700">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${((currentIndex) / queue.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex gap-1">
          {currentCard.conceptTags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-teal-500/20 px-2 py-0.5 text-xs text-teal-500 capitalize">
              {tag.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Card */}
      <div
        className={`relative min-h-48 cursor-pointer rounded-2xl border-2 p-8 transition-colors ${isFlipped ? 'border-teal-500 bg-teal-900/10' : 'border-navy-600 bg-navy-800 hover:border-navy-500'}`}
        onClick={() => setIsFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? setIsFlipped((f) => !f) : undefined}
        aria-label={isFlipped ? `Card back: ${currentCard.back}. Click to flip back.` : `Card front: ${currentCard.front}. Click to reveal answer.`}
      >
        {!isFlipped ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Question</p>
            <p className="text-lg leading-relaxed text-slate-100">{currentCard.front}</p>
            <p className="mt-4 text-xs text-slate-600">Tap to reveal answer</p>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-500">Answer</p>
            <p className="leading-relaxed text-slate-200">{currentCard.back}</p>
          </div>
        )}
      </div>

      {/* Rating buttons — only shown after flip */}
      {isFlipped && (
        <div className="mt-6">
          <p className="mb-3 text-center text-sm text-slate-400">How well did you recall this?</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUALITY_RATINGS.map(({ value, label, sublabel, color }) => (
              <button
                key={value}
                onClick={() => handleRating(value)}
                className={`rounded-xl border px-2 py-3 text-center transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${color}`}
                aria-label={`${label}: ${sublabel}`}
              >
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-slate-500 text-xs">{sublabel}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
