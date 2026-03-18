/**
 * unfoldingCaseManager.ts
 *
 * Manages the six longitudinal patient cases that thread through all four
 * phases of the BSN curriculum. Unlike isolated case vignettes, the six
 * longitudinal patients — Marcus, Eleanor, Jordan, Amara, Thomas, and Ruth —
 * are whole persons who age, develop complications, and require different
 * specialty care as the student advances.
 *
 * This module tracks which patient episodes the student has encountered,
 * stores clinical decisions made during those encounters, and makes the
 * complete patient timeline accessible for the patient profile pages.
 */

import { getProgress, saveProgress } from './progressStore.js';
import type { PatientEncounterState } from './progressStore.js';

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PROFILES
// ─────────────────────────────────────────────────────────────────────────────

/** Biographical and clinical baseline data for a longitudinal patient. */
export interface PatientProfile {
  /** Unique identifier used throughout the system. */
  id: string;
  /** Full name. */
  name: string;
  /** Age in years at the start of Phase 1. */
  age: number;
  /** Gender identity. */
  gender: string;
  /** Cultural background, used to develop cultural humility throughout the curriculum. */
  background: string;
  /** Occupation or role. */
  occupation: string;
  /** Living situation. */
  livingSituation: string;
  /** Baseline medical history at Phase 1 introduction. */
  medicalHistory: string[];
  /** The primary clinical thread this patient represents across phases. */
  clinicalThread: string;
  /**
   * A brief prose arc describing the patient's journey across all four phases.
   * Written as narrative, not as a table.
   */
  phaseArc: string;
  /** Module IDs where this patient appears, organized by phase. */
  appearances: Record<string, string[]>;
}

