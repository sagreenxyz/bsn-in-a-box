/**
 * NandaReference.tsx
 *
 * Complete browsable NANDA-I nursing diagnosis reference.
 * Organized by domain with search. Each diagnosis shows:
 *   - NANDA-I code and label
 *   - Domain and class
 *   - Defining characteristics
 *   - Related factors
 *   - Suggested NOC outcomes
 *   - Suggested NIC interventions
 *
 * All data is bundled locally.
 */

import React, { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NandaDx {
  code: string;
  label: string;
  domain: string;
  class: string;
  type: 'problem-focused' | 'risk' | 'health-promotion' | 'syndrome';
  definingCharacteristics?: string[];
  riskFactors?: string[];
  relatedFactors?: string[];
  noc: string[];
  nic: string[];
}

// ─── Diagnosis data ───────────────────────────────────────────────────────────

const DIAGNOSES: NandaDx[] = [
  // Domain 1: Health Promotion
  {
    code: '00097',
    label: 'Deficient Diversional Activity Engagement',
    domain: 'Health Promotion',
    class: 'Health Management',
    type: 'problem-focused',
    definingCharacteristics: [
      'Boredom',
      'Discontent with situation',
      'Flat affect',
      'Frequent napping',
      'Physical deconditioning',
      'Restlessness',
    ],
    relatedFactors: [
      'Environmental lack of diversional activity',
      'Prolonged hospitalization',
      'Prolonged institutionalization',
    ],
    noc: ['Leisure Participation (1604)', 'Social Involvement (1503)'],
    nic: ['Activity Therapy (4310)', 'Recreation Therapy (5360)'],
  },
  {
    code: '00188',
    label: 'Risk-Prone Health Behavior',
    domain: 'Health Promotion',
    class: 'Health Management',
    type: 'problem-focused',
    definingCharacteristics: [
      'Failure to achieve optimal sense of control',
      'Failure to take action that prevents health problem',
      'Minimizes health status change',
      'Smoking',
      'Substance misuse',
    ],
    relatedFactors: [
      'Inadequate comprehension',
      'Inadequate social support',
      'Low self-efficacy',
      'Negative attitude toward health care',
    ],
    noc: ['Health Beliefs: Perceived Control (1702)', 'Health Promoting Behavior (1602)'],
    nic: ['Health Education (5510)', 'Self-Responsibility Facilitation (4480)'],
  },
  // Domain 2: Nutrition
  {
    code: '00027',
    label: 'Deficient Fluid Volume',
    domain: 'Nutrition',
    class: 'Hydration',
    type: 'problem-focused',
    definingCharacteristics: [
      'Altered mental status',
      'Decreased blood pressure',
      'Decreased pulse pressure',
      'Decreased skin turgor',
      'Decreased urine output',
      'Dry mucous membranes',
      'Increased heart rate',
      'Increased hematocrit',
      'Sudden weight loss',
      'Thirst',
      'Weakness',
    ],
    relatedFactors: ['Active fluid volume loss', 'Failure of regulatory mechanisms'],
    noc: ['Fluid Balance (0601)', 'Hydration (0602)', 'Electrolyte and Acid/Base Balance (0600)'],
    nic: ['Fluid Management (4120)', 'Fluid Monitoring (4130)', 'Intravenous Therapy (4200)', 'Hypovolemia Management (4180)'],
  },
  {
    code: '00026',
    label: 'Excess Fluid Volume',
    domain: 'Nutrition',
    class: 'Hydration',
    type: 'problem-focused',
    definingCharacteristics: [
      'Adventitious breath sounds (crackles)',
      'Altered blood pressure',
      'Altered respiratory pattern',
      'Anasarca',
      'Anxiety',
      'Decreased hematocrit',
      'Edema',
      'Electrolyte imbalance',
      'Increased central venous pressure',
      'Jugular vein distension',
      'Oliguria',
      'Orthopnea',
      'Pleural effusion',
      'Pulmonary congestion',
      'Restlessness',
      'Sudden weight gain',
    ],
    relatedFactors: ['Compromised regulatory mechanism', 'Excess fluid intake', 'Excess sodium intake'],
    noc: ['Fluid Balance (0601)', 'Electrolyte and Acid/Base Balance (0600)', 'Respiratory Status: Ventilation (0403)'],
    nic: ['Fluid Management (4120)', 'Fluid Monitoring (4130)', 'Medication Administration (2300)'],
  },
  {
    code: '00002',
    label: 'Imbalanced Nutrition: Less Than Body Requirements',
    domain: 'Nutrition',
    class: 'Ingestion',
    type: 'problem-focused',
    definingCharacteristics: [
      'Abdominal cramping',
      'Abdominal pain',
      'Altered taste sensation',
      'Body weight 20% or more below ideal body weight',
      'Brittle hair',
      'Capillary fragility',
      'Diarrhea',
      'Excessive hair loss',
      'Hyperactive bowel sounds',
      'Inadequate food intake',
      'Lack of food interest',
      'Lack of information',
      'Pale conjunctivae',
      'Perceived inability to ingest food',
      'Weakness of muscles required for swallowing',
      'Weight loss with adequate food intake',
    ],
    relatedFactors: [
      'Biological factors',
      'Economically disadvantaged',
      'Inadequate access to food',
      'Inadequate knowledge of nutrient needs',
      'Insufficient interest in food',
      'Psychological factors',
    ],
    noc: ['Nutritional Status (1004)', 'Weight: Body Mass (1006)', 'Appetite (1014)'],
    nic: ['Nutrition Management (1100)', 'Nutrition Therapy (1120)', 'Weight Gain Assistance (1240)'],
  },
  // Domain 3: Elimination
  {
    code: '00011',
    label: 'Constipation',
    domain: 'Elimination and Exchange',
    class: 'Gastrointestinal Function',
    type: 'problem-focused',
    definingCharacteristics: [
      'Abdominal pain',
      'Abdominal tenderness with palpation',
      'Anorexia',
      'Change in bowel pattern',
      'Decreased frequency of defecation',
      'Distended abdomen',
      'Hard, formed stool',
      'Hypoactive bowel sounds',
      'Inability to defecate',
      'Nausea',
      'Straining with defecation',
      'Vomiting',
    ],
    relatedFactors: [
      'Abdominal muscle weakness',
      'Inadequate fiber intake',
      'Inadequate fluid intake',
      'Insufficient physical activity',
      'Medications (opioids, anticholinergics)',
      'Mental health condition',
    ],
    noc: ['Bowel Elimination (0501)', 'Hydration (0602)', 'Symptom Control (1608)'],
    nic: ['Constipation/Impaction Management (0450)', 'Fluid Management (4120)', 'Exercise Promotion (0200)'],
  },
  {
    code: '00020',
    label: 'Functional Urinary Incontinence',
    domain: 'Elimination and Exchange',
    class: 'Urinary Function',
    type: 'problem-focused',
    definingCharacteristics: [
      'Able to completely empty bladder',
      'Early morning urinary incontinence',
      'Loss of urine before reaching toilet',
      'Senses need to void',
      'Time required to reach toilet is too long after urge',
    ],
    relatedFactors: [
      'Altered environmental factors',
      'Impaired cognition',
      'Impaired vision',
      'Neuromuscular impairment',
      'Psychological factors',
      'Weakened supporting pelvic structures',
    ],
    noc: ['Urinary Continence (0502)', 'Urinary Elimination (0503)'],
    nic: ['Urinary Incontinence Care (0610)', 'Prompted Voiding (0640)', 'Environmental Management (6480)'],
  },
  // Domain 4: Activity/Rest
  {
    code: '00032',
    label: 'Ineffective Breathing Pattern',
    domain: 'Activity/Rest',
    class: 'Respiratory Function',
    type: 'problem-focused',
    definingCharacteristics: [
      'Abnormal breathing rate',
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
      'Musculoskeletal impairment',
      'Neurological immaturity',
      'Obesity',
      'Pain',
      'Respiratory muscle fatigue',
    ],
    noc: ['Respiratory Status: Ventilation (0403)', 'Vital Signs (0802)', 'Anxiety Self-Control (1402)'],
    nic: ['Airway Management (3140)', 'Respiratory Monitoring (3350)', 'Positioning (0840)', 'Anxiety Reduction (5820)'],
  },
  {
    code: '00085',
    label: 'Impaired Physical Mobility',
    domain: 'Activity/Rest',
    class: 'Activity/Exercise',
    type: 'problem-focused',
    definingCharacteristics: [
      'Decreased fine motor skills',
      'Decreased gross motor skills',
      'Decreased range of motion',
      'Difficulty turning over',
      'Dyspnea on exertion',
      'Gait disturbance',
      'Postural instability',
      'Slowed movement',
      'Uncoordinated movements',
    ],
    relatedFactors: [
      'Activity intolerance',
      'Anxiety',
      'Cognitive impairment',
      'Decreased endurance',
      'Decreased muscle strength',
      'Musculoskeletal impairment',
      'Neuromuscular impairment',
      'Obesity',
      'Pain',
      'Sedentary lifestyle',
    ],
    noc: ['Mobility (0208)', 'Balance (0202)', 'Fall Prevention Behavior (1909)'],
    nic: ['Exercise Therapy: Ambulation (0221)', 'Exercise Therapy: Balance (0222)', 'Fall Prevention (6490)', 'Positioning (0840)'],
  },
  {
    code: '00095',
    label: 'Insomnia',
    domain: 'Activity/Rest',
    class: 'Sleep/Rest',
    type: 'problem-focused',
    definingCharacteristics: [
      'Alteration in affect',
      'Alteration in concentration',
      'Alteration in mood',
      'Decreased health status',
      'Decreased quality of life',
      'Difficulty falling asleep',
      'Difficulty maintaining sleep state',
      'Dissatisfaction with sleep',
      'Early awakening',
      'Fatigue',
      'Increased absenteeism from work/school',
      'Increased accident-proneness',
      'Insufficient energy',
      'Non-restorative sleep',
      'Prolonged reaction time',
      'Reports waking up too early',
    ],
    relatedFactors: [
      'Anxiety',
      'Average daily physical activity less than recommended',
      'Consumption of caffeinated beverages before sleeping',
      'Excessive daytime napping',
      'Fear',
      'Frequent napping during the day',
      'High level of occupational stress',
      'Inadequate sleep hygiene',
      'Noisy environment',
      'Pain',
      'Physical discomfort',
      'Stressors',
    ],
    noc: ['Sleep (0004)', 'Rest (0003)', 'Anxiety Self-Control (1402)'],
    nic: ['Sleep Enhancement (1850)', 'Relaxation Therapy (6040)', 'Environmental Management: Comfort (6482)'],
  },
  // Domain 5: Perception/Cognition
  {
    code: '00128',
    label: 'Acute Confusion',
    domain: 'Perception/Cognition',
    class: 'Cognition',
    type: 'problem-focused',
    definingCharacteristics: [
      'Agitation',
      'Alteration in cognitive functioning',
      'Alteration in level of consciousness',
      'Alteration in psychomotor functioning',
      'Hallucinations',
      'Inability to initiate goal-directed behavior',
      'Lack of motivation to follow through with goal-directed behavior',
      'Restlessness',
    ],
    relatedFactors: [
      'Alteration in sleep-wake cycle',
      'Dehydration',
      'Infection',
      'Metabolic dysfunction',
      'Pain',
      'Pharmaceutical agents',
      'Substance abuse',
      'Urinary retention',
    ],
    noc: ['Cognition (0900)', 'Neurological Status: Consciousness (0912)', 'Information Processing (0907)'],
    nic: ['Delirium Management (6440)', 'Cognitive Stimulation (4720)', 'Reality Orientation (4820)', 'Environmental Management: Safety (6486)'],
  },
  // Domain 6: Self-Perception
  {
    code: '00119',
    label: 'Chronic Low Self-Esteem',
    domain: 'Self-Perception',
    class: 'Self-Concept',
    type: 'problem-focused',
    definingCharacteristics: [
      'Dependent behavior',
      'Excessive guilt',
      'Excessive seeking of reassurance',
      'Exaggerates negative feedback about self',
      'Hesitant to try new things/situations',
      'Indecisive behavior',
      'Lack of eye contact',
      'Negative feelings about self',
      'Non-assertive behavior',
      'Overly conforming behavior',
      'Passivity',
      'Poor posture',
      'Rejection of positive feedback about self',
      'Reports feeling of shame',
      'Self-negating verbalization',
    ],
    relatedFactors: [
      'Alteration in body image',
      'Conflict about values',
      'Cultural incongruence',
      'Disturbed thought processes',
      'Excessive criticism from others',
      'Failure',
      'History of abuse',
      'Inadequate group membership',
      'Perceived lack of belonging',
    ],
    noc: ['Self-Esteem (1205)', 'Body Image (1200)', 'Coping (1302)'],
    nic: ['Self-Esteem Enhancement (5400)', 'Presence (5340)', 'Emotional Support (5270)'],
  },
  // Domain 7: Role Relationships
  {
    code: '00061',
    label: 'Caregiver Role Strain',
    domain: 'Role Relationships',
    class: 'Caregiving Roles',
    type: 'problem-focused',
    definingCharacteristics: [
      'Alteration in caregiver health status',
      'Caregiver not developmentally ready for caregiving role',
      'Depression',
      'Dysfunctional change in caregiving activities',
      'Exhaustion',
      'Impatience',
      'Inability to complete caregiving tasks',
      'Preoccupation with caregiving routine',
      'Reports decreased caregiver health status',
      'Somatization',
      'Stress',
    ],
    relatedFactors: [
      'Care receiver health impairment severity',
      'Caregiver health impairment',
      'Caregiver not developmentally ready for caregiving role',
      'Complexity of activities',
      'Duration of caregiving required',
      'Inadequate physical environment for providing care',
      'Inadequate social support',
      'Insufficient time',
    ],
    noc: ['Caregiver Emotional Health (2506)', 'Caregiver Stressors (2208)', 'Coping (1302)'],
    nic: ['Caregiver Support (7040)', 'Family Support (7140)', 'Respite Care (7260)', 'Support System Enhancement (5440)'],
  },
  // Domain 9: Coping/Stress Tolerance
  {
    code: '00146',
    label: 'Anxiety',
    domain: 'Coping/Stress Tolerance',
    class: 'Coping Responses',
    type: 'problem-focused',
    definingCharacteristics: [
      'Decrease in productivity',
      'Difficulty concentrating',
      'Excessive worry',
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
      'Stressors',
      'Threat of death',
      'Unmet needs',
    ],
    noc: ['Anxiety Self-Control (1402)', 'Coping (1302)', 'Social Support (1504)'],
    nic: ['Anxiety Reduction (5820)', 'Calming Technique (5880)', 'Presence (5340)'],
  },
  {
    code: '00069',
    label: 'Ineffective Coping',
    domain: 'Coping/Stress Tolerance',
    class: 'Coping Responses',
    type: 'problem-focused',
    definingCharacteristics: [
      'Alteration in concentration',
      'Change in communication pattern',
      'Decreased use of social support',
      'Destructive behavior toward others',
      'Destructive behavior toward self',
      'Difficulty organizing information',
      'Fatigue',
      'High illness rate',
      'Inability to ask for help',
      'Inability to attend to information',
      'Inability to meet basic needs',
      'Insufficient access to support',
      'Insufficient goal-directed behavior',
      'Insufficient problem-solving skills',
      'Insufficient social support',
      'Substance misuse',
    ],
    relatedFactors: [
      'Disturbed thought processes',
      'Failure to intend to change behavior',
      'High degree of threat',
      'Inability to conserve adaptive energies',
      'Inadequate level of confidence in ability to cope',
      'Inadequate resources available',
      'Inadequate social support created by characteristics of relationships',
      'Inadequate social support',
      'Maturational crisis',
      'Situational crisis',
      'Uncertainty',
    ],
    noc: ['Coping (1302)', 'Decision-Making (0906)', 'Information Processing (0907)'],
    nic: ['Coping Enhancement (5230)', 'Crisis Intervention (6160)', 'Emotional Support (5270)'],
  },
  // Domain 11: Safety/Protection
  {
    code: '00004',
    label: 'Risk for Infection',
    domain: 'Safety/Protection',
    class: 'Infection',
    type: 'risk',
    riskFactors: [
      'Alteration in skin integrity',
      'Chronic disease',
      'Immunosuppression',
      'Inadequate primary defenses',
      'Inadequate vaccination',
      'Invasive procedure',
      'Malnutrition',
    ],
    noc: ['Infection Severity (0703)', 'Risk Control: Infectious Process (1924)', 'Wound Healing: Primary Intention (1102)'],
    nic: ['Infection Control (6540)', 'Infection Protection (6550)', 'Wound Care (3660)'],
  },
  {
    code: '00046',
    label: 'Impaired Skin Integrity',
    domain: 'Safety/Protection',
    class: 'Physical Injury',
    type: 'problem-focused',
    definingCharacteristics: [
      'Alteration in skin integrity',
      'Altered sensation in affected area',
      'Bleeding',
      'Foreign matter piercing skin',
      'Localized area hot to touch',
    ],
    relatedFactors: [
      'External: humidity, hyperthermia, pressure over bony prominence',
      'Internal: impaired circulation, decreased activity/mobility',
      'Inadequate nutrition',
      'Medications (corticosteroids)',
      'Moisture (incontinence, diaphoresis)',
    ],
    noc: ['Wound Healing: Primary Intention (1102)', 'Tissue Integrity: Skin and Mucous Membranes (1101)'],
    nic: ['Wound Care (3660)', 'Pressure Ulcer Prevention (3540)', 'Skin Surveillance (3590)'],
  },
  {
    code: '00035',
    label: 'Risk for Injury',
    domain: 'Safety/Protection',
    class: 'Physical Injury',
    type: 'risk',
    riskFactors: [
      'Altered mobility',
      'Biochemical or regulatory dysfunction',
      'Cognitive impairment',
      'Developmental characteristics',
      'Effector dysfunction',
      'Exposure to pathogen',
      'Exposure to toxic chemicals',
      'Immune-autoimmune dysfunction',
      'Malnutrition',
      'Neurosensory dysfunction',
      'Profiling abnormality',
      'Psychomotor dysfunction',
    ],
    noc: ['Risk Control (1902)', 'Fall Prevention Behavior (1909)', 'Safety Behavior: Fall Prevention (1909)'],
    nic: ['Fall Prevention (6490)', 'Environmental Management: Safety (6486)', 'Surveillance: Safety (6654)'],
  },
  // Domain 12: Comfort
  {
    code: '00132',
    label: 'Acute Pain',
    domain: 'Comfort',
    class: 'Physical Comfort',
    type: 'problem-focused',
    definingCharacteristics: [
      'Diaphoresis',
      'Distraction behavior',
      'Evidence of pain using validated observation tool',
      'Expressive behavior (crying, moaning)',
      'Facial expression of pain',
      'Guarding behavior',
      'Protective behavior',
      'Pupil dilation',
      'Self-report of pain intensity',
      'Tachycardia',
    ],
    relatedFactors: [
      'Biological injury agent (inflammation, infection)',
      'Chemical injury agent',
      'Physical injury agent (trauma, surgery, procedure)',
    ],
    noc: ['Pain Level (2102)', 'Pain Control (1605)', 'Comfort Status (2008)'],
    nic: ['Pain Management (1400)', 'Analgesic Administration (2210)', 'Non-Pharmacological Comfort Measures (1340)'],
  },
  {
    code: '00133',
    label: 'Chronic Pain',
    domain: 'Comfort',
    class: 'Physical Comfort',
    type: 'problem-focused',
    definingCharacteristics: [
      'Alteration in ability to continue previous activities',
      'Alteration in sleep pattern',
      'Anorexia',
      'Evidence of pain using standardized pain behavior checklist',
      'Expressions of pain',
      'Facial expression of pain',
      'Reports decreased ability to participate in recreational activities',
      'Restlessness',
      'Self-focused',
    ],
    relatedFactors: [
      'Age > 50',
      'Alteration in sleep pattern',
      'Body mass index > 30',
      'Emotional distress',
      'Fatigue',
      'Injury agent',
      'Prolonged computer use',
      'Social isolation',
    ],
    noc: ['Chronic Pain Control (2101)', 'Depression Level (1208)', 'Quality of Life (2000)'],
    nic: ['Pain Management: Chronic (1415)', 'Coping Enhancement (5230)', 'Sleep Enhancement (1850)'],
  },
];

// ─── Domain grouping ──────────────────────────────────────────────────────────

const DOMAINS = [...new Set(DIAGNOSES.map((d) => d.domain))].sort();

const TYPE_LABELS: Record<string, string> = {
  'problem-focused': 'Problem-Focused',
  risk: 'Risk',
  'health-promotion': 'Health Promotion',
  syndrome: 'Syndrome',
};

const TYPE_COLORS: Record<string, string> = {
  'problem-focused': 'text-teal-400 border-teal-500/30',
  risk: 'text-orange-400 border-orange-500/30',
  'health-promotion': 'text-green-400 border-green-500/30',
  syndrome: 'text-purple-400 border-purple-500/30',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function NandaReference() {
  const [query, setQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DIAGNOSES.filter((d) => {
      const matchDomain = selectedDomain === 'All' || d.domain === selectedDomain;
      const matchQuery =
        !q ||
        d.label.toLowerCase().includes(q) ||
        d.code.includes(q) ||
        d.domain.toLowerCase().includes(q) ||
        d.class.toLowerCase().includes(q);
      return matchDomain && matchQuery;
    });
  }, [query, selectedDomain]);

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">
        NANDA-I Nursing Diagnoses
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        {DIAGNOSES.length} nursing diagnoses organized by domain. Each entry includes defining
        characteristics (or risk factors), related factors, and suggested NOC/NIC pairings.
        Consistent with NANDA International Taxonomy II.
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search diagnoses, codes, or domains…"
          className="flex-1 rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
          aria-label="Search nursing diagnoses"
        />
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 focus:border-teal-500 focus:outline-none text-sm"
          aria-label="Filter by domain"
        >
          <option value="All">All Domains</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <p className="text-xs text-slate-500 mb-3">
        {filtered.length} diagnosis{filtered.length !== 1 ? 'es' : ''}
        {query || selectedDomain !== 'All' ? ' matching your filter' : ''}
      </p>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center">
          <p className="text-slate-400">No diagnoses match your search.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((dx) => {
          const isOpen = expanded === dx.code;
          const typeColor = TYPE_COLORS[dx.type] ?? 'text-slate-400 border-slate-600';

          return (
            <div key={dx.code} className="rounded-2xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : dx.code)}
                className="w-full text-left p-4 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                aria-expanded={isOpen}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">{dx.code}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${typeColor}`}
                      >
                        {TYPE_LABELS[dx.type]}
                      </span>
                    </div>
                    <p className="font-serif font-bold text-white text-sm">{dx.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Domain: {dx.domain} · Class: {dx.class}
                    </p>
                  </div>
                  <span
                    className="text-slate-500 text-lg flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 px-4 pb-4 pt-3 space-y-4">
                  {dx.definingCharacteristics && dx.definingCharacteristics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                        Defining Characteristics
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                        {dx.definingCharacteristics.map((c) => (
                          <li key={c} className="text-sm text-slate-300 flex items-start gap-1.5">
                            <span className="text-teal-500 flex-shrink-0 mt-0.5">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dx.riskFactors && dx.riskFactors.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                        Risk Factors
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                        {dx.riskFactors.map((f) => (
                          <li key={f} className="text-sm text-slate-300 flex items-start gap-1.5">
                            <span className="text-orange-500 flex-shrink-0 mt-0.5">•</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dx.relatedFactors && dx.relatedFactors.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-2">
                        Related Factors
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                        {dx.relatedFactors.map((f) => (
                          <li key={f} className="text-sm text-slate-300 flex items-start gap-1.5">
                            <span className="text-yellow-500 flex-shrink-0 mt-0.5">•</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Suggested NOC Outcomes
                      </h4>
                      <ul className="space-y-1">
                        {dx.noc.map((n) => (
                          <li key={n} className="text-sm text-slate-300">
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Suggested NIC Interventions
                      </h4>
                      <ul className="space-y-1">
                        {dx.nic.map((n) => (
                          <li key={n} className="text-sm text-slate-300">
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
