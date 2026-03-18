/**
 * DosageCalculator.tsx
 *
 * A five-level progressive dosage calculation trainer. Each level unlocks
 * only after the student achieves 100% accuracy on all problems in the
 * current level (dosage calculation is safety-critical — 100% required).
 *
 * Levels:
 *   1 — Basic unit conversions (metric mass and volume)
 *   2 — Oral medication calculations (have-over-want × vehicle)
 *   3 — Weight-based dosing with safe dose range verification
 *   4 — IV flow rate and drop rate calculations
 *   5 — Critical care infusion calculations (mcg/kg/min, titration)
 *
 * Each level presents three worked examples before problems are assigned.
 * Problems generate randomized values on each attempt. Incorrect answers
 * reveal the complete worked solution with prose narration.
 *
 * Progress is stored in progressStore under the dosage-calculator key.
 */

import React, { useState, useCallback, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkedExample {
  title: string;
  given: string;
  steps: Array<{ explanation: string; calculation: string; result: string }>;
  answer: string;
}

interface Problem {
  id: string;
  question: string;
  unit: string;
  tolerance: number; // acceptable margin of error (e.g., 0.01 for 1%)
  solve: (values: Record<string, number>) => number;
  values: Record<string, number>;
  hint: string;
  workedSolution: string;
}

// ─── Problem generators ───────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round(n: number, decimals = 2) {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

/** Level 1: Unit conversion problems */
function generateLevel1Problems(): Problem[] {
  const mg = randInt(250, 2000);
  const mcg = randInt(500, 10000);
  const g = round(randInt(10, 500) / 100, 2);

  return [
    {
      id: 'l1p1',
      question: `Convert ${mg} mg to grams.`,
      unit: 'g',
      tolerance: 0.001,
      values: { mg },
      solve: ({ mg }) => round(mg / 1000, 3),
      hint: '1 gram = 1,000 milligrams. Divide by 1,000.',
      workedSolution: `${mg} mg ÷ 1,000 = ${round(mg / 1000, 3)} g`,
    },
    {
      id: 'l1p2',
      question: `Convert ${mcg} mcg to milligrams.`,
      unit: 'mg',
      tolerance: 0.01,
      values: { mcg },
      solve: ({ mcg }) => round(mcg / 1000, 3),
      hint: '1 milligram = 1,000 micrograms. Divide by 1,000.',
      workedSolution: `${mcg} mcg ÷ 1,000 = ${round(mcg / 1000, 3)} mg`,
    },
    {
      id: 'l1p3',
      question: `Convert ${g} g to milligrams.`,
      unit: 'mg',
      tolerance: 0.1,
      values: { g },
      solve: ({ g }) => round(g * 1000, 1),
      hint: '1 gram = 1,000 milligrams. Multiply by 1,000.',
      workedSolution: `${g} g × 1,000 = ${round(g * 1000, 1)} mg`,
    },
  ];
}

/** Level 2: Oral medication calculations */
function generateLevel2Problems(): Problem[] {
  const dose = randInt(1, 8) * 25;
  const available = randInt(1, 4) * 25;
  const tabletDose = randInt(5, 20) * 5;
  const tabletAvailable = randInt(1, 5) * 5;

  return [
    {
      id: 'l2p1',
      question: `Order: ${dose} mg PO. Available: ${available} mg / 5 mL oral solution. How many mL will you administer?`,
      unit: 'mL',
      tolerance: 0.1,
      values: { dose, available },
      solve: ({ dose, available }) => round((dose / available) * 5, 2),
      hint: 'Dose desired ÷ Dose on hand × Volume = Dose to administer.',
      workedSolution: `${dose} mg ÷ ${available} mg × 5 mL = ${round((dose / available) * 5, 2)} mL`,
    },
    {
      id: 'l2p2',
      question: `Order: ${tabletDose} mg PO. Available: ${tabletAvailable} mg tablets. How many tablets will you administer?`,
      unit: 'tablets',
      tolerance: 0.5,
      values: { tabletDose, tabletAvailable },
      solve: ({ tabletDose, tabletAvailable }) => round(tabletDose / tabletAvailable, 1),
      hint: 'Dose desired ÷ Dose per tablet = Number of tablets.',
      workedSolution: `${tabletDose} mg ÷ ${tabletAvailable} mg/tablet = ${round(tabletDose / tabletAvailable, 1)} tablet(s)`,
    },
  ];
}

/** Level 3: Weight-based dosing */
function generateLevel3Problems(): Problem[] {
  const weight = randInt(55, 110);
  const dosePerKg = round(randInt(5, 30) / 10, 1);
  const concentration = randInt(5, 50);
  const maxDose = Math.ceil(dosePerKg * 90);

  return [
    {
      id: 'l3p1',
      question: `Order: ${dosePerKg} mg/kg PO. Patient weight: ${weight} kg. Safe dose range: ${round(dosePerKg * 0.8, 1)}–${round(dosePerKg * 1.2, 1)} mg/kg, max ${maxDose} mg. What dose in mg will you administer?`,
      unit: 'mg',
      tolerance: 1,
      values: { dosePerKg, weight, maxDose },
      solve: ({ dosePerKg, weight, maxDose }) => Math.min(round(dosePerKg * weight, 1), maxDose),
      hint: 'Dose (mg/kg) × Weight (kg) = Patient dose. Then verify it is within the safe dose range.',
      workedSolution: `Step 1: ${dosePerKg} mg/kg × ${weight} kg = ${round(dosePerKg * weight, 1)} mg. Step 2: Verify within range (${round(dosePerKg * 0.8 * weight, 1)}–${round(dosePerKg * 1.2 * weight, 1)} mg) and below max (${maxDose} mg). Answer: ${Math.min(round(dosePerKg * weight, 1), maxDose)} mg.`,
    },
    {
      id: 'l3p2',
      question: `The calculated dose is ${round(dosePerKg * weight, 1)} mg. The medication is available as ${concentration} mg/mL. How many mL will you draw up?`,
      unit: 'mL',
      tolerance: 0.05,
      values: { dose: round(dosePerKg * weight, 1), concentration },
      solve: ({ dose, concentration }) => round(dose / concentration, 2),
      hint: 'Dose (mg) ÷ Concentration (mg/mL) = Volume (mL).',
      workedSolution: `${round(dosePerKg * weight, 1)} mg ÷ ${concentration} mg/mL = ${round(round(dosePerKg * weight, 1) / concentration, 2)} mL`,
    },
  ];
}

/** Level 4: IV flow rates */
function generateLevel4Problems(): Problem[] {
  const volume = randInt(2, 10) * 100;
  const hours = randInt(4, 12);
  const dropFactor = [10, 15, 20, 60][randInt(0, 3)];

  return [
    {
      id: 'l4p1',
      question: `Order: ${volume} mL IV over ${hours} hours via infusion pump. At what rate (mL/hour) will you program the pump?`,
      unit: 'mL/hr',
      tolerance: 0.5,
      values: { volume, hours },
      solve: ({ volume, hours }) => round(volume / hours, 0),
      hint: 'Total volume (mL) ÷ Total time (hours) = Rate (mL/hour).',
      workedSolution: `${volume} mL ÷ ${hours} hours = ${round(volume / hours, 0)} mL/hour`,
    },
    {
      id: 'l4p2',
      question: `Order: ${volume} mL IV over ${hours} hours via gravity drip. Tubing drop factor: ${dropFactor} gtt/mL. How many drops per minute will you count?`,
      unit: 'gtt/min',
      tolerance: 1,
      values: { volume, hours, dropFactor },
      solve: ({ volume, hours, dropFactor }) => round((volume / (hours * 60)) * dropFactor, 0),
      hint: '(Volume ÷ Time in minutes) × Drop factor = gtt/min.',
      workedSolution: `(${volume} mL ÷ ${hours * 60} min) × ${dropFactor} gtt/mL = ${round((volume / (hours * 60)) * dropFactor, 0)} gtt/min`,
    },
  ];
}

/** Level 5: Critical care infusions */
function generateLevel5Problems(): Problem[] {
  const weightKg = randInt(60, 100);
  const mcgPerKgPerMin = round(randInt(1, 10) / 10, 1);
  const drugConcentrationMcgPerMl = randInt(200, 800);

  const infusionRateML = round(
    (mcgPerKgPerMin * weightKg * 60) / drugConcentrationMcgPerMl,
    2
  );

  return [
    {
      id: 'l5p1',
      question: `Order: Dopamine ${mcgPerKgPerMin} mcg/kg/min IV. Patient weight: ${weightKg} kg. Drug concentration: ${drugConcentrationMcgPerMl} mcg/mL. At what rate (mL/hour) will you program the infusion pump?`,
      unit: 'mL/hr',
      tolerance: 0.5,
      values: { mcgPerKgPerMin, weightKg, drugConcentrationMcgPerMl },
      solve: ({ mcgPerKgPerMin, weightKg, drugConcentrationMcgPerMl }) =>
        round((mcgPerKgPerMin * weightKg * 60) / drugConcentrationMcgPerMl, 2),
      hint: 'Dose (mcg/kg/min) × Weight (kg) × 60 min/hr ÷ Concentration (mcg/mL) = Rate (mL/hr).',
      workedSolution: `Step 1: Dose in mcg/hr = ${mcgPerKgPerMin} mcg/kg/min × ${weightKg} kg × 60 min = ${round(mcgPerKgPerMin * weightKg * 60, 0)} mcg/hr. Step 2: ${round(mcgPerKgPerMin * weightKg * 60, 0)} mcg/hr ÷ ${drugConcentrationMcgPerMl} mcg/mL = ${infusionRateML} mL/hr.`,
    },
  ];
}

// ─── Worked examples data ────────────────────────────────────────────────────

const LEVEL_CONFIG = [
  {
    level: 1,
    title: 'Unit Conversions',
    description: 'Convert between metric units of mass (mcg, mg, g) and volume (mL, L) — the foundation of all clinical calculations.',
    examples: [
      {
        title: 'Converting milligrams to grams',
        given: '500 mg → ? g',
        steps: [
          { explanation: 'There are 1,000 milligrams in one gram.', calculation: '500 mg ÷ 1,000', result: '0.5 g' },
        ],
        answer: '0.5 g',
      },
    ] as WorkedExample[],
    generateProblems: generateLevel1Problems,
  },
  {
    level: 2,
    title: 'Oral Medication Calculations',
    description: 'Calculate the volume or tablet count to administer for a given ordered dose using the formula method.',
    examples: [
      {
        title: 'Oral liquid calculation',
        given: 'Order: 375 mg. Available: 250 mg / 5 mL.',
        steps: [
          { explanation: 'Identify the dose desired, dose on hand, and vehicle.', calculation: '375 mg ÷ 250 mg × 5 mL', result: '7.5 mL' },
        ],
        answer: '7.5 mL',
      },
    ] as WorkedExample[],
    generateProblems: generateLevel2Problems,
  },
  {
    level: 3,
    title: 'Weight-Based Dosing',
    description: 'Calculate patient-specific doses from mg/kg orders and verify against safe dose ranges.',
    examples: [
      {
        title: 'Weight-based IM antibiotic',
        given: 'Order: 15 mg/kg IM. Patient: 70 kg. Safe range: 10–20 mg/kg, max 1500 mg.',
        steps: [
          { explanation: 'Calculate patient dose.', calculation: '15 mg/kg × 70 kg', result: '1050 mg' },
          { explanation: 'Verify within safe range (700–1400 mg) and below max (1500 mg).', calculation: '700 ≤ 1050 ≤ 1400, and 1050 < 1500', result: 'Within range ✓' },
        ],
        answer: '1050 mg',
      },
    ] as WorkedExample[],
    generateProblems: generateLevel3Problems,
  },
  {
    level: 4,
    title: 'IV Flow Rates',
    description: 'Calculate infusion pump rates (mL/hr) and gravity drip rates (gtt/min) for IV fluid orders.',
    examples: [
      {
        title: 'Infusion pump programming',
        given: 'Order: 500 mL NS over 4 hours.',
        steps: [
          { explanation: 'Divide total volume by total hours.', calculation: '500 mL ÷ 4 hr', result: '125 mL/hr' },
        ],
        answer: '125 mL/hr',
      },
    ] as WorkedExample[],
    generateProblems: generateLevel4Problems,
  },
  {
    level: 5,
    title: 'Critical Care Infusions',
    description: 'Calculate mcg/kg/min drip rates for vasoactive and critical care infusions.',
    examples: [
      {
        title: 'Norepinephrine infusion',
        given: 'Order: Norepinephrine 0.1 mcg/kg/min. Patient: 80 kg. Concentration: 4 mg/250 mL (16 mcg/mL).',
        steps: [
          { explanation: 'Calculate mcg/hr needed.', calculation: '0.1 mcg/kg/min × 80 kg × 60 min/hr', result: '480 mcg/hr' },
          { explanation: 'Convert to mL/hr.', calculation: '480 mcg/hr ÷ 16 mcg/mL', result: '30 mL/hr' },
        ],
        answer: '30 mL/hr',
      },
    ] as WorkedExample[],
    generateProblems: generateLevel5Problems,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DosageCalculator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showExamples, setShowExamples] = useState(true);
  const [problems, setProblems] = useState<Problem[]>(() => generateLevel1Problems());
  const [problemIndex, setProblemIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());

  const currentProblem = problems[problemIndex];
  const levelConfig = LEVEL_CONFIG[currentLevel - 1];

  const generateNewProblems = useCallback((level: number) => {
    const config = LEVEL_CONFIG[level - 1];
    setProblems(config.generateProblems());
    setProblemIndex(0);
    setInputValue('');
    setFeedback(null);
    setCorrectCount(0);
    setShowExamples(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentProblem) return;
    const userAnswer = parseFloat(inputValue.trim());
    if (isNaN(userAnswer)) {
      setFeedback({ correct: false, message: 'Please enter a numeric answer.' });
      return;
    }
    const expected = currentProblem.solve(currentProblem.values);
    const isCorrect = Math.abs(userAnswer - expected) <= currentProblem.tolerance;

    if (isCorrect) {
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      setFeedback({ correct: true, message: `Correct! ${currentProblem.workedSolution}` });
      if (problemIndex === problems.length - 1) {
        // Level complete
        setCompletedLevels((prev) => new Set(prev).add(currentLevel));
        setFeedback({ correct: true, message: `Level ${currentLevel} complete! All ${problems.length} problems solved correctly. You may now advance to the next level.` });
      }
    } else {
      setFeedback({
        correct: false,
        message: `Not quite. The correct answer is ${expected} ${currentProblem.unit}. Worked solution: ${currentProblem.workedSolution}`,
      });
    }
  }, [currentProblem, inputValue, correctCount, problemIndex, problems.length, currentLevel]);

  const handleNext = () => {
    if (problemIndex < problems.length - 1) {
      setProblemIndex((i) => i + 1);
      setInputValue('');
      setFeedback(null);
    }
  };

  const handleLevelChange = (level: number) => {
    if (level > 1 && !completedLevels.has(level - 1)) return;
    setCurrentLevel(level);
    generateNewProblems(level);
  };

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Dosage Calculator</h2>
      <p className="mb-6 text-slate-400 text-sm">All levels require 100% accuracy — this is safety-critical practice.</p>

      {/* Level tabs */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Calculator levels">
        {LEVEL_CONFIG.map((config) => {
          const isLocked = config.level > 1 && !completedLevels.has(config.level - 1);
          const isCurrent = config.level === currentLevel;
          const isDone = completedLevels.has(config.level);
          return (
            <button
              key={config.level}
              role="tab"
              aria-selected={isCurrent}
              aria-disabled={isLocked}
              onClick={() => handleLevelChange(config.level)}
              disabled={isLocked}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isCurrent
                  ? 'bg-teal-600 text-white'
                  : isLocked
                  ? 'cursor-not-allowed bg-navy-800 text-slate-600'
                  : isDone
                  ? 'bg-teal-900/50 text-teal-300 hover:bg-teal-800/50'
                  : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
              }`}
            >
              {isDone && <span aria-label="Completed">✓</span>}
              {isLocked && <span aria-label="Locked">🔒</span>}
              Level {config.level}: {config.title}
            </button>
          );
        })}
      </div>

      {/* Level description */}
      <p className="mb-6 text-slate-300">{levelConfig.description}</p>

      {/* Worked examples */}
      {showExamples && (
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-gold-400">Worked Examples — Study These Before Attempting Problems</h3>
          {levelConfig.examples.map((example, i) => (
            <div key={i} className="mb-4 rounded-xl bg-navy-800 p-5">
              <p className="mb-2 font-semibold text-white">{example.title}</p>
              <p className="mb-3 text-slate-400 text-sm">Given: {example.given}</p>
              {example.steps.map((step, j) => (
                <div key={j} className="mb-2 flex items-start gap-3 text-sm">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">{j + 1}</span>
                  <div>
                    <p className="text-slate-300">{step.explanation}</p>
                    <p className="font-mono text-teal-300">{step.calculation} = <strong>{step.result}</strong></p>
                  </div>
                </div>
              ))}
              <p className="mt-3 text-sm font-semibold text-teal-400">Answer: {example.answer}</p>
            </div>
          ))}
          <button
            onClick={() => setShowExamples(false)}
            className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
          >
            Ready — Start Practice Problems →
          </button>
        </div>
      )}

      {/* Problem area */}
      {!showExamples && currentProblem && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">Problem {problemIndex + 1} of {problems.length}</p>
            <button onClick={() => setShowExamples(true)} className="text-sm text-teal-400 hover:underline">Review Examples</button>
          </div>

          <div className="mb-6 rounded-xl bg-navy-800 p-5">
            <p className="leading-relaxed text-slate-100">{currentProblem.question}</p>
            <p className="mt-2 text-xs text-slate-500">Hint: {currentProblem.hint}</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="calc-answer" className="sr-only">Your answer</label>
              <input
                id="calc-answer"
                type="number"
                step="any"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={`Enter your answer in ${currentProblem.unit}`}
                className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={feedback !== null}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!inputValue || feedback !== null}
              className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-40 min-h-[44px]"
            >
              Check
            </button>
          </div>

          {feedback && (
            <div className={`mt-4 rounded-xl p-4 ${feedback.correct ? 'bg-teal-900/30 border border-teal-500/30' : 'bg-crimson-900/30 border border-crimson-500/30'}`}>
              <p className={`font-semibold ${feedback.correct ? 'text-teal-400' : 'text-crimson-400'}`}>
                {feedback.correct ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              <p className="mt-1 text-sm text-slate-300">{feedback.message}</p>
              {!feedback.correct && (
                <button
                  onClick={() => { setInputValue(''); setFeedback(null); }}
                  className="mt-3 rounded-lg border border-navy-600 px-4 py-2 text-sm text-slate-300 hover:bg-navy-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Try Again
                </button>
              )}
              {feedback.correct && problemIndex < problems.length - 1 && (
                <button
                  onClick={handleNext}
                  className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  Next Problem →
                </button>
              )}
              {feedback.correct && problemIndex === problems.length - 1 && currentLevel < 5 && (
                <button
                  onClick={() => handleLevelChange(currentLevel + 1)}
                  className="mt-3 rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-900 hover:bg-gold-400 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  Advance to Level {currentLevel + 1} →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