/** The six longitudinal patients and their curriculum arcs. */
export const LONGITUDINAL_PATIENTS: PatientProfile[] = [
  {
    id: 'marcus-webb',
    name: 'Marcus Webb',
    age: 24,
    gender: 'Male',
    background: 'African American',
    occupation: 'College student, part-time worker',
    livingSituation: 'Lives alone, no health insurance',
    medicalHistory: ['Type 1 diabetes mellitus, newly diagnosed'],
    clinicalThread: 'Diabetes management, social determinants of health, acute complications',
    phaseArc:
      'Marcus is introduced in Phase 1 as a young man navigating a new diagnosis with no safety net. The student meets him first as a person — learning his dreams, his fears about his health, and the structural barriers that shape his care — before encountering him as a patient. In Phase 2, Marcus returns during a diabetic ketoacidosis admission requiring intensive insulin management and fluid resuscitation. Phase 3 brings his first major hospitalization for sepsis secondary to a diabetic foot wound that he delayed reporting because he could not afford a clinic visit. Phase 4 asks the student to navigate a complex discharge plan that must account for his insurance gaps, his home situation, and the community health resources available to him — a challenge that tests both clinical knowledge and health equity practice.',
    appearances: {
      '1': ['p1-d1-u1-m01', 'p1-d1-u2-m01', 'p1-d2-u1-m01'],
      '2': [],
      '3': [],
      '4': [],
    },
  },
  {
    id: 'eleanor-vasquez',
    name: 'Eleanor Vasquez',
    age: 67,
    gender: 'Female',
    background: 'Latina, primarily Spanish-speaking',
    occupation: 'Retired schoolteacher',
    livingSituation: 'Lives with adult daughter, widowed',
    medicalHistory: [
      'Hypertension',
      'Type 2 diabetes mellitus',
      'Chronic kidney disease, Stage 3',
    ],
    clinicalThread: 'Cardiovascular and renal management, polypharmacy, end-of-life care',
    phaseArc:
      'Eleanor is introduced during what should be a routine clinic visit — but even in this first encounter, the student learns to read the subtle signs that her multiple chronic conditions are beginning to interact in ways that require careful monitoring. Her language preferences and cultural values shape every clinical interaction, and the student is asked throughout the curriculum to reflect on what it means to provide genuinely patient-centered care for someone whose primary language is not English. As her kidney disease progresses through Phase 2 and 3, the student manages increasingly complex pharmacology, navigates the transition to dialysis, and eventually participates in the goals-of-care conversation that asks what quality of life means to Eleanor herself.',
    appearances: {
      '1': ['p1-d1-u1-m02', 'p1-d2-u1-m01', 'p1-d2-u1-m04', 'p1-d3-u1-m01'],
      '2': [],
      '3': [],
      '4': [],
    },
  },
  {
    id: 'jordan-okafor',
    name: 'Jordan Okafor',
    age: 34,
    gender: 'Nonbinary',
    background: 'Nigerian American',
    occupation: 'Healthcare administrator',
    livingSituation: 'Urban apartment, employed with insurance',
    medicalHistory: ['Generalized anxiety disorder', 'SSRI pharmacotherapy'],
    clinicalThread: 'Psychiatric-mental health nursing, surgical complications, care coordination',
    phaseArc:
      'Jordan is introduced during a routine health maintenance visit, presenting as a high-functioning professional who happens to have a history of anxiety — a reminder that mental health conditions are not emergencies waiting to happen, but ongoing aspects of whole-person health. The ethical complexity of their care is introduced early: Jordan has clear preferences about their treatment that the team does not always honor. In Phase 2, Jordan experiences a psychiatric crisis requiring inpatient stabilization. Phase 3 brings a laparoscopic appendectomy complicated by a wound infection, where the interaction between Jordan\'s anxiety, their SSRI, and their postoperative pain management creates a clinical puzzle the student must navigate thoughtfully. Phase 4 requires the student to coordinate Jordan\'s discharge across behavioral health and surgical aftercare settings.',
    appearances: {
      '1': ['p1-d1-u1-m03'],
      '2': [],
      '3': [],
      '4': [],
    },
  },
  {
    id: 'amara-osei',
    name: 'Amara Osei',
    age: 28,
    gender: 'Female',
    background: 'Ghanaian immigrant',
    occupation: 'G2P1, 32 weeks pregnant at Phase 1 introduction',
    livingSituation: 'Lives with husband, culturally connected community',
    medicalHistory: ['Gestational hypertension progressing to preeclampsia with severe features'],
    clinicalThread: 'Maternal-newborn nursing, obstetric emergencies, neonatal care',
    phaseArc:
      'Amara is introduced during an antepartum assessment visit where the student learns the baseline parameters of normal pregnancy and begins to develop the clinical eye needed to detect deviation from normal. Her gestational hypertension is present but manageable at this point — a teaching moment for primary prevention and early surveillance. Phase 2 brings the escalation to preeclampsia with severe features, where the student manages magnesium sulfate therapy and interprets continuous fetal monitoring. Phase 3 is Amara\'s emergency cesarean delivery followed by postpartum hemorrhage — one of the highest-acuity scenarios in the curriculum. Her premature son Kofi, born at 33 weeks, enters the neonatal unit and becomes the Phase 3 pediatric content thread, allowing the student to care for both mother and infant simultaneously.',
    appearances: {
      '1': ['p1-d2-u1-m04'],
      '2': [],
      '3': [],
      '4': [],
    },
  },
  {
    id: 'thomas-nguyen',
    name: 'Thomas Nguyen',
    age: 8,
    gender: 'Male',
    background: 'Vietnamese American',
    occupation: 'Third-grade student',
    livingSituation: 'Lives with parents and grandmother',
    medicalHistory: [
      'Moderate persistent asthma',
      'Three hospitalizations in the past year',
    ],
    clinicalThread: 'Pediatric nursing, respiratory pharmacology, school health',
    phaseArc:
      'Thomas is introduced during a health assessment module as the primary example of how pediatric assessment differs fundamentally from adult assessment — not simply a matter of smaller doses but of different anatomy, different physiology, different developmental context, and different family dynamics. His asthma has required three hospitalizations in a year, signaling a need for better management and perhaps a home or school environment assessment. Phase 2 applies respiratory pharmacology to his specific weight-based dosing needs. Phase 3 brings a status asthmaticus admission requiring PICU-level monitoring and intervention. Phase 4 returns Thomas to the community, where the student engages with school nursing, community-based asthma management, and the intersection of the physical environment with chronic respiratory disease.',
    appearances: {
      '1': ['p1-d2-u1-m02'],
      '2': [],
      '3': [],
      '4': [],
    },
  },
  {
    id: 'ruth-abramowitz',
    name: 'Ruth Abramowitz',
    age: 81,
    gender: 'Female',
    background: 'Jewish American',
    occupation: 'Retired physician',
    livingSituation: 'Assisted living facility',
    medicalHistory: [
      'Moderate Alzheimer\'s dementia',
      'Heart failure with reduced ejection fraction',
      'Osteoporosis with recent hip fracture',
    ],
    clinicalThread: 'Geriatric nursing, polypharmacy, ethical decision-making, end-of-life care',
    phaseArc:
      'Ruth is one of the most clinically and ethically complex patients in the curriculum. Her history as a physician makes her an unusually informed patient — on good cognitive days, she has clear preferences rooted in medical knowledge. Her dementia means that those preferences are not consistently accessible. This creates a thread of ethical tension that runs throughout all four phases: when does fluctuating capacity mean a patient cannot make their own decisions? How does the nurse navigate a family in conflict about a patient\'s care? Phase 1 introduces Ruth during an older adult assessment where the student learns to distinguish normal aging from pathological change. Phase 2 focuses on her polypharmacy — she takes eleven medications, several of which interact in clinically significant ways. Phase 3 brings her post-hip-fracture rehabilitation and a delirium episode that the student must recognize, assess, and manage. Phase 4 presents the goals-of-care conversation that the entire curriculum has been building toward.',
    appearances: {
      '1': ['p1-d1-u3-m01', 'p1-d2-u1-m03'],
      '2': [],
      '3': [],
      '4': [],
    },
  },
];

