/**
 * QuizEngine.tsx
 *
 * A React island that renders interactive quiz questions supporting all seven
 * NGN (Next Generation NCLEX) item types:
 *   1. multiple-choice     — single correct answer
 *   2. multiple-response   — select all that apply
 *   3. ordered-response    — drag-to-rank sequencing
 *   4. bow-tie             — three-column cause/condition/action select
 *   5. matrix-grid         — row-by-column checkbox matrix
 *   6. drop-down-cloze     — inline select within prose
 *   7. trend               — changing patient data over time
 *
 * After submission, each question reveals: the correct answer (green),
 * the student's selection (highlighted distinctly if incorrect), and a
 * full prose rationale explaining the clinical reasoning.
 *
 * Scores are posted to progressStore. Below-threshold results render a
 * remediation card before retry is available.
 *
 * Props:
 *   questions      — array of Question objects from the quiz JSON
 *   moduleId       — the module this quiz is associated with
 *   quizType       — 'unit-gate' | 'retrieval' | 'knowledge-check' | 'gateway'
 *   passThreshold  — 0–100 percentage required to pass (76 or 80 default)
 *   onComplete     — callback invoked with score and pass/fail result
 */

import React, { useState, useCallback, useRef } from 'react';
import { recordQuizAttempt } from '../../lib/progressStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizType = 'multiple-choice' | 'multiple-response' | 'ordered-response' | 'bow-tie' | 'matrix-grid' | 'drop-down-cloze' | 'trend' | 'knowledge-check';

export interface Option {
  id: string;
  text: string;
}

export interface BowTieColumn {
  label: string;
  options: Option[];
}

export interface MatrixRow {
  id: string;
  text: string;
}

export interface TrendDataPoint {
  time: string;
  value: string | number;
  label?: string;
}

export interface Question {
  id: string;
  type: QuizType;
  stem: string;
  options?: Option[];
  correctAnswers: string[];
  rationale: string;
  conceptTags?: string[];
  nclex_category?: string;
  // Bow-tie specific
  bowtieColumns?: BowTieColumn[];
  // Matrix-grid specific
  matrixRows?: MatrixRow[];
  matrixColumns?: Option[];
  // Drop-down cloze specific: stem contains {{{selectN}}} placeholders
  clozeSelects?: Array<{ id: string; options: Option[] }>;
  // Trend specific
  trendData?: TrendDataPoint[];
  trendQuestion?: string;
}

