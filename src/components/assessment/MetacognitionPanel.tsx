/**
 * MetacognitionPanel.tsx
 *
 * Appears before every unit begins. Collects confidence predictions per topic
 * on a four-point scale, then — after the unit assessment — renders the
 * CalibrationResult from calibrationEngine.ts as prose explanation.
 *
 * The four-point confidence scale:
 *   1 — I know nothing about this
 *   2 — I have heard of this
 *   3 — I understand this
 *   4 — I could teach this
 *
 * Props:
 *   unitId    — the unit this panel belongs to
 *   topics    — array of topic strings drawn from the unit's module titles
 *   mode      — 'pre' (before) | 'post' (after assessment, shows calibration result)
 *   scores    — (post mode only) actual unit assessment scores per topic
 */

import React, { useState, useCallback } from 'react';
import { recordCalibration, evaluateCalibration } from '../../lib/progressStore';
import type { CalibrationResult, ConfidenceMap, ScoreMap } from '../../lib/progressStore';

interface MetacognitionPanelProps {
  unitId: string;
  topics: string[];
  mode: 'pre' | 'post';
  scores?: ScoreMap;
  onPreSubmit?: (predictions: ConfidenceMap) => void;
}

const CONFIDENCE_LABELS = [
  { value: 1, label: 'I know nothing about this', color: 'text-slate-400' },
  { value: 2, label: 'I have heard of this', color: 'text-yellow-400' },
  { value: 3, label: 'I understand this', color: 'text-teal-400' },
  { value: 4, label: 'I could teach this', color: 'text-gold-400' },
];

export default function MetacognitionPanel({ unitId, topics, mode, scores, onPreSubmit }: MetacognitionPanelProps) {
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);

  const allAnswered = topics.every((t) => predictions[t] !== undefined);

  const handlePreSubmit = useCallback(() => {
    if (!allAnswered) return;
    const predMap: ConfidenceMap = {};
    topics.forEach((t) => { predMap[t] = predictions[t] as 1 | 2 | 3 | 4; });

    try {
      recordCalibration(unitId, predMap);
    } catch (e) {
      console.warn('BSN: Could not record calibration:', e);
    }

    setSubmitted(true);
    onPreSubmit?.(predMap);
  }, [allAnswered, predictions, topics, unitId, onPreSubmit]);

  const handlePostEvaluate = useCallback(() => {
    if (!scores) return;
    try {
      const result = evaluateCalibration(unitId, scores);
      setCalibrationResult(result);
    } catch (e) {
      console.warn('BSN: Could not evaluate calibration:', e);
    }
  }, [unitId, scores]);

  // ── Pre-unit mode ──────────────────────────────────────────────────────────
  if (mode === 'pre') {
    if (submitted) {
      return (
        <div className="rounded-2xl border border-teal-500/30 bg-teal-900/10 p-6">
          <p className="text-teal-400 font-semibold mb-2">✓ Confidence ratings recorded</p>
          <p className="text-slate-300 text-sm">
            Your predictions have been saved. After you complete the unit assessment, this panel will show you how your confidence compared to your actual performance — one of the most powerful self-regulated learning tools available to you.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
        <h3 className="font-display text-xl font-bold text-white mb-2">Before You Begin</h3>
        <p className="text-slate-300 mb-6 text-sm leading-relaxed">
          Rate your current confidence with each topic in this unit using the four-point scale below. There are no right answers — honest self-assessment is the goal. Your predictions will be compared to your actual assessment performance afterward, helping you identify patterns in your self-awareness.
        </p>

        <div className="space-y-6">
          {topics.map((topic) => (
            <div key={topic}>
              <p className="mb-2 font-medium text-slate-200">{topic}</p>
              <div className="flex flex-wrap gap-2">
                {CONFIDENCE_LABELS.map(({ value, label, color }) => {
                  const isSelected = predictions[topic] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setPredictions((p) => ({ ...p, [topic]: value }))}
                      className={`rounded-xl border px-4 py-2 text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-900/40 text-teal-200'
                          : 'border-navy-700 bg-navy-800 text-slate-400 hover:border-navy-600 hover:text-slate-300'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="font-bold">{value}</span>
                      <span className="ml-2 hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>
              {predictions[topic] && (
                <p className={`mt-1 text-xs ${CONFIDENCE_LABELS[predictions[topic] - 1]?.color}`}>
                  {CONFIDENCE_LABELS[predictions[topic] - 1]?.label}
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handlePreSubmit}
          disabled={!allAnswered}
          className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
        >
          Save Predictions and Begin Unit →
        </button>
      </div>
    );
  }

  // ── Post-unit mode ─────────────────────────────────────────────────────────
  if (!calibrationResult) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
        <h3 className="font-display text-xl font-bold text-white mb-2">Review Your Calibration</h3>
        <p className="text-slate-300 mb-6 text-sm">
          Now that you have completed the unit assessment, you can see how your pre-unit confidence predictions compared to your actual performance.
        </p>
        <button
          onClick={handlePostEvaluate}
          className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
        >
          See My Calibration Results →
        </button>
      </div>
    );
  }

  const { calibrationAccuracy, overconfidentTopics, underconfidentTopics, accurateTopics, explanation } = calibrationResult;

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h3 className="font-display text-xl font-bold text-white mb-2">Your Calibration Results</h3>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-800 text-2xl font-black text-teal-400">
          {Math.round(calibrationAccuracy * 100)}%
        </div>
        <div>
          <p className="font-semibold text-white">Calibration Accuracy</p>
          <p className="text-sm text-slate-400">How accurately your confidence predicted your performance</p>
        </div>
      </div>

      {/* Prose explanation */}
      <div className="mb-6 rounded-xl bg-navy-800 p-5">
        <p className="leading-relaxed text-slate-200">{explanation}</p>
      </div>

      {/* Category breakdowns */}
      {overconfidentTopics.length > 0 && (
        <div className="mb-4 rounded-xl border border-crimson-500/20 bg-crimson-900/10 p-4">
          <p className="font-semibold text-crimson-400 mb-2">Topics Where You Were Overconfident</p>
          <ul className="space-y-1">
            {overconfidentTopics.map((topic) => (
              <li key={topic} className="text-sm text-slate-300">
                <span className="font-medium">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {underconfidentTopics.length > 0 && (
        <div className="mb-4 rounded-xl border border-teal-500/20 bg-teal-900/10 p-4">
          <p className="font-semibold text-teal-400 mb-2">Topics Where You Underestimated Yourself</p>
          <ul className="space-y-1">
            {underconfidentTopics.map((topic) => (
              <li key={topic} className="text-sm text-slate-300">
                <span className="font-medium">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {accurateTopics.length > 0 && (
        <div className="rounded-xl border border-gold-400/20 bg-gold-900/10 p-4">
          <p className="font-semibold text-gold-400 mb-2">Accurately Calibrated Topics</p>
          <ul className="space-y-1">
            {accurateTopics.map((topic) => (
              <li key={topic} className="text-sm text-slate-300">{topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
