/**
 * MedicalTerminology.tsx
 *
 * Medical terminology reference with three learning modes:
 *   1. Browse — searchable table of 37+ terms with root/prefix/suffix deconstruction
 *   2. Parts — searchable list of all prefixes, combining forms, and suffixes
 *   3. Flash — flashcard-style rapid review of term meanings and word components
 *
 * All data bundled locally.
 */

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PartType = 'prefix' | 'root' | 'suffix' | 'combining';

interface TermPart {
  part: string;
  type: PartType;
  meaning: string;
  examples?: string[];
}

interface MedTerm {
  term: string;
  pronunciation?: string;
  meaning: string;
  parts: TermPart[];
  category: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PARTS: TermPart[] = [
  // Prefixes
  { part: 'a-/an-', type: 'prefix', meaning: 'without, not, absence of', examples: ['apnea (without breathing)', 'anemia (without blood)', 'anuria (without urine)'] },
  { part: 'brady-', type: 'prefix', meaning: 'slow', examples: ['bradycardia (slow heart)', 'bradypnea (slow breathing)'] },
  { part: 'tachy-', type: 'prefix', meaning: 'fast, rapid', examples: ['tachycardia (fast heart)', 'tachypnea (fast breathing)'] },
  { part: 'hyper-', type: 'prefix', meaning: 'above, excessive, increased', examples: ['hypertension (high blood pressure)', 'hyperglycemia (high blood glucose)', 'hyperthermia (high temperature)'] },
  { part: 'hypo-', type: 'prefix', meaning: 'below, deficient, decreased', examples: ['hypotension (low blood pressure)', 'hypoglycemia (low blood glucose)', 'hypothermia (low temperature)'] },
  { part: 'dys-', type: 'prefix', meaning: 'difficult, painful, abnormal', examples: ['dyspnea (difficult breathing)', 'dysphagia (difficulty swallowing)', 'dysrhythmia (abnormal rhythm)'] },
  { part: 'eu-', type: 'prefix', meaning: 'normal, good, well', examples: ['eupnea (normal breathing)', 'euthyroid (normal thyroid)'] },
  { part: 'hemi-', type: 'prefix', meaning: 'half', examples: ['hemiplegia (half-body paralysis)', 'hemianopia (half visual field loss)'] },
  { part: 'poly-', type: 'prefix', meaning: 'many, much, excessive', examples: ['polydipsia (excessive thirst)', 'polyuria (excessive urination)', 'polyarthritis (many joints)'] },
  { part: 'peri-', type: 'prefix', meaning: 'around, surrounding', examples: ['pericardium (around the heart)', 'peritoneum (around the abdomen)', 'peristalsis (around + contraction)'] },
  { part: 'endo-', type: 'prefix', meaning: 'within, inner', examples: ['endocardium (inner heart lining)', 'endoscopy (looking within)', 'endotracheal (within the trachea)'] },
  { part: 'inter-', type: 'prefix', meaning: 'between', examples: ['intercostal (between ribs)', 'interstitial (between tissues)'] },
  { part: 'intra-', type: 'prefix', meaning: 'within, inside', examples: ['intravenous (within a vein)', 'intramuscular (within muscle)', 'intracranial (within the skull)'] },
  { part: 'sub-', type: 'prefix', meaning: 'under, below', examples: ['subcutaneous (under the skin)', 'sublingual (under the tongue)', 'subarachnoid (under the arachnoid)'] },
  { part: 'trans-', type: 'prefix', meaning: 'through, across', examples: ['transdermal (through the skin)', 'transfusion (through infusion)'] },
  { part: 'pre-', type: 'prefix', meaning: 'before', examples: ['preoperative (before surgery)', 'prenatal (before birth)'] },
  { part: 'post-', type: 'prefix', meaning: 'after', examples: ['postoperative (after surgery)', 'postnatal (after birth)'] },
  { part: 'anti-', type: 'prefix', meaning: 'against', examples: ['antibiotic (against bacteria)', 'anticoagulant (against clotting)'] },
  { part: 'macro-', type: 'prefix', meaning: 'large', examples: ['macrocyte (large cell)', 'macroadenoma (large gland tumor)'] },
  { part: 'micro-', type: 'prefix', meaning: 'small', examples: ['microcyte (small cell)', 'microorganism (small organism)'] },
  // Roots / combining forms
  { part: 'cardi/o', type: 'combining', meaning: 'heart', examples: ['cardiology', 'carditis', 'cardiomegaly'] },
  { part: 'pneum/o', type: 'combining', meaning: 'lung, air', examples: ['pneumonia', 'pneumothorax', 'pneumonectomy'] },
  { part: 'hepat/o', type: 'combining', meaning: 'liver', examples: ['hepatitis', 'hepatomegaly', 'hepatectomy'] },
  { part: 'nephr/o', type: 'combining', meaning: 'kidney', examples: ['nephritis', 'nephrology', 'nephrectomy'] },
  { part: 'ren/o', type: 'combining', meaning: 'kidney', examples: ['renal', 'renin'] },
  { part: 'neur/o', type: 'combining', meaning: 'nerve', examples: ['neurology', 'neuritis', 'neuropathy'] },
  { part: 'arthr/o', type: 'combining', meaning: 'joint', examples: ['arthritis', 'arthroscopy', 'arthroplasty'] },
  { part: 'derm/o / dermat/o', type: 'combining', meaning: 'skin', examples: ['dermatitis', 'dermatology', 'dermatome'] },
  { part: 'oste/o', type: 'combining', meaning: 'bone', examples: ['osteoporosis', 'osteomyelitis', 'osteoplasty'] },
  { part: 'my/o', type: 'combining', meaning: 'muscle', examples: ['myocardium', 'myopathy', 'myalgia'] },
  { part: 'hem/o / hemat/o', type: 'combining', meaning: 'blood', examples: ['hematology', 'hemoglobin', 'hematuria'] },
  { part: 'thromb/o', type: 'combining', meaning: 'clot', examples: ['thrombosis', 'thrombocyte', 'thrombolysis'] },
  { part: 'gastr/o', type: 'combining', meaning: 'stomach', examples: ['gastritis', 'gastroscopy', 'gastroparesis'] },
  { part: 'enter/o', type: 'combining', meaning: 'intestine, small intestine', examples: ['enteritis', 'gastroenterology'] },
  { part: 'col/o / colon/o', type: 'combining', meaning: 'large intestine, colon', examples: ['colonoscopy', 'colitis', 'colostomy'] },
  { part: 'bronch/o', type: 'combining', meaning: 'bronchus', examples: ['bronchitis', 'bronchoscopy', 'bronchodilator'] },
  { part: 'trache/o', type: 'combining', meaning: 'trachea, windpipe', examples: ['tracheotomy', 'tracheostomy', 'tracheomalacia'] },
  { part: 'ur/o', type: 'combining', meaning: 'urine, urinary tract', examples: ['urology', 'uremia', 'urinalysis'] },
  { part: 'cyst/o', type: 'combining', meaning: 'bladder, cyst', examples: ['cystitis', 'cystoscopy', 'cystectomy'] },
  { part: 'thyr/o', type: 'combining', meaning: 'thyroid gland', examples: ['thyroiditis', 'thyrotoxicosis', 'thyroidectomy'] },
  { part: 'cerebr/o', type: 'combining', meaning: 'cerebrum, brain', examples: ['cerebral', 'cerebrovascular', 'cerebrospinal'] },
  { part: 'ophthalm/o', type: 'combining', meaning: 'eye', examples: ['ophthalmology', 'ophthalmoscope'] },
  { part: 'ot/o', type: 'combining', meaning: 'ear', examples: ['otitis', 'otoscope', 'otorrhea'] },
  { part: 'rhin/o', type: 'combining', meaning: 'nose', examples: ['rhinitis', 'rhinorrhea', 'rhinoplasty'] },
  { part: 'vas/o', type: 'combining', meaning: 'vessel', examples: ['vasoconstriction', 'vasodilation', 'vasectomy'] },
  // Suffixes
  { part: '-itis', type: 'suffix', meaning: 'inflammation', examples: ['appendicitis', 'bronchitis', 'nephritis'] },
  { part: '-ology', type: 'suffix', meaning: 'study of', examples: ['cardiology', 'neurology', 'pathology'] },
  { part: '-ectomy', type: 'suffix', meaning: 'surgical removal, excision', examples: ['appendectomy', 'cholecystectomy', 'mastectomy'] },
  { part: '-otomy / -tomy', type: 'suffix', meaning: 'cutting into, incision', examples: ['tracheotomy', 'laparotomy', 'craniotomy'] },
  { part: '-ostomy / -stomy', type: 'suffix', meaning: 'surgical opening', examples: ['colostomy', 'tracheostomy', 'gastrostomy'] },
  { part: '-plasty', type: 'suffix', meaning: 'surgical repair, reconstruction', examples: ['rhinoplasty', 'arthroplasty', 'angioplasty'] },
  { part: '-scopy', type: 'suffix', meaning: 'visual examination', examples: ['bronchoscopy', 'colonoscopy', 'cystoscopy'] },
  { part: '-graph / -graphy', type: 'suffix', meaning: 'recording, written record', examples: ['electrocardiograph', 'radiography', 'echocardiography'] },
  { part: '-gram', type: 'suffix', meaning: 'the record itself', examples: ['electrocardiogram', 'mammogram', 'angiogram'] },
  { part: '-pathy', type: 'suffix', meaning: 'disease, suffering', examples: ['neuropathy', 'cardiomyopathy', 'nephropathy'] },
  { part: '-algia / -dynia', type: 'suffix', meaning: 'pain', examples: ['neuralgia', 'myalgia', 'arthralgia'] },
  { part: '-emia', type: 'suffix', meaning: 'blood condition', examples: ['anemia', 'septicemia', 'hyperglycemia'] },
  { part: '-uria', type: 'suffix', meaning: 'urine condition', examples: ['hematuria', 'glycosuria', 'proteinuria'] },
  { part: '-osis', type: 'suffix', meaning: 'condition, process (often abnormal)', examples: ['thrombosis', 'nephrosis', 'dermatosis'] },
  { part: '-oma', type: 'suffix', meaning: 'tumor, mass', examples: ['carcinoma', 'lymphoma', 'melanoma'] },
  { part: '-megaly', type: 'suffix', meaning: 'enlargement', examples: ['cardiomegaly', 'hepatomegaly', 'splenomegaly'] },
  { part: '-rrhea', type: 'suffix', meaning: 'flow, discharge', examples: ['rhinorrhea', 'diarrhea', 'amenorrhea'] },
  { part: '-rrhagia', type: 'suffix', meaning: 'bursting forth, hemorrhage', examples: ['hemorrhagia', 'menorrhagia'] },
  { part: '-lysis', type: 'suffix', meaning: 'destruction, breakdown', examples: ['hemolysis', 'thrombolysis', 'dialysis'] },
  { part: '-plegia', type: 'suffix', meaning: 'paralysis', examples: ['hemiplegia', 'quadriplegia', 'paraplegia'] },
  { part: '-pnea', type: 'suffix', meaning: 'breathing', examples: ['dyspnea', 'apnea', 'orthopnea', 'tachypnea'] },
  { part: '-phasia', type: 'suffix', meaning: 'speech', examples: ['aphasia', 'dysphasia'] },
  { part: '-stenosis', type: 'suffix', meaning: 'narrowing', examples: ['aortic stenosis', 'pyloric stenosis'] },
  { part: '-centesis', type: 'suffix', meaning: 'surgical puncture to remove fluid', examples: ['thoracentesis', 'paracentesis', 'amniocentesis'] },
];

const TERMS: MedTerm[] = [
  { term: 'Tachycardia', meaning: 'Abnormally rapid heart rate (>100 bpm in adults)', parts: [{ part: 'tachy-', type: 'prefix', meaning: 'fast' }, { part: 'cardi/o', type: 'combining', meaning: 'heart' }, { part: '-ia', type: 'suffix', meaning: 'condition' }], category: 'Cardiovascular', pronunciation: 'TAK-ee-KAR-dee-ah' },
  { term: 'Bradycardia', meaning: 'Abnormally slow heart rate (<60 bpm in adults)', parts: [{ part: 'brady-', type: 'prefix', meaning: 'slow' }, { part: 'cardi/o', type: 'combining', meaning: 'heart' }, { part: '-ia', type: 'suffix', meaning: 'condition' }], category: 'Cardiovascular', pronunciation: 'BRAY-dee-KAR-dee-ah' },
  { term: 'Hypertension', meaning: 'Elevated blood pressure (≥130/80 mmHg)', parts: [{ part: 'hyper-', type: 'prefix', meaning: 'excessive' }, { part: 'tens/o', type: 'combining', meaning: 'tension, pressure' }, { part: '-ion', type: 'suffix', meaning: 'condition' }], category: 'Cardiovascular' },
  { term: 'Myocardial infarction', meaning: 'Death of heart muscle due to blocked blood supply (heart attack)', parts: [{ part: 'my/o', type: 'combining', meaning: 'muscle' }, { part: 'cardi/o', type: 'combining', meaning: 'heart' }, { part: '-al', type: 'suffix', meaning: 'pertaining to' }], category: 'Cardiovascular' },
  { term: 'Atherosclerosis', meaning: 'Hardening and narrowing of arteries due to plaque buildup', parts: [{ part: 'ather/o', type: 'combining', meaning: 'fatty paste, plaque' }, { part: 'scleros/o', type: 'combining', meaning: 'hardening' }, { part: '-osis', type: 'suffix', meaning: 'condition' }], category: 'Cardiovascular' },
  { term: 'Cardiomegaly', meaning: 'Enlarged heart', parts: [{ part: 'cardi/o', type: 'combining', meaning: 'heart' }, { part: '-megaly', type: 'suffix', meaning: 'enlargement' }], category: 'Cardiovascular' },
  { term: 'Pericarditis', meaning: 'Inflammation of the pericardium (sac surrounding the heart)', parts: [{ part: 'peri-', type: 'prefix', meaning: 'around' }, { part: 'cardi/o', type: 'combining', meaning: 'heart' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Cardiovascular' },
  { term: 'Dyspnea', meaning: 'Difficulty breathing, shortness of breath', parts: [{ part: 'dys-', type: 'prefix', meaning: 'difficult' }, { part: '-pnea', type: 'suffix', meaning: 'breathing' }], category: 'Respiratory', pronunciation: 'DISP-nee-ah' },
  { term: 'Tachypnea', meaning: 'Abnormally rapid breathing (>20 breaths/min in adults)', parts: [{ part: 'tachy-', type: 'prefix', meaning: 'fast' }, { part: '-pnea', type: 'suffix', meaning: 'breathing' }], category: 'Respiratory' },
  { term: 'Bradypnea', meaning: 'Abnormally slow breathing (<12 breaths/min in adults)', parts: [{ part: 'brady-', type: 'prefix', meaning: 'slow' }, { part: '-pnea', type: 'suffix', meaning: 'breathing' }], category: 'Respiratory' },
  { term: 'Apnea', meaning: 'Cessation of breathing', parts: [{ part: 'a-', type: 'prefix', meaning: 'without' }, { part: '-pnea', type: 'suffix', meaning: 'breathing' }], category: 'Respiratory' },
  { term: 'Pneumonia', meaning: 'Infection/inflammation of the lung parenchyma', parts: [{ part: 'pneum/o', type: 'combining', meaning: 'lung, air' }, { part: '-ia', type: 'suffix', meaning: 'condition' }], category: 'Respiratory' },
  { term: 'Bronchitis', meaning: 'Inflammation of the bronchial tubes', parts: [{ part: 'bronch/o', type: 'combining', meaning: 'bronchus' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Respiratory' },
  { term: 'Thoracentesis', meaning: 'Surgical puncture of the chest cavity to remove fluid', parts: [{ part: 'thorac/o', type: 'combining', meaning: 'chest' }, { part: '-centesis', type: 'suffix', meaning: 'surgical puncture' }], category: 'Respiratory' },
  { term: 'Hepatitis', meaning: 'Inflammation of the liver', parts: [{ part: 'hepat/o', type: 'combining', meaning: 'liver' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'GI/Hepatic' },
  { term: 'Hepatomegaly', meaning: 'Enlarged liver', parts: [{ part: 'hepat/o', type: 'combining', meaning: 'liver' }, { part: '-megaly', type: 'suffix', meaning: 'enlargement' }], category: 'GI/Hepatic' },
  { term: 'Gastritis', meaning: 'Inflammation of the stomach lining', parts: [{ part: 'gastr/o', type: 'combining', meaning: 'stomach' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'GI/Hepatic' },
  { term: 'Colostomy', meaning: 'Surgical creation of an opening from the colon to the abdominal surface', parts: [{ part: 'col/o', type: 'combining', meaning: 'colon' }, { part: '-ostomy', type: 'suffix', meaning: 'surgical opening' }], category: 'GI/Hepatic' },
  { term: 'Nephritis', meaning: 'Inflammation of the kidney', parts: [{ part: 'nephr/o', type: 'combining', meaning: 'kidney' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Renal/Urinary' },
  { term: 'Hematuria', meaning: 'Blood in the urine', parts: [{ part: 'hemat/o', type: 'combining', meaning: 'blood' }, { part: '-uria', type: 'suffix', meaning: 'urine condition' }], category: 'Renal/Urinary' },
  { term: 'Oliguria', meaning: 'Decreased urine output (<400 mL/day or <0.5 mL/kg/hr)', parts: [{ part: 'olig/o', type: 'combining', meaning: 'scanty, few' }, { part: '-uria', type: 'suffix', meaning: 'urine condition' }], category: 'Renal/Urinary' },
  { term: 'Anuria', meaning: 'Absence of urine output (<100 mL/day)', parts: [{ part: 'an-', type: 'prefix', meaning: 'without' }, { part: '-uria', type: 'suffix', meaning: 'urine condition' }], category: 'Renal/Urinary' },
  { term: 'Cystitis', meaning: 'Inflammation of the urinary bladder', parts: [{ part: 'cyst/o', type: 'combining', meaning: 'bladder' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Renal/Urinary' },
  { term: 'Arthritis', meaning: 'Inflammation of one or more joints', parts: [{ part: 'arthr/o', type: 'combining', meaning: 'joint' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Musculoskeletal' },
  { term: 'Osteomyelitis', meaning: 'Infection of bone and bone marrow', parts: [{ part: 'oste/o', type: 'combining', meaning: 'bone' }, { part: 'myel/o', type: 'combining', meaning: 'bone marrow' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Musculoskeletal' },
  { term: 'Osteoporosis', meaning: 'Decrease in bone density leading to fragile, porous bones', parts: [{ part: 'oste/o', type: 'combining', meaning: 'bone' }, { part: 'por/o', type: 'combining', meaning: 'pore' }, { part: '-osis', type: 'suffix', meaning: 'condition' }], category: 'Musculoskeletal' },
  { term: 'Hemiplegia', meaning: 'Paralysis of one side of the body', parts: [{ part: 'hemi-', type: 'prefix', meaning: 'half' }, { part: '-plegia', type: 'suffix', meaning: 'paralysis' }], category: 'Neurological' },
  { term: 'Aphasia', meaning: 'Loss or impairment of ability to speak or understand speech', parts: [{ part: 'a-', type: 'prefix', meaning: 'without' }, { part: '-phasia', type: 'suffix', meaning: 'speech' }], category: 'Neurological' },
  { term: 'Neuropathy', meaning: 'Disease or damage to peripheral nerves', parts: [{ part: 'neur/o', type: 'combining', meaning: 'nerve' }, { part: '-pathy', type: 'suffix', meaning: 'disease' }], category: 'Neurological' },
  { term: 'Hyperglycemia', meaning: 'Elevated blood glucose level', parts: [{ part: 'hyper-', type: 'prefix', meaning: 'excessive' }, { part: 'glyc/o', type: 'combining', meaning: 'sugar, glucose' }, { part: '-emia', type: 'suffix', meaning: 'blood condition' }], category: 'Endocrine' },
  { term: 'Hypoglycemia', meaning: 'Abnormally low blood glucose level (<70 mg/dL)', parts: [{ part: 'hypo-', type: 'prefix', meaning: 'deficient' }, { part: 'glyc/o', type: 'combining', meaning: 'glucose' }, { part: '-emia', type: 'suffix', meaning: 'blood condition' }], category: 'Endocrine' },
  { term: 'Thyroiditis', meaning: 'Inflammation of the thyroid gland', parts: [{ part: 'thyr/o', type: 'combining', meaning: 'thyroid' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Endocrine' },
  { term: 'Anemia', meaning: 'Deficiency of red blood cells or hemoglobin', parts: [{ part: 'an-', type: 'prefix', meaning: 'without' }, { part: '-emia', type: 'suffix', meaning: 'blood condition' }], category: 'Hematology' },
  { term: 'Thrombocytopenia', meaning: 'Abnormally low platelet count (<150,000/µL)', parts: [{ part: 'thromb/o', type: 'combining', meaning: 'clot' }, { part: 'cyt/o', type: 'combining', meaning: 'cell' }, { part: '-penia', type: 'suffix', meaning: 'deficiency' }], category: 'Hematology' },
  { term: 'Leukocytosis', meaning: 'Elevated white blood cell count (>11,000/µL)', parts: [{ part: 'leuk/o', type: 'combining', meaning: 'white' }, { part: 'cyt/o', type: 'combining', meaning: 'cell' }, { part: '-osis', type: 'suffix', meaning: 'condition' }], category: 'Hematology' },
  { term: 'Dermatitis', meaning: 'Inflammation of the skin', parts: [{ part: 'dermat/o', type: 'combining', meaning: 'skin' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Integumentary' },
  { term: 'Otitis', meaning: 'Inflammation of the ear', parts: [{ part: 'ot/o', type: 'combining', meaning: 'ear' }, { part: '-itis', type: 'suffix', meaning: 'inflammation' }], category: 'Sensory' },
  { term: 'Rhinorrhea', meaning: 'Runny nose, discharge from the nasal passages', parts: [{ part: 'rhin/o', type: 'combining', meaning: 'nose' }, { part: '-rrhea', type: 'suffix', meaning: 'flow, discharge' }], category: 'Sensory' },
];

const CATEGORIES = ['All', ...new Set(TERMS.map((t) => t.category))].sort((a, b) =>
  a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
);

const PART_COLORS: Record<PartType, string> = {
  prefix: 'bg-blue-900/30 border-blue-500/30 text-blue-300',
  root: 'bg-teal-900/30 border-teal-500/30 text-teal-300',
  suffix: 'bg-purple-900/30 border-purple-500/30 text-purple-300',
  combining: 'bg-teal-900/30 border-teal-500/30 text-teal-300',
};

// ─── Main component ───────────────────────────────────────────────────────────

type Mode = 'browse' | 'parts' | 'flash';

export default function MedicalTerminology() {
  const [mode, setMode] = useState<Mode>('browse');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  // Flash mode
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  // Parts mode
  const [partsQuery, setPartsQuery] = useState('');
  const [partsType, setPartsType] = useState<'all' | PartType>('all');

  const filteredTerms = TERMS.filter((t) => {
    const q = query.toLowerCase().trim();
    const matchCat = category === 'All' || t.category === category;
    const matchQ = !q || t.term.toLowerCase().includes(q) || t.meaning.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const filteredParts = PARTS.filter((p) => {
    const q = partsQuery.toLowerCase().trim();
    const matchType = partsType === 'all' || p.type === partsType;
    const matchQ = !q || p.part.toLowerCase().includes(q) || p.meaning.toLowerCase().includes(q);
    return matchType && matchQ;
  });

  const flashCard = TERMS[flashIndex];

  const handleFlashNext = () => {
    setFlashIndex((i) => (i + 1) % TERMS.length);
    setFlashFlipped(false);
  };

  const handleFlashPrev = () => {
    setFlashIndex((i) => (i - 1 + TERMS.length) % TERMS.length);
    setFlashFlipped(false);
  };

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Medical Terminology</h2>
      <p className="mb-6 text-sm text-slate-400">
        {TERMS.length} medical terms with root, prefix, and suffix deconstruction. Use Browse to
        search terms, Parts to look up word components, or Flash for rapid-review flashcards.
      </p>

      {/* Mode selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: 'browse', label: 'Browse Terms' },
            { id: 'parts', label: 'Word Parts' },
            { id: 'flash', label: 'Flash Review' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              mode === m.id
                ? 'bg-teal-600 text-white'
                : 'bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-slate-200'
            }`}
            aria-pressed={mode === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Browse mode */}
      {mode === 'browse' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms or meanings…"
              className="flex-1 rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 focus:border-teal-500 focus:outline-none text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 mb-3">{filteredTerms.length} terms</p>
          <div className="space-y-2">
            {filteredTerms.map((term) => {
              const isOpen = expanded === term.term;
              return (
                <div key={term.term} className="rounded-2xl border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : term.term)}
                    className="w-full text-left p-4 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-serif font-bold text-white text-sm">{term.term}</span>
                        {term.pronunciation && (
                          <span className="ml-2 text-xs text-slate-500 italic">/{term.pronunciation}/</span>
                        )}
                        <p className="text-xs text-teal-400 mt-0.5">{term.category}</p>
                      </div>
                      <span className="text-slate-500 flex-shrink-0" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-700 px-4 pb-4 pt-3">
                      <p className="text-sm text-slate-200 mb-3 leading-relaxed">{term.meaning}</p>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Word deconstruction</p>
                      <div className="flex flex-wrap gap-2">
                        {term.parts.map((part, i) => (
                          <span key={i} className={`rounded-xl border px-3 py-1.5 text-sm ${PART_COLORS[part.type] ?? 'text-slate-300 border-slate-600'}`}>
                            <span className="font-mono font-bold">{part.part}</span>
                            <span className="text-xs opacity-70 ml-1">({part.meaning})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTerms.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No terms match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Parts mode */}
      {mode === 'parts' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={partsQuery}
              onChange={(e) => setPartsQuery(e.target.value)}
              placeholder="Search prefixes, roots, suffixes…"
              className="flex-1 rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <select
              value={partsType}
              onChange={(e) => setPartsType(e.target.value as typeof partsType)}
              className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-slate-200 focus:border-teal-500 focus:outline-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="prefix">Prefixes</option>
              <option value="combining">Combining Forms (Roots)</option>
              <option value="suffix">Suffixes</option>
            </select>
          </div>
          <div className="flex gap-3 mb-3 text-xs">
            <span className="rounded-full border border-blue-500/30 bg-blue-900/30 px-2.5 py-1 text-blue-300">prefix</span>
            <span className="rounded-full border border-teal-500/30 bg-teal-900/30 px-2.5 py-1 text-teal-300">combining form / root</span>
            <span className="rounded-full border border-purple-500/30 bg-purple-900/30 px-2.5 py-1 text-purple-300">suffix</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">{filteredParts.length} parts</p>
          <div className="space-y-2">
            {filteredParts.map((p) => (
              <div key={p.part} className={`rounded-2xl border p-4 ${PART_COLORS[p.type] ?? ''} bg-opacity-20`}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <span className="font-mono font-bold text-white text-sm">{p.part}</span>
                    <span className="ml-2 text-xs uppercase tracking-wider opacity-60">
                      {p.type === 'combining' ? 'combining form' : p.type}
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-2 opacity-90">{p.meaning}</p>
                {p.examples && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.examples.map((ex) => (
                      <span key={ex} className="rounded-full border border-white/10 px-2 py-0.5 text-xs opacity-70 italic">{ex}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredParts.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No word parts match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Flash mode */}
      {mode === 'flash' && flashCard && (
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">
            Card {flashIndex + 1} of {TERMS.length}
          </p>
          <div
            onClick={() => setFlashFlipped((f) => !f)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFlashFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            aria-label={flashFlipped ? `Answer: ${flashCard.meaning}. Click to see question.` : `Question: ${flashCard.term}. Click to reveal meaning.`}
            className={`cursor-pointer min-h-48 rounded-2xl border-2 p-8 transition-colors mb-6 ${
              flashFlipped ? 'border-teal-500 bg-teal-900/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            {!flashFlipped ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">What does this term mean?</p>
                <p className="text-3xl font-serif font-bold text-white mb-2">{flashCard.term}</p>
                {flashCard.pronunciation && (
                  <p className="text-sm text-slate-500 italic">/{flashCard.pronunciation}/</p>
                )}
                <p className="mt-4 text-xs text-slate-600">Tap to reveal</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">{flashCard.term}</p>
                <p className="text-lg text-slate-200 leading-relaxed mb-4">{flashCard.meaning}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {flashCard.parts.map((part, i) => (
                    <span key={i} className={`rounded-xl border px-2.5 py-1 text-xs ${PART_COLORS[part.type]}`}>
                      <span className="font-mono font-bold">{part.part}</span> = {part.meaning}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={handleFlashPrev} className="rounded-xl border border-slate-700 px-5 py-2.5 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]">← Prev</button>
            <button onClick={handleFlashNext} className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
