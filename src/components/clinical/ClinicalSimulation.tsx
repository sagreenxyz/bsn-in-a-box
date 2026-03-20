/**
 * ClinicalSimulation.tsx
 *
 * Branching scenario engine for the six longitudinal patients.
 * Loads scenario JSON from /public/data/simulations/ and walks the
 * student through a tree of assessment and decision nodes. Correct
 * and incorrect choices are tracked, feedback is shown after each
 * node, and a session score is displayed at the end.
 *
 * Scenario data is the same JSON files used by the PatientEncounter
 * component in individual patient profiles.
 */

import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Choice {
  id: string;
  text: string;
  nextNodeId: string;
  isCorrect: boolean;
  rationale: string;
  scoreImpact: number;
}

interface ScenarioNode {
  nodeId: string;
  type: 'assessment' | 'decision' | 'outcome';
  content: string;
  vitals?: Record<string, string>;
  choices?: Choice[];
}

interface Scenario {
  scenarioId: string;
  patientId: string;
  phase: number;
  title: string;
  startNodeId: string;
  nodes: ScenarioNode[];
}

interface ScenarioListing {
  id: string;
  title: string;
  patient: string;
  phase: number;
  file: string;
}

// ─── Available scenarios ──────────────────────────────────────────────────────

const SCENARIOS: ScenarioListing[] = [
  {
    id: 'marcus-webb-phase-1',
    title: 'Meeting Marcus Webb: First Encounter',
    patient: 'Marcus Webb',
    phase: 1,
    file: 'marcus-webb-phase-1.json',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScenarioList({
  onSelect,
}: {
  onSelect: (listing: ScenarioListing) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold text-white">
        Clinical Simulations
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        Branching scenario simulations for the longitudinal patient panel. Make
        clinical decisions and receive immediate rationale-based feedback. Your
        choices directly affect how the scenario unfolds.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left hover:border-teal-600 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Phase {s.phase}
              </span>
            </div>
            <h3 className="font-serif font-bold text-white mb-1">{s.title}</h3>
            <p className="text-sm text-slate-400">Patient: {s.patient}</p>
          </button>
        ))}

        {/* Locked upcoming scenarios */}
        {[
          { title: 'Eleanor Vasquez: Chronic Disease Complexity', patient: 'Eleanor Vasquez', phase: 1 },
          { title: 'Jordan Okafor: Mental Health Crisis', patient: 'Jordan Okafor', phase: 2 },
          { title: 'Amara Diallo: Postpartum Hemorrhage', patient: 'Amara Diallo', phase: 2 },
          { title: 'Robert Chen: Post-Surgical Complications', patient: 'Robert Chen', phase: 3 },
          { title: 'Sofia Martinez: Pediatric Sepsis', patient: 'Sofia Martinez', phase: 3 },
        ].map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 opacity-50 cursor-not-allowed"
            aria-label={`${s.title} — locked until Phase ${s.phase}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Phase {s.phase} — Coming Soon
              </span>
            </div>
            <h3 className="font-serif font-bold text-slate-500 mb-1">{s.title}</h3>
            <p className="text-sm text-slate-600">Patient: {s.patient}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeView({
  node,
  score,
  onChoose,
  onContinue,
  lastChoice,
}: {
  node: ScenarioNode;
  score: number;
  onChoose: (choice: Choice) => void;
  onContinue: () => void;
  lastChoice: Choice | null;
}) {
  const isOutcome = node.type === 'outcome';

  return (
    <div>
      {/* Score badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {node.type === 'assessment'
            ? 'Assessment'
            : node.type === 'decision'
            ? 'Clinical Decision'
            : 'Outcome'}
        </span>
        <span className="rounded-full border border-teal-500/30 px-3 py-0.5 text-sm font-bold text-teal-400">
          Score: {score}
        </span>
      </div>

      {/* Scenario content */}
      <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-5">
        <p className="text-slate-200 leading-relaxed text-sm">{node.content}</p>

        {/* Vitals display */}
        {node.vitals && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(node.vitals).map(([key, val]) => (
              <div
                key={key}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
              >
                <p className="text-xs text-slate-500 mb-0.5">{key}</p>
                <p className="text-sm font-bold text-white">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rationale from last choice */}
      {lastChoice && (
        <div
          className={`mb-6 rounded-2xl border-l-4 p-4 ${
            lastChoice.isCorrect
              ? 'border-teal-500 bg-teal-900/20'
              : 'border-red-500 bg-red-900/10'
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              lastChoice.isCorrect ? 'text-teal-400' : 'text-red-400'
            }`}
          >
            {lastChoice.isCorrect ? '✓ Correct choice' : '✗ Suboptimal choice'}
            {' '}({lastChoice.scoreImpact > 0 ? '+' : ''}{lastChoice.scoreImpact} pts)
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{lastChoice.rationale}</p>
        </div>
      )}

      {/* Choices or Continue button */}
      {!isOutcome && node.choices && node.choices.length > 0 && !lastChoice ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400 mb-2">Choose your next action:</p>
          {node.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoose(choice)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left text-sm text-slate-200 hover:border-teal-600 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              {choice.text}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={onContinue}
          className="w-full rounded-2xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
        >
          {isOutcome ? 'Finish Scenario' : 'Continue →'}
        </button>
      )}
    </div>
  );
}

function SessionSummary({
  score,
  scenario,
  onRestart,
  onBack,
}: {
  score: number;
  scenario: Scenario;
  onRestart: () => void;
  onBack: () => void;
}) {
  const maxScore = scenario.nodes
    .flatMap((n) => n.choices ?? [])
    .filter((c) => c.isCorrect)
    .reduce((sum, c) => sum + c.scoreImpact, 0);

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const grade =
    pct >= 85
      ? { label: 'Excellent clinical reasoning', color: 'text-teal-400' }
      : pct >= 70
      ? { label: 'Good clinical judgment', color: 'text-yellow-400' }
      : { label: 'Review key concepts and retry', color: 'text-orange-400' };

  return (
    <div className="text-center">
      <p className="text-5xl mb-4" aria-hidden="true">
        {pct >= 85 ? '🏆' : pct >= 70 ? '✓' : '📚'}
      </p>
      <h2 className="font-display text-2xl font-bold text-white mb-1">
        Scenario Complete
      </h2>
      <p className="text-slate-400 mb-6">{scenario.title}</p>

      <div className="inline-block rounded-2xl border border-slate-700 bg-slate-900 px-10 py-6 mb-6">
        <p className="text-5xl font-black text-white mb-1">
          {score} / {maxScore}
        </p>
        <p className="text-slate-400 text-sm mb-3">{pct}% of optimal score</p>
        <p className={`text-lg font-bold ${grade.color}`}>{grade.label}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRestart}
          className="rounded-2xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
        >
          Retry Scenario
        </button>
        <button
          onClick={onBack}
          className="rounded-2xl border border-slate-600 px-6 py-3 font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
        >
          ← All Scenarios
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClinicalSimulation() {
  const [selectedListing, setSelectedListing] = useState<ScenarioListing | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [score, setScore] = useState(0);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch scenario JSON when user selects a scenario
  useEffect(() => {
    if (!selectedListing) return;
    setLoading(true);
    setError(null);
    // Determine base URL from the current page's origin + Vite BASE_URL
    const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '/bsn-in-a-box';
    fetch(`${base}/data/simulations/${selectedListing.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Scenario>;
      })
      .then((data) => {
        setScenario(data);
        setCurrentNodeId(data.startNodeId);
        setScore(0);
        setLastChoice(null);
        setComplete(false);
        setLoading(false);
      })
      .catch((e) => {
        console.error('BSN: Failed to load scenario:', e);
        setError('Could not load the scenario. Please try again.');
        setLoading(false);
      });
  }, [selectedListing]);

  const currentNode = scenario?.nodes.find((n) => n.nodeId === currentNodeId) ?? null;

  const handleChoose = (choice: Choice) => {
    setScore((s) => s + choice.scoreImpact);
    setLastChoice(choice);
  };

  const handleContinue = () => {
    if (!currentNode || !scenario) return;
    if (currentNode.type === 'outcome') {
      setComplete(true);
      return;
    }
    if (lastChoice) {
      setCurrentNodeId(lastChoice.nextNodeId);
      setLastChoice(null);
    }
  };

  const handleRestart = () => {
    if (!scenario) return;
    setCurrentNodeId(scenario.startNodeId);
    setScore(0);
    setLastChoice(null);
    setComplete(false);
  };

  const handleBack = () => {
    setSelectedListing(null);
    setScenario(null);
    setComplete(false);
  };

  // Render states
  if (!selectedListing) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
        <ScenarioList onSelect={setSelectedListing} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center">
        <p className="text-slate-400">Loading scenario…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-800 bg-navy-900 p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={handleBack}
          className="rounded-xl border border-slate-600 px-5 py-2.5 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (complete && scenario) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8">
        <SessionSummary
          score={score}
          scenario={scenario}
          onRestart={handleRestart}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (!currentNode) return null;

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      {/* Scenario header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            {selectedListing.patient} · Phase {selectedListing.phase}
          </p>
          <h2 className="font-display text-xl font-bold text-white">{selectedListing.title}</h2>
        </div>
        <button
          onClick={handleBack}
          className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          ← Scenarios
        </button>
      </div>

      <NodeView
        node={currentNode}
        score={score}
        onChoose={handleChoose}
        onContinue={handleContinue}
        lastChoice={lastChoice}
      />
    </div>
  );
}