/** Indexed by patient ID for O(1) lookup. */
const PATIENTS_BY_ID: Record<string, PatientProfile> = Object.fromEntries(
  LONGITUDINAL_PATIENTS.map((p) => [p.id, p])
);

// ─────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves the static profile for a longitudinal patient.
 *
 * @param patientId - The patient ID string.
 * @returns The PatientProfile, or undefined if not found.
 */
export function getPatientProfile(patientId: string): PatientProfile | undefined {
  return PATIENTS_BY_ID[patientId];
}

/**
 * Retrieves the student's encounter state for a specific longitudinal patient,
 * including which modules have been completed and what clinical decisions were made.
 *
 * @param patientId - The patient ID string.
 * @returns The PatientEncounterState, initialized to empty if no encounters yet.
 */
export function getPatientEncounterState(patientId: string): PatientEncounterState {
  const state = getProgress();
  return (
    state.longitudinalPatients[patientId] ?? {
      patientId,
      encountersCompleted: [],
      productiveFailureDecisions: {},
      notes: '',
    }
  );
}

/**
 * Records that the student has completed a module encounter with a specific patient.
 * Updates the progress store with the new encounter record.
 *
 * @param patientId - The patient ID string.
 * @param moduleId - The module where this encounter occurred.
 */
export function recordPatientEncounter(patientId: string, moduleId: string): void {
  const state = getProgress();

  if (!state.longitudinalPatients[patientId]) {
    state.longitudinalPatients[patientId] = {
      patientId,
      encountersCompleted: [],
      productiveFailureDecisions: {},
      notes: '',
    };
  }

  const encounter = state.longitudinalPatients[patientId];
  if (!encounter.encountersCompleted.includes(moduleId)) {
    encounter.encountersCompleted.push(moduleId);
  }

  saveProgress(state);
}

/**
 * Stores the student's pre-instruction clinical decision during a productive
 * failure encounter with a patient. This decision is saved for comparison
 * after the student reads the relevant module content.
 *
 * @param patientId - The patient ID string.
 * @param moduleId - The module where the productive failure encounter is embedded.
 * @param decision - The student's free-text clinical decision description.
 */
export function recordProductiveFailureDecision(
  patientId: string,
  moduleId: string,
  decision: string
): void {
  const state = getProgress();

  if (!state.longitudinalPatients[patientId]) {
    state.longitudinalPatients[patientId] = {
      patientId,
      encountersCompleted: [],
      productiveFailureDecisions: {},
      notes: '',
    };
  }

  state.longitudinalPatients[patientId].productiveFailureDecisions[moduleId] = decision;
  saveProgress(state);
}

/**
 * Updates the student's private notes about a specific patient.
 * Notes are persistent and accessible from the patient profile page.
 *
 * @param patientId - The patient ID string.
 * @param notes - The updated notes text.
 */
export function updatePatientNotes(patientId: string, notes: string): void {
  const state = getProgress();

  if (!state.longitudinalPatients[patientId]) {
    state.longitudinalPatients[patientId] = {
      patientId,
      encountersCompleted: [],
      productiveFailureDecisions: {},
      notes: '',
    };
  }

  state.longitudinalPatients[patientId].notes = notes;
  saveProgress(state);
}

/**
 * Returns the modules for a specific patient that are accessible at the
 * student's current progress level — i.e., the completed encounters plus
 * the next upcoming encounter.
 *
 * @param patientId - The patient ID string.
 * @returns An object with completedModuleIds and the nextModuleId if any.
 */
export function getPatientTimeline(patientId: string): {
  completedModuleIds: string[];
  nextModuleId: string | null;
  allAppearances: { phase: string; moduleIds: string[] }[];
} {
  const profile = PATIENTS_BY_ID[patientId];
  if (!profile) {
    return { completedModuleIds: [], nextModuleId: null, allAppearances: [] };
  }

  const encounterState = getPatientEncounterState(patientId);
  const completed = encounterState.encountersCompleted;

  // Flatten all appearances in phase order.
  const allModuleIds: string[] = Object.entries(profile.appearances)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .flatMap(([, ids]) => ids);

  const nextModuleId = allModuleIds.find((id) => !completed.includes(id)) ?? null;

  const allAppearances = Object.entries(profile.appearances)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([phase, moduleIds]) => ({ phase, moduleIds }));

  return { completedModuleIds: completed, nextModuleId, allAppearances };
}
