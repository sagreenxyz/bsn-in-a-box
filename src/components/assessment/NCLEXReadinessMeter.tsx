/**
 * NCLEXReadinessMeter.tsx
 *
 * Renders a composite NCLEX readiness gauge that aggregates the student's
 * performance data from progressStore into a single readiness percentage,
 * visualized as an arc gauge using SVG (no external chart library needed).
 *
 * The composite score is calculated from four weighted components:
 *   - Module completion rate (25%): what percentage of Phase 1+ modules done
 *   - Average quiz/gate score (35%): mean of all recorded assessment attempts
 *   - Spaced retrieval freshness (20%): how current the student's retrievals are
 *   - Concept mastery breadth (20%): how many of the 35 concepts have been engaged
 *
 * The meter shows the composite score alongside each component's contribution,
 * with prose that explains what the score means for NCLEX readiness.
 *
 * Props:
 *   compact — if true, renders only the arc gauge without the breakdown (for dashboard)
 */

import React, { useEffect, useState } from 'react';
import { getProgress } from '../../lib/progressStore';

interface NCLEXReadinessMeterProps {
  compact?: boolean;
}

interface ReadinessBreakdown {
  composite: number;
  moduleCompletion: number;
  averageScore: number;
  retrievalFreshness: number;
  conceptBreadth: number;
  modulesCompleted: number;
  totalModules: number;
  attemptsRecorded: number;
  conceptsEngaged: number;
}

const TOTAL_MODULES = 11; // Phase 1 registry count — update as curriculum grows
const TOTAL_CONCEPTS = 35;

function calculateReadiness(): ReadinessBreakdown {
  try {
    const progress = getProgress();
    let modulesCompleted = 0;
    let totalScore = 0;
    let attemptCount = 0;
    const engagedConcepts = new Set<string>();

    // Count module completions and concept engagements
    Object.values(progress.phases).forEach((phaseState) => {
      Object.values(phaseState.domains ?? {}).forEach((domainState) => {
        Object.values((domainState as any).units ?? {}).forEach((unitState) => {
          Object.entries((unitState as any).modules ?? {}).forEach(([, modState]) => {
            const ms = modState as any;
            if (ms.status === 'completed') {
              modulesCompleted++;
              ms.conceptTags?.forEach((t: string) => engagedConcepts.add(t));
            }
          });
        });
      });

      // Collect attempt scores
      phaseState.quizAttempts?.forEach((attempt: any) => {
        totalScore += attempt.score ?? 0;
        attemptCount++;
      });
    });

    const moduleCompletion = Math.min(1, modulesCompleted / TOTAL_MODULES);
    const averageScore = attemptCount > 0 ? totalScore / attemptCount : 0;
    const conceptBreadth = Math.min(1, engagedConcepts.size / TOTAL_CONCEPTS);

    // Retrieval freshness: fraction of due retrievals that are current
    const retrievalEvents = progress.retrievalSchedule ?? [];
    const now = Date.now();
    const fresh = retrievalEvents.filter((e: any) => new Date(e.nextDue).getTime() > now).length;
    const retrievalFreshness = retrievalEvents.length > 0
      ? fresh / retrievalEvents.length
      : modulesCompleted > 0 ? 0.5 : 0; // Default assumption for early students

    const composite = Math.round(
      (moduleCompletion * 0.25 + averageScore * 0.35 + retrievalFreshness * 0.20 + conceptBreadth * 0.20) * 100
    );

    return {
      composite,
      moduleCompletion: Math.round(moduleCompletion * 100),
      averageScore: Math.round(averageScore * 100),
      retrievalFreshness: Math.round(retrievalFreshness * 100),
      conceptBreadth: Math.round(conceptBreadth * 100),
      modulesCompleted,
      totalModules: TOTAL_MODULES,
      attemptsRecorded: attemptCount,
      conceptsEngaged: engagedConcepts.size,
    };
  } catch {
    return {
      composite: 0,
      moduleCompletion: 0,
      averageScore: 0,
      retrievalFreshness: 0,
      conceptBreadth: 0,
      modulesCompleted: 0,
      totalModules: TOTAL_MODULES,
      attemptsRecorded: 0,
      conceptsEngaged: 0,
    };
  }
}