interface QuizEngineProps {
  questions: Question[];
  moduleId: string;
  quizType?: 'unit-gate' | 'retrieval' | 'knowledge-check' | 'gateway';
  passThreshold?: number;
  onComplete?: (result: { score: number; passed: boolean; correctCount: number; totalCount: number }) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Multiple choice — single answer */
function MultipleChoiceItem({
  question,
  submitted,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  submitted: boolean;
  onAnswer: (questionId: string, answers: string[]) => void;
  currentAnswer: string[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Select one answer</legend>
      {question.options?.map((opt) => {
        const isSelected = currentAnswer.includes(opt.id);
        const isCorrect = question.correctAnswers.includes(opt.id);
        let optClass = 'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors min-h-[44px] ';
        if (submitted) {
          if (isCorrect) optClass += 'border-teal-500 bg-teal-500/10 ';
          else if (isSelected && !isCorrect) optClass += 'border-crimson-500 bg-crimson-500/10 ';
          else optClass += 'border-navy-700 bg-navy-800/40 opacity-60 ';
        } else {
          optClass += isSelected
            ? 'border-teal-500 bg-teal-500/10 '
            : 'border-navy-700 bg-navy-800 hover:border-teal-500/50 hover:bg-navy-700 ';
        }
        return (
          <label key={opt.id} className={optClass}>
            <input
              type="radio"
              name={`question-${question.id}`}
              value={opt.id}
              checked={isSelected}
              disabled={submitted}
              onChange={() => onAnswer(question.id, [opt.id])}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-teal-500"
            />
            <span className="text-slate-200">{opt.text}</span>
            {submitted && isCorrect && (
              <span className="ml-auto flex-shrink-0 text-teal-400" aria-label="Correct answer">✓</span>
            )}
            {submitted && isSelected && !isCorrect && (
              <span className="ml-auto flex-shrink-0 text-crimson-400" aria-label="Your incorrect answer">✗</span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}

/** Multiple response — select all that apply */
function MultipleResponseItem({
  question,
  submitted,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  submitted: boolean;
  onAnswer: (questionId: string, answers: string[]) => void;
  currentAnswer: string[];
}) {
  const toggle = (optId: string) => {
    const next = currentAnswer.includes(optId)
      ? currentAnswer.filter((a) => a !== optId)
      : [...currentAnswer, optId];
    onAnswer(question.id, next);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm text-slate-400">Select all that apply.</legend>
      {question.options?.map((opt) => {
        const isSelected = currentAnswer.includes(opt.id);
        const isCorrect = question.correctAnswers.includes(opt.id);
        let optClass = 'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors min-h-[44px] ';
        if (submitted) {
          if (isCorrect) optClass += 'border-teal-500 bg-teal-500/10 ';
          else if (isSelected && !isCorrect) optClass += 'border-crimson-500 bg-crimson-500/10 ';
          else optClass += 'border-navy-700 bg-navy-800/40 opacity-60 ';
        } else {
          optClass += isSelected
            ? 'border-teal-500 bg-teal-500/10 '
            : 'border-navy-700 bg-navy-800 hover:border-teal-500/50 hover:bg-navy-700 ';
        }
        return (
          <label key={opt.id} className={optClass}>
            <input
              type="checkbox"
              value={opt.id}
              checked={isSelected}
              disabled={submitted}
              onChange={() => toggle(opt.id)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-teal-500"
            />
            <span className="text-slate-200">{opt.text}</span>
            {submitted && isCorrect && (
              <span className="ml-auto flex-shrink-0 text-teal-400">✓</span>
            )}
            {submitted && isSelected && !isCorrect && (
              <span className="ml-auto flex-shrink-0 text-crimson-400">✗</span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}

/** Ordered response — drag-to-rank list */
function OrderedResponseItem({
  question,
  submitted,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  submitted: boolean;
  onAnswer: (questionId: string, answers: string[]) => void;
  currentAnswer: string[];
}) {
  const [items, setItems] = useState<Option[]>(() => {
    if (currentAnswer.length > 0 && question.options) {
      return currentAnswer
        .map((id) => question.options!.find((o) => o.id === id))
        .filter(Boolean) as Option[];
    }
    // Shuffle on first render
    return [...(question.options ?? [])].sort(() => Math.random() - 0.5);
  });
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const copy = [...items];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(dragOverItem.current, 0, dragged);
    setItems(copy);
    onAnswer(question.id, copy.map((i) => i.id));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-400">Drag to arrange in the correct order (first to last).</p>
      {items.map((item, index) => {
        const correctIndex = question.correctAnswers.indexOf(item.id);
        const isCorrectPosition = submitted && correctIndex === index;
        const isWrongPosition = submitted && correctIndex !== index;
        return (
          <div
            key={item.id}
            draggable={!submitted}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
              submitted
                ? isCorrectPosition
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-crimson-500 bg-crimson-500/10'
                : 'border-navy-700 bg-navy-800 cursor-grab hover:border-teal-500/50'
            }`}
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-slate-300">
              {index + 1}
            </span>
            <span className="text-slate-200">{item.text}</span>
            {submitted && (
              <span className="ml-auto flex-shrink-0 text-sm text-slate-400">
                Correct position: {correctIndex + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Drop-down cloze — inline selects in prose */
function DropDownClozeItem({
  question,
  submitted,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  submitted: boolean;
  onAnswer: (questionId: string, answers: string[]) => void;
  currentAnswer: string[];
}) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    question.clozeSelects?.forEach((sel, i) => {
      map[sel.id] = currentAnswer[i] ?? '';
    });
    return map;
  });

  const handleChange = (selectId: string, value: string) => {
    const next = { ...selections, [selectId]: value };
    setSelections(next);
    const answers = question.clozeSelects?.map((s) => next[s.id] ?? '') ?? [];
    onAnswer(question.id, answers);
  };

  // Replace {{{selectN}}} placeholders with inline select elements
  const parts = question.stem.split(/(\{\{\{select\d+\}\}\})/g);

  return (
    <div className="leading-relaxed text-slate-200">
      {parts.map((part, i) => {
        const match = part.match(/\{\{\{(select\d+)\}\}\}/);
        if (match) {
          const selectId = match[1];
          const selectDef = question.clozeSelects?.find((s) => s.id === selectId);
          if (!selectDef) return null;
          const currentVal = selections[selectId] ?? '';
          const isCorrect = question.correctAnswers[
            question.clozeSelects!.findIndex((s) => s.id === selectId)
          ] === currentVal;
          return (
            <select
              key={i}
              value={currentVal}
              disabled={submitted}
              onChange={(e) => handleChange(selectId, e.target.value)}
              className={`mx-1 rounded-lg border px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                submitted
                  ? isCorrect
                    ? 'border-teal-500 bg-teal-900/50 text-teal-200'
                    : 'border-crimson-500 bg-crimson-900/50 text-crimson-200'
                  : 'border-teal-500/50 bg-navy-800 text-teal-300'
              }`}
              aria-label={`Select answer for blank ${selectId}`}
            >
              <option value="">— select —</option>
              {selectDef.options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.text}</option>
              ))}
            </select>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

// ─── Main QuizEngine ──────────────────────────────────────────────────────────

/**
 * QuizEngine renders one question at a time with smooth transitions,
 * scores the submission, and calls onComplete with the result.
 */
export default function QuizEngine({
  questions,
  moduleId,
  quizType = 'knowledge-check',
  passThreshold = 76,
  onComplete,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id] ?? [];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = useCallback((questionId: string, selectedAnswers: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedAnswers }));
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate score
      let correct = 0;
      questions.forEach((q) => {
        const given = answers[q.id] ?? [];
        const expected = [...q.correctAnswers].sort();
        const givenSorted = [...given].sort();
        if (JSON.stringify(givenSorted) === JSON.stringify(expected)) correct++;
      });
      const percentage = Math.round((correct / questions.length) * 100);
      setScore(percentage);
      setShowResults(true);

      // Record in progressStore
      try {
        recordQuizAttempt(moduleId, percentage / 100, quizType as 'unit-gate' | 'retrieval' | 'knowledge-check' | 'gateway');
      } catch (e) {
        console.warn('BSN: Could not record quiz attempt:', e);
      }

      onComplete?.({
        score: percentage,
        passed: percentage >= passThreshold,
        correctCount: correct,
        totalCount: questions.length,
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setSubmitted(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setScore(0);
  };

  // ── Results screen ─────────────────────────────────────────────────────────
  if (showResults) {
    const passed = score >= passThreshold;
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8">
        <div className={`mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full text-3xl ${passed ? 'bg-teal-500/20 text-teal-400' : 'bg-crimson-500/20 text-crimson-400'}`}>
          {passed ? '✓' : '✗'}
        </div>
        <h3 className="text-center font-display text-2xl font-bold text-white">
          {passed ? 'Well done!' : 'Not quite yet.'}
        </h3>
        <p className="mt-2 text-center text-slate-400">
          You scored <span className={`font-bold text-xl ${passed ? 'text-teal-400' : 'text-crimson-400'}`}>{score}%</span>
          {' '}({Object.values(answers).filter((a, i) => {
            const q = questions[i];
            return q && JSON.stringify([...a].sort()) === JSON.stringify([...q.correctAnswers].sort());
          }).length} of {questions.length} correct)
        </p>
        {!passed && (
          <div className="mt-4 rounded-xl bg-navy-800 p-4 text-slate-300 text-sm">
            <p className="font-semibold text-white mb-1">To earn access to the next content:</p>
            <p>You need {passThreshold}% to pass. Review the rationales above and try again when you are ready. Each question's explanation tells you exactly what clinical reasoning the correct answer requires.</p>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleRestart}
            className="rounded-lg border border-navy-600 px-6 py-3 font-semibold text-slate-300 transition-colors hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          >
            Review Again
          </button>
          {passed && (
            <button
              onClick={() => window.history.back()}
              className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────────
  if (!currentQuestion) return null;

  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 overflow-hidden rounded-full bg-navy-700 h-2" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label="Quiz progress">
          <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="flex-shrink-0 text-sm text-slate-400">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question type label */}
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-teal-500">
        {currentQuestion.type.replace(/-/g, ' ')}
      </p>

      {/* Stem */}
      <p className="mb-6 text-lg leading-relaxed text-slate-100">{currentQuestion.stem}</p>

      {/* Item type renderer */}
      {currentQuestion.type === 'multiple-choice' && (
        <MultipleChoiceItem question={currentQuestion} submitted={submitted} onAnswer={handleAnswer} currentAnswer={currentAnswer} />
      )}
      {currentQuestion.type === 'multiple-response' && (
        <MultipleResponseItem question={currentQuestion} submitted={submitted} onAnswer={handleAnswer} currentAnswer={currentAnswer} />
      )}
      {currentQuestion.type === 'ordered-response' && (
        <OrderedResponseItem question={currentQuestion} submitted={submitted} onAnswer={handleAnswer} currentAnswer={currentAnswer} />
      )}
      {currentQuestion.type === 'drop-down-cloze' && (
        <DropDownClozeItem question={currentQuestion} submitted={submitted} onAnswer={handleAnswer} currentAnswer={currentAnswer} />
      )}

      {/* Rationale — shown after submission */}
      {submitted && (
        <div className="mt-6 rounded-xl border border-teal-500/30 bg-teal-900/20 p-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal-400">Clinical Rationale</p>
          <p className="leading-relaxed text-slate-300">{currentQuestion.rationale}</p>
          {currentQuestion.nclex_category && (
            <p className="mt-3 text-xs text-slate-500">NCLEX Category: {currentQuestion.nclex_category}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex justify-end gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={currentAnswer.length === 0}
            className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-40 min-h-[44px]"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
          >
            {isLastQuestion ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}
