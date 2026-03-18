/**
 * SBARBuilder.tsx
 *
 * An interactive SBAR (Situation, Background, Assessment, Recommendation)
 * communication builder that helps students practice structured clinical
 * handoff communication. The student fills in each section with guided prompts,
 * and the complete SBAR is rendered as a formatted clinical communication that
 * can be copied to clipboard.
 *
 * Based on the TJC and AHRQ SBAR framework for standardized communication.
 */

import React, { useState } from 'react';

interface SBARField {
  label: string;
  placeholder: string;
  hint: string;
}

const SBAR_SECTIONS = [
  {
    key: 'situation',
    title: 'S — Situation',
    color: 'border-teal-500',
    headerColor: 'text-teal-400',
    description: 'State who you are, who you are calling about, and what the immediate concern is.',
    fields: [
      { label: 'Your name and role', placeholder: 'e.g., "I am Maria Chen, RN, on the 4th floor medical-surgical unit."', hint: 'Identify yourself clearly.' },
      { label: 'Patient name and room', placeholder: 'e.g., "I am calling about Marcus Webb in room 412."', hint: 'Use two patient identifiers.' },
      { label: 'The immediate situation/concern', placeholder: 'e.g., "Mr. Webb has become increasingly confused over the past 30 minutes with a new fever of 39.2°C."', hint: 'State the problem directly and concisely.' },
    ] as SBARField[],
  },
  {
    key: 'background',
    title: 'B — Background',
    color: 'border-gold-500',
    headerColor: 'text-gold-400',
    description: "Provide the relevant clinical context that helps the provider understand the patient's situation.",
    fields: [
      { label: 'Reason for admission/primary diagnosis', placeholder: 'e.g., "He was admitted 48 hours ago for a diabetic foot wound with cellulitis."', hint: 'Why is this patient here?' },
      { label: 'Relevant medical history', placeholder: 'e.g., "He has Type 1 diabetes mellitus, diagnosed 4 months ago, currently on insulin glargine and lispro."', hint: 'What history is relevant to the current concern?' },
      { label: 'Current medications and recent changes', placeholder: 'e.g., "He is on IV vancomycin for MRSA, started yesterday. Last dose was at 0600."', hint: 'Medications relevant to the current concern.' },
      { label: 'Baseline and recent vital signs/labs', placeholder: 'e.g., "His baseline temperature has been 37.0-37.4°C throughout admission. WBC on admission was 14.2, today\'s is 18.6."', hint: 'What was the trend before this change?' },
    ] as SBARField[],
  },
  {
    key: 'assessment',
    title: 'A — Assessment',
    color: 'border-crimson-500',
    headerColor: 'text-crimson-400',
    description: 'State your clinical assessment of what is happening — your professional judgment about the situation.',
    fields: [
      { label: 'Your assessment of the problem', placeholder: 'e.g., "I am concerned that he may be developing sepsis from his wound infection, with new fever, worsening leukocytosis, and altered mental status."', hint: 'What do you think is happening? State your assessment directly.' },
      { label: 'Current vital signs', placeholder: 'e.g., "Current vitals: T 39.2°C, HR 118, RR 22, BP 94/62, SpO2 96% on room air."', hint: 'Specific numbers, not general descriptions.' },
    ] as SBARField[],
  },
  {
    key: 'recommendation',
    title: 'R — Recommendation',
    color: 'border-purple-500',
    headerColor: 'text-purple-400',
    description: 'State what you need or recommend. Be direct — providers appreciate nurses who say what they want.',
    fields: [
      { label: 'What you are requesting or recommending', placeholder: 'e.g., "I am requesting that you come evaluate Mr. Webb now. I would also like to request orders for blood cultures ×2, repeat CBC and BMP, and fluid bolus 500 mL NS."', hint: 'Be specific about what you want the provider to do.' },
      { label: 'Timeline/urgency', placeholder: 'e.g., "I believe this needs immediate evaluation — his blood pressure has dropped 20 points from baseline."', hint: 'How urgently does this need to happen?' },
    ] as SBARField[],
  },
];

export default function SBARBuilder() {
  const [values, setValues] = useState<Record<string, Record<number, string>>>({
    situation: {},
    background: {},
    assessment: {},
    recommendation: {},
  });
  const [activeSection, setActiveSection] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);

  const setFieldValue = (section: string, fieldIndex: number, value: string) => {
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [fieldIndex]: value },
    }));
  };

  const generateFullSBAR = () => {
    return SBAR_SECTIONS.map((section) => {
      const lines = section.fields
        .map((f, i) => values[section.key]?.[i])
        .filter(Boolean)
        .join(' ');
      return `${section.title}\n${lines}`;
    }).join('\n\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateFullSBAR());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = generateFullSBAR();
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentSection = SBAR_SECTIONS[activeSection];
  const sectionValues = values[currentSection.key] ?? {};

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">SBAR Communication Builder</h2>
      <p className="mb-6 text-sm text-slate-400">
        Practice structured clinical handoff communication using the SBAR framework. Complete each section to generate a full SBAR you can review and copy.
      </p>

      {/* Section progress */}
      <div className="mb-6 flex gap-2">
        {SBAR_SECTIONS.map((section, i) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(i)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${i === activeSection ? 'bg-teal-700 text-white' : 'bg-navy-800 text-slate-400 hover:bg-navy-700'}`}
            aria-pressed={i === activeSection}
          >
            {section.key.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

      {/* Current section */}
      <div className={`mb-6 rounded-2xl border-l-4 ${currentSection.color} bg-navy-800 p-5`}>
        <h3 className={`mb-1 font-display text-xl font-bold ${currentSection.headerColor}`}>{currentSection.title}</h3>
        <p className="mb-5 text-sm text-slate-400">{currentSection.description}</p>
        <div className="space-y-4">
          {currentSection.fields.map((field, i) => (
            <div key={i}>
              <label className="mb-1 block text-sm font-medium text-slate-300">{field.label}</label>
              <p className="mb-1.5 text-xs text-slate-500">{field.hint}</p>
              <textarea
                rows={2}
                value={sectionValues[i] ?? ''}
                onChange={(e) => setFieldValue(currentSection.key, i, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-navy-600 bg-navy-700 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex gap-3">
        {activeSection > 0 && (
          <button onClick={() => setActiveSection((i) => i - 1)} className="rounded-xl border border-navy-600 px-5 py-2.5 text-slate-300 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]">
            ← Back
          </button>
        )}
        {activeSection < SBAR_SECTIONS.length - 1 && (
          <button onClick={() => setActiveSection((i) => i + 1)} className="flex-1 rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">
            Next: {SBAR_SECTIONS[activeSection + 1].title.split(' — ')[1]} →
          </button>
        )}
        {activeSection === SBAR_SECTIONS.length - 1 && (
          <button onClick={() => setShowFull(true)} className="flex-1 rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">
            Generate Full SBAR →
          </button>
        )}
      </div>

      {/* Full SBAR preview */}
      {showFull && (
        <div className="rounded-2xl border border-teal-500/30 bg-teal-900/10 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-teal-400">Your SBAR Communication</h3>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-teal-500/30 px-4 py-1.5 text-sm text-teal-300 hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-200 font-mono leading-relaxed">
            {generateFullSBAR()}
          </pre>
        </div>
      )}
    </div>
  );
}
