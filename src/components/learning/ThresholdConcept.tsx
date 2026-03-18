/**
 * ThresholdConcept.tsx
 *
 * A visually distinct callout block that frames a threshold concept —
 * a transformative idea that permanently changes how the student understands
 * nursing practice (after Meyer & Land). The label "Threshold Concept" appears
 * prominently, followed by a prose explanation of why this idea is transformative.
 *
 * Props:
 *   title    — the name of the threshold concept
 *   children — prose content (MDX rich text)
 */

import React from 'react';

interface ThresholdConceptProps {
  title: string;
  children: React.ReactNode;
}

export default function ThresholdConcept({ title, children }: ThresholdConceptProps) {
  return (
    <aside
      className="my-10 rounded-2xl border-l-4 border-gold-400 bg-gold-900/10 p-6 shadow-lg"
      aria-label={`Threshold Concept: ${title}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-400/20 text-gold-400 text-lg" aria-hidden="true">
          ★
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Threshold Concept</p>
          <h3 className="font-display text-lg font-bold text-white leading-tight">{title}</h3>
        </div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed [&>p]:mb-3">
        {children}
      </div>
    </aside>
  );
}
