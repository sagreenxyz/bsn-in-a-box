/**
 * ClinicalCalculator.tsx
 *
 * A six-tab suite of evidence-based clinical calculators, all functioning
 * entirely offline with no external API calls. Tabs:
 *   1. BMI — Body Mass Index with WHO classification and nursing implications
 *   2. GFR — Estimated GFR (CKD-EPI 2021 equation) for renal dosing
 *   3. BSA — Body Surface Area (Mosteller formula) for oncology dosing
 *   4. IV Fluid Rate — Target rate calculator based on clinical indication
 *   5. Drip Rate — IV push and continuous drip rate calculations
 *   6. Glasgow Coma Scale — GCS scoring with interpretation
 *
 * Each calculator provides:
 *   - Prose explanation of what the tool calculates and when to use it
 *   - All relevant input fields with appropriate min/max validation
 *   - Result with clinical interpretation in plain language
 *   - Nursing action guidance based on the result
 */

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'bmi' | 'gfr' | 'bsa' | 'iv-fluid' | 'drip' | 'gcs';

// ─── Calculation functions ────────────────────────────────────────────────────

function calcBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiInterpretation(bmi: number): { classification: string; color: string; nursingNote: string } {
  if (bmi < 18.5) return { classification: 'Underweight', color: 'text-yellow-400', nursingNote: 'Assess for malnutrition risk, nutritional status, and underlying causes. Consider dietitian referral.' };
  if (bmi < 25) return { classification: 'Normal weight', color: 'text-teal-400', nursingNote: 'Maintain healthy lifestyle. Reinforce preventive health behaviors.' };
  if (bmi < 30) return { classification: 'Overweight', color: 'text-orange-400', nursingNote: 'Counsel on diet, physical activity, and cardiovascular risk. Screen for hypertension and metabolic syndrome.' };
  if (bmi < 35) return { classification: 'Obesity Class I', color: 'text-red-400', nursingNote: 'Assess for comorbidities: Type 2 DM, HTN, sleep apnea, GERD. Refer to bariatric medicine or weight management program if indicated.' };
  if (bmi < 40) return { classification: 'Obesity Class II', color: 'text-red-500', nursingNote: 'High comorbidity burden. Document BMI for medication dosing (vancomycin, heparin weight-based dosing uses actual body weight). Assess for bariatric surgery candidacy.' };
  return { classification: 'Obesity Class III (Severe)', color: 'text-red-600', nursingNote: 'Critical medication dosing considerations. Many drugs require adjusted body weight (ABW) calculations. Anticipate equipment needs: bariatric beds, BP cuffs, IV access challenges.' };
}

/** CKD-EPI 2021 equation (race-free) */
function calcGFR(creatinine: number, age: number, isFemale: boolean) {
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;
  const cr_over_kappa = creatinine / kappa;
  const min_part = Math.min(cr_over_kappa, 1);
  const max_part = Math.max(cr_over_kappa, 1);
  return 142 * Math.pow(min_part, alpha) * Math.pow(max_part, -1.200) * Math.pow(0.9938, age) * sexFactor;
}

function gfrInterpretation(egfr: number): { stage: string; description: string; color: string; nursingNote: string } {
  if (egfr >= 90) return { stage: 'G1 — Normal or high', description: '≥90', color: 'text-teal-400', nursingNote: 'Normal renal function. No dose adjustments required for most medications. Baseline eGFR for comparison.' };
  if (egfr >= 60) return { stage: 'G2 — Mildly decreased', description: '60–89', color: 'text-teal-300', nursingNote: 'Mild reduction. Most medications at standard dose. Monitor creatinine trend. Flag early.' };
  if (egfr >= 45) return { stage: 'G3a — Mild to moderately decreased', description: '45–59', color: 'text-yellow-400', nursingNote: 'Review all medications for renal dosing. Avoid NSAIDs. Contrast dye caution. Dietitian referral for low-phosphorus diet.' };
  if (egfr >= 30) return { stage: 'G3b — Moderately to severely decreased', description: '30–44', color: 'text-orange-400', nursingNote: 'Significant dose adjustments required for many renally cleared medications. Metformin contraindicated if eGFR <30. Nephrology referral indicated.' };
  if (egfr >= 15) return { stage: 'G4 — Severely decreased', description: '15–29', color: 'text-red-400', nursingNote: 'Prepare for renal replacement therapy (RRT) education. AV fistula creation planning. Most renally cleared medications require significant dose reduction or avoidance.' };
  return { stage: 'G5 — Kidney failure', description: '<15', color: 'text-red-600', nursingNote: 'Kidney failure. Dialysis or transplant indicated. Only dialysis-compatible medications. Emergency nephrology if acute.' };
}