/** SVG arc gauge component */
function ArcGauge({ value, size = 180 }: { value: number; size?: number }) {
  const radius = size * 0.38;
  const stroke = size * 0.08;
  const cx = size / 2;
  const cy = size / 2;

  // Arc goes from 225° to 315° (270° sweep)
  const startAngle = 225;
  const sweepAngle = 270;
  const endAngle = startAngle + (value / 100) * sweepAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const describeArc = (startDeg: number, endDeg: number) => {
    const start = {
      x: cx + radius * Math.cos(toRad(startDeg)),
      y: cy + radius * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + radius * Math.cos(toRad(endDeg)),
      y: cy + radius * Math.sin(toRad(endDeg)),
    };
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const color =
    value >= 80 ? '#14b8a6' : // teal-500
    value >= 60 ? '#f59e0b' : // amber-500
    value >= 40 ? '#f97316' : // orange-500
    '#ef4444'; // red-500

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`NCLEX readiness: ${value}%`}
    >
      {/* Background track */}
      <path
        d={describeArc(225, 495)}
        fill="none"
        stroke="#1e293b"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Value arc */}
      {value > 0 && (
        <path
          d={describeArc(225, endAngle)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      )}
      {/* Center text */}
      <text
        x={cx}
        y={cy - size * 0.02}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.2}
        fontWeight="bold"
        fill={color}
        fontFamily="monospace"
      >
        {value}%
      </text>
      <text
        x={cx}
        y={cy + size * 0.17}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.08}
        fill="#94a3b8"
      >
        NCLEX Ready
      </text>
    </svg>
  );
}

function readinessLabel(score: number): { label: string; prose: string } {
  if (score === 0) return {
    label: 'Not yet measurable',
    prose: 'Complete Phase 1 modules and knowledge checks to generate your readiness score. The gauge requires assessment data to calculate a meaningful composite.',
  };
  if (score < 30) return {
    label: 'Early foundations',
    prose: `Your readiness score of ${score}% reflects the early stages of content engagement. Focus on completing Phase 1 modules and all embedded knowledge checks. Every module you complete and every retrieval event you pass moves this gauge.`,
  };
  if (score < 50) return {
    label: 'Building momentum',
    prose: `A readiness score of ${score}% indicates solid foundational engagement. Your assessment performance and module completion are contributing positively. Ensure you are completing all elaborative prompts and retrieval quizzes — they contribute directly to the score.`,
  };
  if (score < 70) return {
    label: 'On track',
    prose: `${score}% readiness represents strong progress. Your combination of content completion, assessment scores, and concept engagement is building a sound foundation. Continue through Phase 2 with the same engagement pattern.`,
  };
  if (score < 85) return {
    label: 'Approaching readiness',
    prose: `A readiness score of ${score}% indicates that the majority of your learning is translating into demonstrable competency. Identify your lowest-scoring concept areas and target them with the flashcard engine and targeted retrieval events.`,
  };
  return {
    label: 'NCLEX Ready',
    prose: `A readiness score of ${score}% reflects a high level of content mastery, assessment performance, and concept engagement across the curriculum. Maintain your retrieval schedule and continue through remaining phases. This score is predictive of, but not a guarantee of, NCLEX success.`,
  };
}

export default function NCLEXReadinessMeter({ compact = false }: NCLEXReadinessMeterProps) {
  const [readiness, setReadiness] = useState<ReadinessBreakdown | null>(null);

  useEffect(() => {
    setReadiness(calculateReadiness());
  }, []);

  if (!readiness) return null;

  const { label, prose } = readinessLabel(readiness.composite);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ArcGauge value={readiness.composite} size={140} />
        <p className="text-sm font-semibold text-slate-300">{label}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-6 font-display text-2xl font-bold text-white">NCLEX Readiness Meter</h2>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ArcGauge value={readiness.composite} size={180} />

        <div className="flex-1">
          <p className="mb-2 font-semibold text-white text-lg">{label}</p>
          <p className="leading-relaxed text-slate-300 text-sm">{prose}</p>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          {
            label: 'Module Completion',
            value: readiness.moduleCompletion,
            weight: '25%',
            detail: `${readiness.modulesCompleted} of ${readiness.totalModules} modules`,
          },
          {
            label: 'Assessment Performance',
            value: readiness.averageScore,
            weight: '35%',
            detail: `${readiness.attemptsRecorded} attempt${readiness.attemptsRecorded !== 1 ? 's' : ''} recorded`,
          },
          {
            label: 'Retrieval Freshness',
            value: readiness.retrievalFreshness,
            weight: '20%',
            detail: 'Based on spaced retrieval schedule',
          },
          {
            label: 'Concept Breadth',
            value: readiness.conceptBreadth,
            weight: '20%',
            detail: `${readiness.conceptsEngaged} of ${TOTAL_CONCEPTS} concepts engaged`,
          },
        ].map((component) => (
          <div key={component.label} className="rounded-xl bg-navy-800 p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-300">{component.label}</p>
              <span className="text-xs text-slate-500">×{component.weight}</span>
            </div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-700"
                  style={{ width: `${component.value}%` }}
                />
              </div>
              <span className="flex-shrink-0 text-sm font-bold text-teal-400">{component.value}%</span>
            </div>
            <p className="text-xs text-slate-500">{component.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
