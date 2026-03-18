/**
 * KnowledgeCheck.tsx
 *
 * A lightweight inline quiz component for embedding 1-3 questions at
 * natural breakpoints within MDX lesson content. Uses a single question
 * from the module's quiz bank identified by questionIndex.
 *
 * Props:
 *   moduleId      — the module this check belongs to (used to load questions)
 *   questionIndex — which question from the module's quiz bank to show
 */

import React, { useState, useEffect } from 'react';
import type { Question } from './QuizEngine';

interface KnowledgeCheckProps {
  moduleId: string;
  questionIndex: number;
}

export default function KnowledgeCheck({ moduleId, questionIndex }: KnowledgeCheckProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestion() {
      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
        const response = await fetch(`${base}/data/quizzes/${moduleId}.json`);
        if (!response.ok) throw new Error(`Quiz not found for ${moduleId}`);
        const data = await response.json() as { questions: Question[] };
        const q = data.questions[questionIndex];
        if (!q) throw new Error(`Question index ${questionIndex} not found`);
        setQuestion(q);
      } catch (e) {
        // Silently fail — knowledge checks are supplementary
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    loadQuestion();
  }, [moduleId, questionIndex]);

  if (loading || !question || error) return null;

  const isMultipleResponse = question.type === 'multiple-response';

  const toggle = (optId: string) => {
    if (submitted) return;
    if (isMultipleResponse) {
      setSelected((prev) =>
        prev.includes(optId) ? prev.filter((a) => a !== optId) : [...prev, optId]
      );
    } else {
      setSelected([optId]);
    }
  };

  const handleSubmit = () => setSubmitted(true);

  const givenSorted = [...selected].sort();
  const expectedSorted = [...question.correctAnswers].sort();
  const isCorrect = JSON.stringify(givenSorted) === JSON.stringify(expectedSorted);

  return (
    <aside className="my-8 rounded-2xl border border-gold-400/30 bg-navy-800 p-6" aria-label="Knowledge check">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold-400">Knowledge Check</p>
      <p className="mb-4 leading-relaxed text-slate-200">{question.stem}</p>
      {isMultipleResponse && !submitted && (
        <p className="mb-3 text-xs text-slate-500">Select all that apply.</p>
      )}

      <div className="space-y-2">
        {question.options?.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrectOpt = question.correctAnswers.includes(opt.id);
          let cls = 'flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors min-h-[44px] text-sm ';
          if (submitted) {
            if (isCorrectOpt) cls += 'border-teal-500 bg-teal-900/30 text-teal-200 ';
            else if (isSelected && !isCorrectOpt) cls += 'border-crimson-500 bg-crimson-900/30 text-crimson-200 ';
            else cls += 'border-navy-700 text-slate-500 ';
          } else {
            cls += isSelected
              ? 'border-teal-500 bg-teal-900/20 text-teal-200 '
              : 'border-navy-700 text-slate-300 hover:border-teal-500/50 ';
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              disabled={submitted}
              className={cls + 'w-full text-left'}
              aria-pressed={isSelected}
            >
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-current text-xs">
                {submitted && isCorrectOpt ? '✓' : submitted && isSelected && !isCorrectOpt ? '✗' : ''}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="mt-4 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-40 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          Check Answer
        </button>
      )}

      {submitted && (
        <div className={`mt-4 rounded-xl p-4 text-sm ${isCorrect ? 'bg-teal-900/20 border border-teal-500/30' : 'bg-crimson-900/20 border border-crimson-500/30'}`}>
          <p className={`font-semibold mb-1 ${isCorrect ? 'text-teal-400' : 'text-crimson-400'}`}>
            {isCorrect ? 'Correct!' : 'Not quite — here is the explanation:'}
          </p>
          <p className="leading-relaxed text-slate-300">{question.rationale}</p>
        </div>
      )}
    </aside>
  );
}