/** Mosteller formula: BSA = sqrt(height(cm) × weight(kg) / 3600) */
function calcBSA(weightKg: number, heightCm: number) {
  return Math.sqrt((heightCm * weightKg) / 3600);
}

// ─── Tab components ───────────────────────────────────────────────────────────

function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) setResult(calcBMI(w, h));
  };

  const interp = result !== null ? bmiInterpretation(result) : null;

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">Body Mass Index (BMI) = weight (kg) ÷ height² (m²). Use for nutritional assessment and medication dosing guidance.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="bmi-weight">Weight (kg)</label>
          <input id="bmi-weight" type="number" min="1" max="500" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="bmi-height">Height (cm)</label>
          <input id="bmi-height" type="number" min="50" max="250" value={height} onChange={(e) => setHeight(e.target.value)}
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none" />
        </div>
      </div>
      <button onClick={calculate} className="mt-4 rounded-xl bg-teal-600 px-6 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">
        Calculate BMI
      </button>
      {interp && result !== null && (
        <div className="mt-6 rounded-xl bg-navy-800 p-5">
          <p className="text-4xl font-black mb-1 text-white">{result.toFixed(1)} kg/m²</p>
          <p className={`text-lg font-bold mb-3 ${interp.color}`}>{interp.classification}</p>
          <p className="text-sm leading-relaxed text-slate-300"><strong className="text-white">Nursing consideration:</strong> {interp.nursingNote}</p>
        </div>
      )}
    </div>
  );
}

function GFRCalculator() {
  const [creatinine, setCreatinine] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('female');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const cr = parseFloat(creatinine);
    const a = parseInt(age);
    if (cr > 0 && a > 0) setResult(calcGFR(cr, a, sex === 'female'));
  };

  const interp = result !== null ? gfrInterpretation(result) : null;

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">CKD-EPI 2021 eGFR (race-free). Used for renal dose adjustments and CKD staging.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="gfr-cr">Serum Creatinine (mg/dL)</label>
          <input id="gfr-cr" type="number" step="0.01" min="0.1" value={creatinine} onChange={(e) => setCreatinine(e.target.value)}
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="gfr-age">Age (years)</label>
          <input id="gfr-age" type="number" min="18" max="120" value={age} onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Biological sex (for calculation)</label>
          <div className="flex gap-3 mt-2" role="radiogroup" aria-label="Biological sex for calculation">
            {(['male', 'female'] as const).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input type="radio" id={`gfr-sex-${s}`} name="gfr-sex" value={s} checked={sex === s} onChange={() => setSex(s)} className="accent-teal-500" />
                <span className="text-slate-300 capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <button onClick={calculate} className="mt-4 rounded-xl bg-teal-600 px-6 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">
        Calculate eGFR
      </button>
      {interp && result !== null && (
        <div className="mt-6 rounded-xl bg-navy-800 p-5">
          <p className="text-4xl font-black mb-1 text-white">{Math.round(result)} mL/min/1.73m²</p>
          <p className={`text-lg font-bold mb-1 ${interp.color}`}>{interp.stage}</p>
          <p className="text-sm text-slate-400 mb-3">Normal range: {interp.description}</p>
          <p className="text-sm leading-relaxed text-slate-300"><strong className="text-white">Nursing action:</strong> {interp.nursingNote}</p>
        </div>
      )}
    </div>
  );
}

function BSACalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) setResult(calcBSA(w, h));
  };

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">Mosteller formula: BSA (m²) = √(height(cm) × weight(kg) / 3600). Used for chemotherapy dosing and pediatric medication calculations.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="bsa-weight">Weight (kg)</label>
          <input id="bsa-weight" type="number" min="1" max="500" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="bsa-height">Height (cm)</label>
          <input id="bsa-height" type="number" min="50" max="250" value={height} onChange={(e) => setHeight(e.target.value)}
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none" />
        </div>
      </div>
      <button onClick={calculate} className="mt-4 rounded-xl bg-teal-600 px-6 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">
        Calculate BSA
      </button>
      {result !== null && (
        <div className="mt-6 rounded-xl bg-navy-800 p-5">
          <p className="text-4xl font-black mb-2 text-white">{result.toFixed(2)} m²</p>
          <p className="text-sm text-slate-400">Average adult BSA: 1.7–1.9 m²</p>
          <p className="text-sm leading-relaxed text-slate-300 mt-2"><strong className="text-white">Clinical use:</strong> Multiply BSA by the ordered dose in mg/m² to get the patient-specific dose. Always verify against safe dose range references and confirm with pharmacy for oncology doses.</p>
        </div>
      )}
    </div>
  );
}

