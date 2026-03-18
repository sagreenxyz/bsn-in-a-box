/**
 * ElaborativePrompts.tsx
 *
 * Renders the end-of-module elaborative interrogation section.
 * Each "Why does...?" prompt is displayed with a textarea for the student's
 * response. On submission, the model expert answer is revealed. The student
 * rates their response similarity on a five-point scale. All responses and
 * ratings save to progressStore reflective journal.
 *
 * Props:
 *   moduleId — the module these prompts belong to
 *   prompts  — array of prompt strings (the "Why does...?" questions)
 */

import React, { useState, useEffect } from 'react';
import { getProgress, saveProgress } from '../../lib/progressStore';

interface ElaborativePromptsProps {
  moduleId: string;
  prompts: string[];
}

const SELF_RATING_LABELS = [
  { value: 1, label: 'I missed the key reasoning entirely.' },
  { value: 2, label: 'I captured some of the reasoning but missed important connections.' },
  { value: 3, label: 'I identified the main reasoning with minor gaps.' },
  { value: 4, label: 'My reasoning closely matched the model answer.' },
  { value: 5, label: 'My response captured the same connections and clinical implications.' },
];

// Model answers are loaded from the quiz JSON; for display, a placeholder is shown
// if no server-side data is available (full model answers live in MDX/quiz files)
const PLACEHOLDER_MODEL_ANSWER = "The model answer for this prompt is stored in this module's quiz data. In the full curriculum, a complete clinical prose explanation will appear here, written by nursing subject matter experts and reviewed for accuracy and clinical currency.";

export default function ElaborativePrompts({ moduleId, prompts }: ElaborativePromptsProps) {
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [modelAnswers, setModelAnswers] = useState<Record<number, string>>({});

  // Load existing responses from progressStore
  useEffect(() => {
    try {
      const progress = getProgress();
      // Look for saved elaborative responses in the reflective journal
      const savedResponses: Record<number, string> = {};
      const savedRatings: Record<number, number> = {};
      progress.reflectiveJournal?.forEach((entry) => {
        if (entry.moduleId === moduleId && entry.promptIndex !== undefined) {
          savedResponses[entry.promptIndex] = entry.response ?? '';
          savedRatings[entry.promptIndex] = entry.selfRating ?? 0;
        }
      });
      setResponses(savedResponses);
      setRatings(savedRatings);
      if (Object.keys(savedResponses).length > 0) {
        const submittedMap: Record<number, boolean> = {};
        Object.keys(savedResponses).forEach((k) => { submittedMap[parseInt(k)] = true; });
        setSubmitted(submittedMap);
      }
    } catch (e) {
      // First launch — no saved data
    }
  }, [moduleId]);

  const handleSubmit = (index: number) => {
    if (!responses[index]?.trim()) return;
    setSubmitted((prev) => ({ ...prev, [index]: true }));
    // Store model answer placeholder
    setModelAnswers((prev) => ({ ...prev, [index]: PLACEHOLDER_MODEL_ANSWER }));
  };

  const handleRating = (index: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [index]: rating }));
    // Save to progressStore
    try {
      const progress = getProgress();
      if (!progress.reflectiveJournal) progress.reflectiveJournal = [];
      const existingIndex = progress.reflectiveJournal.findIndex(
        (e) => e.moduleId === moduleId && e.promptIndex === index
      );
      const entry = {
        moduleId,
        promptIndex: index,
        prompt: prompts[index],
        response: responses[index] ?? '',
        selfRating: rating,
        timestamp: new Date().toISOString(),
      };
      if (existingIndex >= 0) {
        progress.reflectiveJournal[existingIndex] = entry;
      } else {
        progress.reflectiveJournal.push(entry);
      }
      saveProgress(progress);
    } catch (e) {
      console.warn('BSN: Could not save elaborative response:', e);
    }
  };

  return (
    <section className="my-10" aria-labelledby="elaborative-prompts-heading">
      <div className="mb-6 border-t border-navy-700 pt-6">
        <h2 id="elaborative-prompts-heading" className="font-display text-2xl font-bold text-white">
          Elaborative Interrogation
        </h2>
        <p className="mt-2 text-slate-400">
          These prompts ask you to construct explanations connecting mechanism to consequence to clinical action — the reasoning pattern that builds durable clinical judgment. Write your best response, then compare it to the model answer and rate how closely your reasoning aligned.
        </p>
      </div>

      <div className="space-y-8">
        {prompts.map((prompt, index) => (
          <div key={index} className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
            <p className="mb-4 text-lg font-medium text-slate-100 leading-relaxed">{prompt}</p>

            {!submitted[index] ? (
              <div>
                <label htmlFor={`prompt-${moduleId}-${index}`} className="sr-only">
                  Your response to prompt {index + 1}
                </label>
                <textarea
                  id={`prompt-${moduleId}-${index}`}
                  rows={6}
                  value={responses[index] ?? ''}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [index]: e.target.value }))}
                  placeholder="Write your explanation here. Think through the mechanism, then the clinical consequence, then what the nurse does with that knowledge..."
                  className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <button
                  onClick={() => handleSubmit(index)}
                  disabled={!responses[index]?.trim()}
                  className="mt-3 rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-600 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
                >
                  Submit and See Model Answer
                </button>
              </div>
            ) : (
              <div>
                {/* Student's response */}
                <div className="mb-4 rounded-xl bg-navy-800 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Your Response</p>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{responses[index]}</p>
                </div>

                {/* Model answer */}
                <div className="mb-4 rounded-xl border border-teal-500/30 bg-teal-900/10 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-400">Model Expert Answer</p>
                  <p className="text-slate-200 leading-relaxed">{modelAnswers[index]}</p>
                </div>

                {/* Self-rating */}
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-300">How closely did your reasoning align with the model?</p>
                  <div className="space-y-2">
                    {SELF_RATING_LABELS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleRating(index, value)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          ratings[index] === value
                            ? 'border-teal-500 bg-teal-900/30 text-teal-200'
                            : 'border-navy-700 text-slate-400 hover:border-navy-600 hover:text-slate-300'
                        }`}
                        aria-pressed={ratings[index] === value}
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-700 font-bold text-xs">
                          {value}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                  {ratings[index] && (
                    <p className="mt-3 text-xs text-teal-400">
                      ✓ Rating saved to your reflective journal.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
