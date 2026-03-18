/**
 * CarePlanBuilder.tsx
 *
 * Step-by-step nursing care plan builder using the NANDA-I / NOC / NIC framework.
 * Students:
 *   1. Select or enter a nursing diagnosis from a curated list
 *   2. Identify defining characteristics present in their patient
 *   3. Specify related factors (etiology)
 *   4. Choose NOC outcome goals with target scores
 *   5. Select NIC interventions
 *   6. Preview, print, or copy the completed care plan
 *
 * All data is bundled locally — no network calls required.
 */

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NandaDiagnosis {
  code: string;
  label: string;
  domain: string;
  definingCharacteristics: string[];
  relatedFactors: string[];
  suggestedNOC: string[];
  suggestedNIC: string[];
}

// ─── Bundled diagnosis data ───────────────────────────────────────────────────

const DIAGNOSES: NandaDiagnosis[] = [
  {
    code: '00032',
    label: 'Ineffective Breathing Pattern',
    domain: 'Activity/Rest',
    definingCharacteristics: [
      'Abnormal breathing rate (tachypnea or bradypnea)',
      'Altered chest excursion',
      'Dyspnea',
      'Nasal flaring',
      'Orthopnea',
      'Pursed-lip breathing',
      'Tachypnea',
      'Use of accessory muscles to breathe',
    ],
    relatedFactors: [
      'Anxiety',
      'Fatigue',
      'Hyperventilation',
      'Hypoventilation syndrome',
      'Musculoskeletal impairment',
      'Neurological immaturity',
      'Obesity',
      'Pain',
      'Respiratory muscle fatigue',
    ],
    suggestedNOC: [
      'Respiratory Status: Ventilation (0403)',
      'Vital Signs (0802)',
      'Anxiety Self-Control (1402)',
    ],
    suggestedNIC: [
      'Airway Management (3140)',
      'Respiratory Monitoring (3350)',
      'Anxiety Reduction (5820)',
      'Positioning (0840)',
    ],
  },
  {
    code: '00132',
    label: 'Acute Pain',
    domain: 'Comfort',
    definingCharacteristics: [
      'Diaphoresis',
      'Distraction behavior (pacing, seeking relief)',
      'Evidence of pain using a validated observation tool',
      'Expressive behavior (crying, moaning, sighing)',
      'Facial expression of pain',
      'Guarding behavior',
      'Protective behavior',
      'Pupil dilation',
      'Self-report of pain intensity 1–10',
      'Tachycardia',
    ],
    relatedFactors: [
      'Biological injury agent (inflammation, infection)',
      'Chemical injury agent',
      'Physical injury agent (trauma, surgery, procedure)',
    ],
    suggestedNOC: [
      'Pain Level (2102)',
      'Pain Control (1605)',
      'Comfort Status (2008)',
    ],
    suggestedNIC: [
      'Pain Management (1400)',
      'Analgesic Administration (2210)',
      'Non-Pharmacological Comfort Measures (1340)',
      'Patient-Controlled Analgesia Assistance (2400)',
    ],
  },
  {
    code: '00046',
    label: 'Impaired Skin Integrity',
    domain: 'Safety/Protection',
    definingCharacteristics: [
      'Alteration in skin integrity',
      'Foreign matter piercing skin',
      'Altered sensation in affected area',
      'Bleeding',
      'Localized area hot to touch',
    ],
    relatedFactors: [
      'External factors: humidity, hyperthermia, pressure over bony prominence',
      'Internal factors: impaired circulation, decreased activity/mobility',
      'Inadequate nutrition',
      'Medications (corticosteroids)',
      'Moisture (incontinence, diaphoresis)',
    ],
    suggestedNOC: [
      'Wound Healing: Primary Intention (1102)',
      'Tissue Integrity: Skin and Mucous Membranes (1101)',
      'Risk Control (1902)',
    ],
    suggestedNIC: [
      'Wound Care (3660)',
      'Pressure Ulcer Prevention (3540)',
      'Skin Surveillance (3590)',
      'Nutrition Management (1100)',
    ],
  },
  {
    code: '00004',
    label: 'Risk for Infection',
    domain: 'Safety/Protection',
    definingCharacteristics: [],
    relatedFactors: [
      'Alteration in skin integrity',
      'Alteration in peristalsis',
      'Chronic disease',
      'Immunosuppression',
      'Inadequate primary defenses',
      'Inadequate vaccination',
      'Invasive procedure',
      'Malnutrition',
    ],
    suggestedNOC: [
      'Infection Severity (0703)',
      'Risk Control: Infectious Process (1924)',
      'Wound Healing: Primary Intention (1102)',
    ],
    suggestedNIC: [
      'Infection Control (6540)',
      'Infection Protection (6550)',
      'Wound Care (3660)',
      'Surveillance (6650)',
    ],
  },
  {
    code: '00027',
    label: 'Deficient Fluid Volume',
    domain: 'Nutrition',
    definingCharacteristics: [
      'Altered mental status',
      'Decreased blood pressure',
      'Decreased pulse pressure',
      'Decreased pulse volume',
      'Decreased skin turgor',
      'Decreased tongue turgor',
      'Decreased urine output',
      'Decreased venous filling',
      'Dry mucous membranes',
      'Dry skin',
      'Increased body temperature',
      'Increased heart rate',
      'Increased hematocrit',
      'Increased urine concentration',
      'Sudden weight loss',
      'Thirst',
      'Weakness',
    ],
    relatedFactors: [
      'Active fluid volume loss',
      'Failure of regulatory mechanisms',
    ],
    suggestedNOC: [
      'Fluid Balance (0601)',
      'Electrolyte and Acid/Base Balance (0600)',
      'Hydration (0602)',
    ],
    suggestedNIC: [
      'Fluid Management (4120)',
      'Fluid Monitoring (4130)',
      'Intravenous Therapy (4200)',
      'Hypovolemia Management (4180)',
    ],
  },
  {
    code: '00146',
    label: 'Anxiety',
    domain: 'Coping/Stress Tolerance',
    definingCharacteristics: [
      'Decrease in productivity',
      'Difficulty concentrating',
      'Excessive worry',
      'Extraneous movement (wringing hands, rocking)',
      'Facial tension',
      'Fearful',
      'Increased perspiration',
      'Increased tension',
      'Insomnia',
      'Preoccupied',
      'Self-focused',
      'Trembling or shakiness',
      'Worried about change in life events',
    ],
    relatedFactors: [
      'Change in economic status',
      'Change in environment',
      'Change in health status',
      'Change in role status',
      'Conflict about life goals',
      'Exposure to toxin',
      'Family history of anxiety',
      'Interpersonal contagion',
      'Threat of death',
      'Unmet needs',
    ],
    suggestedNOC: [
      'Anxiety Self-Control (1402)',
      'Coping (1302)',
      'Social Support (1504)',
    ],
    suggestedNIC: [
      'Anxiety Reduction (5820)',
      'Calming Technique (5880)',
      'Presence (5340)',
      'Therapeutic Touch (5465)',
    ],
  },
  {
    code: '00011',
    label: 'Constipation',
    domain: 'Elimination and Exchange',
    definingCharacteristics: [
      'Abdominal pain',
      'Abdominal tenderness with palpation',
      'Anorexia',
      'Atypical presentation in older adults (confusion)',
      'Borborygmi',
      'Bright red blood in stool',
      'Change in bowel pattern',
      'Decreased frequency of defecation',
      'Decreased volume of stool',
      'Distended abdomen',
      'Hard, formed stool',
      'Headache',
      'Hypoactive bowel sounds',
      'Inability to defecate',
      'Indigestion',
      'Nausea',
      'Straining with defecation',
      'Vomiting',
    ],
    relatedFactors: [
      'Abdominal muscle weakness',
      'Inadequate fiber intake',
      'Inadequate fluid intake',
      'Insufficient physical activity',
      'Laxative abuse',
      'Low caloric intake',
      'Medications (opioids, anticholinergics, calcium channel blockers)',
      'Mental health condition (depression, eating disorder)',
      'Recent environmental change',
    ],
    suggestedNOC: [
      'Bowel Elimination (0501)',
      'Hydration (0602)',
      'Symptom Control (1608)',
    ],
    suggestedNIC: [
      'Constipation/Impaction Management (0450)',
      'Fluid Management (4120)',
      'Exercise Promotion (0200)',
      'Nutrition Management (1100)',
    ],
  },
  {
    code: '00085',
    label: 'Impaired Physical Mobility',
    domain: 'Activity/Rest',
    definingCharacteristics: [
      'Decreased fine motor skills',
      'Decreased gross motor skills',
      'Decreased range of motion',
      'Difficulty turning over',
      'Dyspnea on exertion',
      'Gait disturbance',
      'Jerky movements',
      'Limited ability to perform gross motor skills',
      'Limited ability to perform fine motor skills',
      'Postural instability',
      'Slowed movement',
      'Tremor',
      'Uncoordinated movements',
    ],
    relatedFactors: [
      'Activity intolerance',
      'Anxiety',
      'Cognitive impairment',
      'Contractures',
      'Cultural beliefs regarding activity',
      'Decreased endurance',
      'Decreased muscle control',
      'Decreased muscle mass',
      'Decreased muscle strength',
      'Deficient knowledge about activity management',
      'Joint stiffness',
      'Musculoskeletal impairment',
      'Neuromuscular impairment',
      'Obesity',
      'Pain',
      'Sedentary lifestyle',
    ],
    suggestedNOC: [
      'Mobility (0208)',
      'Balance (0202)',
      'Fall Prevention Behavior (1909)',
    ],
    suggestedNIC: [
      'Exercise Therapy: Ambulation (0221)',
      'Exercise Therapy: Balance (0222)',
      'Fall Prevention (6490)',
      'Positioning (0840)',
    ],
  },
];