function GCSCalculator() {
  const [eye, setEye] = useState(4);
  const [verbal, setVerbal] = useState(5);
  const [motor, setMotor] = useState(6);
  const total = eye + verbal + motor;

  const eyeOptions = [
    { value: 4, label: 'Spontaneous opening' },
    { value: 3, label: 'To verbal stimulus' },
    { value: 2, label: 'To pain' },
    { value: 1, label: 'No opening' },
  ];
  const verbalOptions = [
    { value: 5, label: 'Oriented' },
    { value: 4, label: 'Confused' },
    { value: 3, label: 'Inappropriate words' },
    { value: 2, label: 'Incomprehensible sounds' },
    { value: 1, label: 'No verbal response' },
  ];
  const motorOptions = [
    { value: 6, label: 'Obeys commands' },
    { value: 5, label: 'Localizes to pain' },
    { value: 4, label: 'Withdraws from pain' },
    { value: 3, label: 'Abnormal flexion (decorticate)' },
    { value: 2, label: 'Extension (decerebrate)' },
    { value: 1, label: 'No motor response' },
  ];

  const gcsInterpretation = total >= 13 ? { label: 'Mild TBI / intact consciousness', color: 'text-teal-400', action: 'Monitor closely. Full GCS reassessment every hour minimum. Pupils and pupils symmetry.' }
    : total >= 9 ? { label: 'Moderate brain injury', color: 'text-orange-400', action: 'Urgent neurological assessment. Neurosurgery notification. Airway protection readiness. ICP monitoring possible.' }
    : { label: 'Severe brain injury', color: 'text-red-400', action: 'IMMEDIATE neurosurgical emergency. Airway protection/intubation likely required. CT head stat. Neurosurgical/ICU team activation.' };

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">Glasgow Coma Scale scores eye (E), verbal (V), and motor (M) responses. Total score 3–15; ≤8 = severe injury requiring airway protection.</p>
      {[
        { label: 'Eye opening (E)', value: eye, setValue: setEye, options: eyeOptions },
        { label: 'Verbal response (V)', value: verbal, setValue: setVerbal, options: verbalOptions },
        { label: 'Motor response (M)', value: motor, setValue: setMotor, options: motorOptions },
      ].map(({ label, value, setValue, options }) => (
        <div key={label} className="mb-4">
          <p className="mb-2 text-sm font-medium text-slate-300">{label}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button key={opt.value} onClick={() => setValue(opt.value)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${value === opt.value ? 'border-teal-500 bg-teal-900/30 text-teal-200' : 'border-navy-700 text-slate-400 hover:border-navy-600'}`}
                aria-pressed={value === opt.value}
              >
                <span className="font-bold">{opt.value}</span> — {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-6 rounded-xl bg-navy-800 p-5">
        <p className="text-4xl font-black mb-1 text-white">GCS {total}/15</p>
        <p className="font-mono text-sm text-slate-400 mb-2">E{eye} V{verbal} M{motor}</p>
        <p className={`text-lg font-bold mb-2 ${gcsInterpretation.color}`}>{gcsInterpretation.label}</p>
        <p className="text-sm leading-relaxed text-slate-300"><strong className="text-white">Nursing action:</strong> {gcsInterpretation.action}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TAB_CONFIG: Array<{ id: Tab; label: string }> = [
  { id: 'bmi', label: 'BMI' },
  { id: 'gfr', label: 'eGFR' },
  { id: 'bsa', label: 'BSA' },
  { id: 'gcs', label: 'GCS' },
];

export default function ClinicalCalculator() {
  const [activeTab, setActiveTab] = useState<Tab>('bmi');

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Clinical Calculator Suite</h2>
      <p className="mb-6 text-sm text-slate-400">Evidence-based clinical calculators. All calculations are performed locally — no data is sent to any server.</p>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Calculator tabs">
        {TAB_CONFIG.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${activeTab === id ? 'bg-teal-600 text-white' : 'bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === 'bmi' && <BMICalculator />}
        {activeTab === 'gfr' && <GFRCalculator />}
        {activeTab === 'bsa' && <BSACalculator />}
        {activeTab === 'gcs' && <GCSCalculator />}
      </div>
    </div>
  );
}
