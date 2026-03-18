/**
 * ProductiveFailureWrapper.tsx
 *
 * Implements the productive failure pedagogy: the student encounters a
 * clinical scenario and makes decisions BEFORE reading the teaching content.
 * After completing the scenario, the content is revealed with a comparison
 * view showing what the student decided versus the expert approach.
 *
 * Research basis: Kapur (2016) — students who struggle with problems before
 * instruction develop deeper conceptual understanding than those who receive
 * instruction first. The failures generate "knowledge gaps" that prime
 * learning during subsequent instruction.
 *
 * Props:
 *   moduleId    — the module this wrapper belongs to
 *   scenarioId  — the simulation scenario to load for the pre-content challenge
 *   children    — the teaching content (revealed after scenario completion)
 */

import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ProductiveFailureWrapperProps {
  moduleId: string;
  scenarioId: string;
  children: ReactNode;
}

interface ScenarioChoice {
  id: string;
  text: string;
  isCorrect: boolean;
  rationale: string;
  nextNodeId?: string;
}

interface ScenarioNode {
  nodeId: string;
  type: 'assessment' | 'decision' | 'intervention' | 'outcome' | 'end';
  content: string;
  choices?: ScenarioChoice[];
  vitals?: Record<string, string>;
}

interface ScenarioData {
  scenarioId: string;
  title: string;
  startNodeId: string;
  nodes: ScenarioNode[];
}

type PhaseState = 'pre-scenario' | 'in-scenario' | 'post-scenario' | 'reading';

export default function ProductiveFailureWrapper({
  moduleId,
  scenarioId,
  children,
}: ProductiveFailureWrapperProps) {
  const [phase, setPhase] = useState<PhaseState>('pre-scenario');
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [decisions, setDecisions] = useState<Array<{ node: ScenarioNode; choice: ScenarioChoice }>>([]);
  const [loading, setLoading] = useState(false);

  const currentNode = scenario?.nodes.find((n) => n.nodeId === currentNodeId) ?? null;
  const isEndNode = currentNode?.type === 'end' || currentNode?.type === 'outcome';

  const loadScenario = async () => {
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${base}/data/simulations/${scenarioId}.json`);
      if (!res.ok) throw new Error('Scenario not found');
      const data: ScenarioData = await res.json();
      setScenario(data);
      setCurrentNodeId(data.startNodeId);
      setPhase('in-scenario');
    } catch (e) {
      console.warn('BSN: Could not load scenario:', e);
      // If scenario unavailable, skip directly to reading content
      setPhase('reading');
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice: ScenarioChoice) => {
    if (!currentNode) return;
    setDecisions((prev) => [...prev, { node: currentNode, choice }]);
    if (choice.nextNodeId) {
      setCurrentNodeId(choice.nextNodeId);
    } else {
      // No next node — scenario ends
      setPhase('post-scenario');
    }
  };

  const handleScenarioEnd = () => {
    setPhase('post-scenario');
  };

  // ── Pre-scenario introduction ──────────────────────────────────────────────
  if (phase === 'pre-scenario') {
    return (
      <div className="rounded-2xl border border-gold-400/30 bg-gold-900/10 p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🧪</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Productive Failure</p>
            <h2 className="font-display text-xl font-bold text-white">Try Before You Learn</h2>
          </div>
        </div>
        <p className="mb-6 leading-relaxed text-slate-300">
          Before reading this module's content, you will encounter a clinical scenario and make decisions based on what you already know. You will almost certainly face situations where you are unsure — that uncertainty is intentional and valuable. Research on learning shows that students who struggle with problems before instruction develop a deeper, more lasting understanding than those who receive instruction first.
        </p>
        <p className="mb-8 leading-relaxed text-slate-300">
          After completing the scenario, you will read the teaching content. Then you will see a comparison of your decisions against the expert approach — not to judge your performance, but to use the contrast between what you tried and what the evidence supports as a powerful learning anchor.
        </p>
        <button
          onClick={loadScenario}
          disabled={loading}
          className="rounded-xl bg-gold-600 px-8 py-4 font-bold text-white hover:bg-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-400 min-h-[44px] disabled:opacity-50"
        >
          {loading ? 'Loading scenario...' : 'Begin the Clinical Scenario →'}
        </button>
        <p className="mt-4 text-xs text-slate-500">
          If you prefer to read the content first, you may{' '}
          <button
            onClick={() => setPhase('reading')}
            className="text-teal-400 hover:underline focus:outline-none focus:underline"
          >
            skip the scenario
          </button>
          {' '}— though we encourage you to try.
        </p>
      </div>
    );
  }

  // ── Scenario in progress ───────────────────────────────────────────────────
  if (phase === 'in-scenario' && scenario && currentNode) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-400">
            {scenario.title} — {currentNode.type}
          </p>
          <button
            onClick={() => setPhase('post-scenario')}
            className="text-xs text-slate-500 hover:text-slate-300 focus:outline-none focus:underline"
          >
            Skip to content
          </button>
        </div>

        {/* Vitals display */}
        {currentNode.vitals && Object.keys(currentNode.vitals).length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-navy-800 p-4 sm:grid-cols-3">
            {Object.entries(currentNode.vitals).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-slate-500">{key}</p>
                <p className="font-mono font-bold text-teal-300">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Node content */}
        <p className="mb-6 leading-relaxed text-slate-200">{currentNode.content}</p>

        {/* Choices or end node */}
        {isEndNode ? (
          <button
            onClick={handleScenarioEnd}
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
          >
            Continue to Teaching Content →
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-400">What would you do?</p>
            {currentNode.choices?.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                className="w-full rounded-xl border border-navy-700 bg-navy-800 px-4 py-3 text-left text-slate-200 transition-colors hover:border-teal-500/50 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Post-scenario review ───────────────────────────────────────────────────
  if (phase === 'post-scenario') {
    const correctDecisions = decisions.filter((d) => d.choice.isCorrect).length;
    const totalDecisions = decisions.length;

    return (
      <div>
        {/* Scenario debrief */}
        <div className="mb-8 rounded-2xl border border-gold-400/30 bg-gold-900/10 p-6">
          <h3 className="mb-2 font-display text-xl font-bold text-white">Scenario Debrief</h3>
          <p className="mb-4 text-slate-300 text-sm">
            You made {totalDecisions} clinical decision{totalDecisions !== 1 ? 's' : ''},{' '}
            {correctDecisions} of which aligned with evidence-based practice. Now read the teaching content below — notice how your decisions connect to or contrast with the clinical reasoning the content explains.
          </p>
          <div className="space-y-4">
            {decisions.map((decision, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${decision.choice.isCorrect ? 'border-teal-500/30 bg-teal-900/10' : 'border-crimson-500/30 bg-crimson-900/10'}`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Decision {i + 1}
                </p>
                <p className="mb-2 text-sm font-medium text-slate-200">{decision.choice.text}</p>
                <p className="text-sm leading-relaxed text-slate-300">{decision.choice.rationale}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPhase('reading')}
            className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
          >
            Read the Teaching Content →
          </button>
        </div>
      </div>
    );
  }

  // ── Reading content (after scenario) ──────────────────────────────────────
  return (
    <div>
      {decisions.length > 0 && (
        <div className="mb-8 rounded-xl border border-gold-400/20 bg-gold-900/10 p-4">
          <p className="text-sm text-gold-300">
            As you read, notice how the clinical reasoning below relates to the decisions you made in the scenario.
            The contrast between your initial approach and the evidence-based approach is the core of your learning here.
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