// ─── Step components ──────────────────────────────────────────────────────────

const STEPS = [
  'Select Diagnosis',
  'Defining Characteristics',
  'Related Factors',
  'NOC Outcomes',
  'NIC Interventions',
  'Preview & Export',
];

interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-6 flex items-center gap-0" role="list" aria-label="Care plan steps">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div
            role="listitem"
            aria-current={i === currentStep ? 'step' : undefined}
            className="flex flex-col items-center"
          >
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < currentStep
                  ? 'bg-teal-600 text-white'
                  : i === currentStep
                  ? 'border-2 border-teal-400 text-teal-400'
                  : 'border-2 border-slate-700 text-slate-600'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span
              className={`mt-1 hidden sm:block text-xs text-center max-w-[70px] leading-tight ${
                i === currentStep ? 'text-teal-400' : i < currentStep ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mb-5 mx-1 transition-colors ${
                i < currentStep ? 'bg-teal-600' : 'bg-slate-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CarePlan {
  diagnosis: NandaDiagnosis | null;
  selectedDefChars: string[];
  customDefChar: string;
  selectedRelatedFactors: string[];
  customRelatedFactor: string;
  patientGoal: string;
  selectedNOC: string[];
  selectedNIC: string[];
  priorityNotes: string;
}

const EMPTY_PLAN: CarePlan = {
  diagnosis: null,
  selectedDefChars: [],
  customDefChar: '',
  selectedRelatedFactors: [],
  customRelatedFactor: '',
  patientGoal: '',
  selectedNOC: [],
  selectedNIC: [],
  priorityNotes: '',
};

export default function CarePlanBuilder() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<CarePlan>({ ...EMPTY_PLAN });
  const [copied, setCopied] = useState(false);

  const toggleItem = (
    key: 'selectedDefChars' | 'selectedRelatedFactors' | 'selectedNOC' | 'selectedNIC',
    value: string
  ) => {
    setPlan((p) => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter((v) => v !== value)
        : [...p[key], value],
    }));
  };

  const canAdvance = (): boolean => {
    if (step === 0) return plan.diagnosis !== null;
    if (step === 1) return plan.selectedDefChars.length > 0 || plan.customDefChar.trim().length > 0;
    if (step === 2) return plan.selectedRelatedFactors.length > 0 || plan.customRelatedFactor.trim().length > 0;
    if (step === 3) return plan.selectedNOC.length > 0;
    if (step === 4) return plan.selectedNIC.length > 0;
    return true;
  };

  const generateText = (): string => {
    if (!plan.diagnosis) return '';
    const allDefChars = [
      ...plan.selectedDefChars,
      ...(plan.customDefChar.trim() ? [plan.customDefChar.trim()] : []),
    ];
    const allRelatedFactors = [
      ...plan.selectedRelatedFactors,
      ...(plan.customRelatedFactor.trim() ? [plan.customRelatedFactor.trim()] : []),
    ];

    return [
      `NURSING CARE PLAN`,
      ``,
      `NURSING DIAGNOSIS (NANDA-I)`,
      `${plan.diagnosis.label} (${plan.diagnosis.code})`,
      `Domain: ${plan.diagnosis.domain}`,
      ``,
      `DEFINING CHARACTERISTICS`,
      allDefChars.map((c) => `• ${c}`).join('\n'),
      ``,
      `RELATED FACTORS / ETIOLOGY`,
      allRelatedFactors.map((f) => `• ${f}`).join('\n'),
      ``,
      `PATIENT GOAL`,
      plan.patientGoal || '(not specified)',
      ``,
      `NOC OUTCOMES`,
      plan.selectedNOC.map((n) => `• ${n}`).join('\n'),
      ``,
      `NIC INTERVENTIONS`,
      plan.selectedNIC.map((n) => `• ${n}`).join('\n'),
      ...(plan.priorityNotes ? [``, `ADDITIONAL NOTES`, plan.priorityNotes] : []),
    ].join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateText());
    } catch {
      const el = document.createElement('textarea');
      el.value = generateText();
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPlan({ ...EMPTY_PLAN });
    setStep(0);
  };

  const diag = plan.diagnosis;

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Care Plan Builder</h2>
      <p className="mb-6 text-sm text-slate-400">
        Build a complete nursing care plan using NANDA-I diagnoses, NOC outcomes, and NIC interventions. Complete each step to generate a formatted care plan.
      </p>

      <StepIndicator currentStep={step} />

      {/* Step 0: Select diagnosis */}
      {step === 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Select a Nursing Diagnosis</h3>
          <div className="space-y-2">
            {DIAGNOSES.map((d) => (
              <button
                key={d.code}
                onClick={() => setPlan((p) => ({ ...p, diagnosis: d }))}
                className={`w-full text-left rounded-2xl border p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                  plan.diagnosis?.code === d.code
                    ? 'border-teal-500 bg-teal-900/20'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                }`}
                aria-pressed={plan.diagnosis?.code === d.code}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                      plan.diagnosis?.code === d.code
                        ? 'border-teal-400 bg-teal-400'
                        : 'border-slate-500'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {d.label}{' '}
                      <span className="text-xs text-slate-500 font-normal">({d.code})</span>
                    </p>
                    <p className="text-xs text-slate-500">Domain: {d.domain}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Defining characteristics */}
      {step === 1 && diag && (
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Defining Characteristics</h3>
          <p className="text-sm text-slate-400 mb-4">
            Select all defining characteristics present in your patient. These are the signs and symptoms (subjective and objective data) that support this diagnosis.
          </p>
          <div className="space-y-2 mb-4">
            {diag.definingCharacteristics.map((dc) => (
              <label
                key={dc}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  plan.selectedDefChars.includes(dc)
                    ? 'border-teal-500 bg-teal-900/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={plan.selectedDefChars.includes(dc)}
                  onChange={() => toggleItem('selectedDefChars', dc)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-slate-200">{dc}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Additional characteristic (optional)</label>
            <input
              type="text"
              value={plan.customDefChar}
              onChange={(e) => setPlan((p) => ({ ...p, customDefChar: e.target.value }))}
              placeholder="Enter a defining characteristic not listed above…"
              className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 2: Related factors */}
      {step === 2 && diag && (
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Related Factors (Etiology)</h3>
          <p className="text-sm text-slate-400 mb-4">
            Select the factors that are related to or contributing to this nursing diagnosis. These form the "related to" clause of the diagnostic statement.
          </p>
          <div className="space-y-2 mb-4">
            {diag.relatedFactors.map((rf) => (
              <label
                key={rf}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  plan.selectedRelatedFactors.includes(rf)
                    ? 'border-teal-500 bg-teal-900/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={plan.selectedRelatedFactors.includes(rf)}
                  onChange={() => toggleItem('selectedRelatedFactors', rf)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-slate-200">{rf}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Additional related factor (optional)</label>
            <input
              type="text"
              value={plan.customRelatedFactor}
              onChange={(e) => setPlan((p) => ({ ...p, customRelatedFactor: e.target.value }))}
              placeholder="Enter a related factor not listed above…"
              className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 3: NOC outcomes */}
      {step === 3 && diag && (
        <div>
          <h3 className="text-lg font-bold text-white mb-1">NOC Outcomes</h3>
          <p className="text-sm text-slate-400 mb-3">
            Select expected outcomes from the Nursing Outcomes Classification (NOC). Choose the outcomes most relevant to your patient's situation.
          </p>
          <div className="space-y-2 mb-4">
            {diag.suggestedNOC.map((noc) => (
              <label
                key={noc}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  plan.selectedNOC.includes(noc)
                    ? 'border-teal-500 bg-teal-900/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={plan.selectedNOC.includes(noc)}
                  onChange={() => toggleItem('selectedNOC', noc)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-slate-200">{noc}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Patient-specific goal statement</label>
            <textarea
              rows={3}
              value={plan.patientGoal}
              onChange={(e) => setPlan((p) => ({ ...p, patientGoal: e.target.value }))}
              placeholder='e.g., "Patient will maintain SpO2 ≥94% on room air by end of shift as evidenced by respiratory rate ≤20/min and unlabored breathing."'
              className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 4: NIC interventions */}
      {step === 4 && diag && (
        <div>
          <h3 className="text-lg font-bold text-white mb-1">NIC Interventions</h3>
          <p className="text-sm text-slate-400 mb-3">
            Select nursing interventions from the Nursing Interventions Classification (NIC) that you will implement to achieve the selected outcomes.
          </p>
          <div className="space-y-2 mb-4">
            {diag.suggestedNIC.map((nic) => (
              <label
                key={nic}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  plan.selectedNIC.includes(nic)
                    ? 'border-teal-500 bg-teal-900/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={plan.selectedNIC.includes(nic)}
                  onChange={() => toggleItem('selectedNIC', nic)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-slate-200">{nic}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Priority notes / rationale (optional)</label>
            <textarea
              rows={2}
              value={plan.priorityNotes}
              onChange={(e) => setPlan((p) => ({ ...p, priorityNotes: e.target.value }))}
              placeholder="Add clinical rationale or priority-setting notes…"
              className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 5: Preview */}
      {step === 5 && diag && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Your Care Plan</h3>
            <button
              onClick={handleCopy}
              className="rounded-xl border border-teal-500/30 px-4 py-1.5 text-sm text-teal-300 hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-200 font-mono leading-relaxed overflow-x-auto">
            {generateText()}
          </pre>
          <button
            onClick={handleReset}
            className="mt-4 rounded-xl border border-slate-600 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          >
            ↺ Build a New Care Plan
          </button>
        </div>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-2xl border border-slate-700 px-5 py-2.5 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="flex-1 rounded-2xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {step === 4 ? 'Preview Care Plan →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
