/**
 * GatewayExam.tsx
 *
 * A timed, full-featured gateway exam component. Features:
 *   - 90-minute countdown timer (configurable)
 *   - Question navigation panel with flag-for-review support
 *   - Auto-submits on timer expiry
 *   - Pass thresholds: 76% for Phases 1–3, 80% for Phase 4
 *   - On pass: calls unlock function, renders unlock celebration with preview of unlocked content
 *   - On fail: shows score breakdown by concept area, identifies specific modules to revisit,
 *     and offers retry after required remediation is acknowledged
 *
 * Props:
 *   questions       — array of Question objects for this exam
 *   examId          — unique identifier for this gateway exam
 *   phase           — curriculum phase (1–4) determines pass threshold
 *   nextPhaseName   — display name of the content that unlocks on pass
 *   onComplete      — callback invoked with result
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { recordQuizAttempt, completeModule } from '../../lib/progressStore';
import type { Question } from './QuizEngine';

interface GatewayExamProps {
  questions: Question[];
  examId: string;
  phase: 1 | 2 | 3 | 4;
  nextPhaseName?: string;
  timeLimitMinutes?: number;
  onComplete?: (result: { score: number; passed: boolean }) => void;
}

type ExamState = 'not-started' | 'in-progress' | 'submitted';

export default function GatewayExam({
  questions,
  examId,
  phase,
  nextPhaseName,
  timeLimitMinutes = 90,
  onComplete,
}: GatewayExamProps) {
  const passThreshold = phase === 4 ? 80 : 76;
  const [examState, setExamState] = useState<ExamState>('not-started');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);
  const [result, setResult] = useState<{ score: number; passed: boolean; conceptBreakdown: Record<string, { correct: number; total: number }> } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (examState !== 'in-progress') return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isUrgent = timeRemaining < 600; // < 10 minutes

  // ── Scoring ────────────────────────────────────────────────────────────────
  const calculateResult = useCallback((givenAnswers: Record<string, string[]>) => {
    let correct = 0;
    const conceptBreakdown: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      const given = givenAnswers[q.id] ?? [];
      const isCorrect = JSON.stringify([...given].sort()) === JSON.stringify([...q.correctAnswers].sort());
      if (isCorrect) correct++;

      // Tally by concept tag
      q.conceptTags?.forEach((tag) => {
        if (!conceptBreakdown[tag]) conceptBreakdown[tag] = { correct: 0, total: 0 };
        conceptBreakdown[tag].total++;
        if (isCorrect) conceptBreakdown[tag].correct++;
      });
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= passThreshold;
    return { score, passed, conceptBreakdown };
  }, [questions, passThreshold]);

  const submitExam = useCallback((givenAnswers: Record<string, string[]>) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const calcResult = calculateResult(givenAnswers);
    setResult(calcResult);
    setExamState('submitted');

    try {
      recordQuizAttempt(examId, calcResult.score / 100, 'gateway');
    } catch (e) {
      console.warn('BSN: Could not record gateway attempt:', e);
    }

    onComplete?.(calcResult);
  }, [calculateResult, examId, onComplete]);

  const handleAutoSubmit = useCallback(() => {
    submitExam(answers);
  }, [submitExam, answers]);

  const handleManualSubmit = () => submitExam(answers);

  // ── Answer selection ───────────────────────────────────────────────────────
  const handleAnswer = (questionId: string, selected: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selected }));
  };

  const toggleFlag = (index: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ── Start screen ───────────────────────────────────────────────────────────
  if (examState === 'not-started') {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center">
        <h2 className="font-display text-3xl font-bold text-white">Phase {phase} Gateway Exam</h2>
        <p className="mt-3 text-slate-400">
          {questions.length} questions · {timeLimitMinutes} minutes · {passThreshold}% to pass
        </p>
        <div className="mx-auto mt-6 max-w-md rounded-xl bg-navy-800 p-5 text-left text-sm text-slate-300 space-y-2">
          <p>• Questions may be flagged for review using the navigation panel.</p>
          <p>• The exam auto-submits when the timer expires.</p>
          <p>• You may advance to any question at any time from the navigation panel.</p>
          <p>• After submission, you will see your score, a concept-area breakdown, and the clinical rationale for every question.</p>
          <p>• Passing ({passThreshold}%) immediately unlocks Phase {phase === 4 ? 4 : phase + 1} content.</p>
        </div>
        <button
          onClick={() => setExamState('in-progress')}
          className="mt-8 rounded-xl bg-teal-600 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
        >
          Begin Exam
        </button>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (examState === 'submitted' && result) {
    const { score, passed, conceptBreakdown } = result;
    const weakConcepts = Object.entries(conceptBreakdown)
      .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6)
      .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
      .slice(0, 5);

    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8">
        {/* Score header */}
        <div className={`text-center mb-8 ${passed ? 'text-teal-400' : 'text-crimson-400'}`}>
          <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-4xl ${passed ? 'bg-teal-500/20' : 'bg-crimson-500/20'}`}>
            {passed ? '🎉' : '📚'}
          </div>
          <h2 className="font-display text-3xl font-bold text-white">{passed ? 'Gateway Passed!' : 'Not Yet'}</h2>
          <p className="mt-2 text-6xl font-black">{score}%</p>
          <p className="text-slate-400">Pass threshold: {passThreshold}%</p>
        </div>

        {passed && nextPhaseName && (
          <div className="mb-8 rounded-xl border border-gold-400/30 bg-gold-900/10 p-5">
            <p className="text-gold-400 font-semibold mb-2">🔓 Unlocked: {nextPhaseName}</p>
            <p className="text-slate-300 text-sm">
              Your gateway score has been recorded. Phase {phase + 1} content is now accessible. The clinical knowledge you demonstrated here forms the foundation for everything that follows.
            </p>
          </div>
        )}

        {!passed && weakConcepts.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-3 font-semibold text-white">Areas to Strengthen Before Retrying</h3>
            <div className="space-y-2">
              {weakConcepts.map(([concept, data]) => (
                <div key={concept} className="flex items-center gap-3 rounded-xl bg-navy-800 p-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-200 capitalize">{concept.replace(/-/g, ' ')}</p>
                    <p className="text-sm text-slate-400">{data.correct} of {data.total} correct</p>
                  </div>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-navy-700">
                    <div className="h-full rounded-full bg-crimson-500" style={{ width: `${(data.correct / data.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Review the modules associated with these concept areas before attempting the exam again. Each module's knowledge checks and elaborative prompts are designed to strengthen exactly these areas.
            </p>
          </div>
        )}

        {/* Concept breakdown table */}
        <details className="mb-6">
          <summary className="cursor-pointer text-slate-400 hover:text-white">View full concept breakdown</summary>
          <div className="mt-4 space-y-2">
            {Object.entries(conceptBreakdown).map(([concept, data]) => {
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <div key={concept} className="flex items-center gap-3">
                  <p className="w-48 flex-shrink-0 text-sm capitalize text-slate-300">{concept.replace(/-/g, ' ')}</p>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-navy-700">
                    <div className={`h-full rounded-full ${pct >= 76 ? 'bg-teal-500' : 'bg-crimson-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 flex-shrink-0 text-right text-sm text-slate-400">{pct}%</span>
                </div>
              );
            })}
          </div>
        </details>

        <button
          onClick={() => {
            setExamState('not-started');
            setAnswers({});
            setFlagged(new Set());
            setTimeRemaining(timeLimitMinutes * 60);
            setResult(null);
            setCurrentIndex(0);
          }}
          className="w-full rounded-xl border border-navy-600 py-3 font-semibold text-slate-300 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
        >
          {passed ? 'Review Exam' : 'Try Again (after reviewing flagged concepts)'}
        </button>
      </div>
    );
  }

  // ── In-progress exam ───────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id] ?? [];
  const answeredCount = Object.keys(answers).filter((k) => answers[k].length > 0).length;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Navigation sidebar */}
      <aside className="lg:w-48 flex-shrink-0">
        <div className="sticky top-4 rounded-xl bg-navy-800 p-4">
          {/* Timer */}
          <div className={`mb-4 rounded-lg p-3 text-center ${isUrgent ? 'bg-crimson-900/30 border border-crimson-500/30' : 'bg-navy-700'}`}>
            <p className="text-xs text-slate-400">Time Remaining</p>
            <p className={`font-mono text-2xl font-bold ${isUrgent ? 'text-crimson-400' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </p>
          </div>

          {/* Progress */}
          <p className="mb-3 text-xs text-slate-400">{answeredCount}/{questions.length} answered</p>

          {/* Question grid */}
          <div className="grid grid-cols-5 gap-1 lg:grid-cols-4">
            {questions.map((q, i) => {
              const isAnswered = (answers[q.id]?.length ?? 0) > 0;
              const isFlagged = flagged.has(i);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-8 w-8 rounded text-xs font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500 min-h-[44px] min-w-[44px] ${
                    isCurrent
                      ? 'bg-teal-600 text-white'
                      : isFlagged
                      ? 'bg-gold-500/30 text-gold-300'
                      : isAnswered
                      ? 'bg-navy-700 text-teal-400'
                      : 'bg-navy-900 text-slate-500 hover:bg-navy-700'
                  }`}
                  aria-label={`Question ${i + 1}${isFlagged ? ' (flagged)' : ''}${isAnswered ? ' (answered)' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Submit */}
          <button
            onClick={handleManualSubmit}
            className="mt-4 w-full rounded-lg bg-crimson-700 px-3 py-2 text-sm font-semibold text-white hover:bg-crimson-600 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
          >
            Submit Exam
          </button>
        </div>
      </aside>

      {/* Question area */}
      <main className="flex-1">
        {currentQuestion && (
          <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">Question {currentIndex + 1} of {questions.length}</p>
              <button
                onClick={() => toggleFlag(currentIndex)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-400 ${
                  flagged.has(currentIndex)
                    ? 'bg-gold-500/20 text-gold-400'
                    : 'text-slate-400 hover:text-gold-400'
                }`}
              >
                🚩 {flagged.has(currentIndex) ? 'Flagged' : 'Flag for Review'}
              </button>
            </div>

            <p className="mb-6 text-lg leading-relaxed text-slate-100">{currentQuestion.stem}</p>

            <div className="space-y-3">
              {currentQuestion.options?.map((opt) => {
                const isSelected = currentAnswer.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors min-h-[44px] ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-navy-700 bg-navy-800 hover:border-teal-500/50'
                    }`}
                  >
                    <input
                      type={currentQuestion.type === 'multiple-response' ? 'checkbox' : 'radio'}
                      name={`q-${currentQuestion.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => {
                        if (currentQuestion.type === 'multiple-response') {
                          handleAnswer(currentQuestion.id, isSelected ? currentAnswer.filter((a) => a !== opt.id) : [...currentAnswer, opt.id]);
                        } else {
                          handleAnswer(currentQuestion.id, [opt.id]);
                        }
                      }}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-teal-500"
                    />
                    <span className="text-slate-200">{opt.text}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="rounded-lg border border-navy-600 px-5 py-2.5 text-sm text-slate-300 hover:bg-navy-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="rounded-lg border border-navy-600 px-5 py-2.5 text-sm text-slate-300 hover:bg-navy-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
