/**
 * contentRegistry.ts
 *
 * The static curriculum map — a complete typed record of every module in BSN
 * in a Box. This is the authoritative source of truth for module metadata,
 * prerequisite relationships, concept tag assignments, and unlock logic.
 *
 * The registry is organized as Phase → Domain → Unit → Module, mirroring
 * the directory structure of /src/content/modules/. Every module in the
 * file system must have a corresponding entry here for the unlock system
 * to function correctly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Metadata record for a single learning module in the curriculum. */
export interface ModuleRegistryEntry {
  /** Unique slug — used as the key in progressStore and as the URL segment. */
  moduleId: string;
  /** Human-readable display title shown in navigation and lesson headers. */
  title: string;
  /** Curriculum phase (1–4). */
  phase: 1 | 2 | 3 | 4;
  /** Parent domain identifier. */
  domainId: string;
  /** Parent unit identifier within the domain. */
  unitId: string;
  /** Integer sort order for sequential display within the unit. */
  sequenceOrder: number;
  /** Module IDs that must be completed before this module unlocks. */
  prerequisites: string[];
  /** Core nursing concepts addressed in this module (from the 35 CBL concepts). */
  conceptTags: string[];
  /** NCLEX-RN client needs categories addressed. */
  nclex_categories: string[];
  /** True if this module has an associated unit gate exam. */
  hasGatewayExam: boolean;
  /** Minimum passing percentage for the gate exam. */
  gatewayPassThreshold: 76 | 80;
  /** True if this is a safety-critical module requiring 80% threshold. */
  isSafetyCritical: boolean;
  /** True if this module addresses a threshold concept. */
  isThresholdConcept: boolean;
  /** Longitudinal patient IDs for patients appearing in this module. */
  longitudinalPatientIds: string[];
  /** Approximate reading + activity time in minutes. */
  estimatedMinutes: number;
  /** True if this module uses productive failure (scenario before content). */
  productiveFailureEnabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete curriculum map. Every module that exists in
 * /src/content/modules/ must have an entry here.
 */
export const CONTENT_REGISTRY: ModuleRegistryEntry[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 1 — FOUNDATIONS OF NURSING PRACTICE
  // ───────────────────────────────────────────────────────────────────────────

  // Domain 1: Professional Identity and Scope of Practice
  // Unit 1: The Nursing Profession

  {
    moduleId: 'p1-d1-u1-m01',
    title: 'The Discipline of Nursing',
    phase: 1,
    domainId: 'professional-identity',
    unitId: 'nursing-profession',
    sequenceOrder: 1,
    prerequisites: [],
    conceptTags: ['health-promotion', 'ethics', 'communication', 'evidence-based-practice'],
    nclex_categories: ['Safe and Effective Care Environment', 'Health Promotion and Maintenance'],
    hasGatewayExam: false,
    gatewayPassThreshold: 76,
    isSafetyCritical: false,
    isThresholdConcept: true,
    longitudinalPatientIds: ['marcus-webb'],
    estimatedMinutes: 45,
    productiveFailureEnabled: false,
  },
  {
    moduleId: 'p1-d1-u1-m02',
    title: 'Professional Standards and the Scope of Practice',
    phase: 1,
    domainId: 'professional-identity',
    unitId: 'nursing-profession',
    sequenceOrder: 2,
    prerequisites: ['p1-d1-u1-m01'],
    conceptTags: ['ethics', 'safety', 'communication', 'leadership', 'collaboration'],
    nclex_categories: ['Safe and Effective Care Environment', 'Management of Care'],
    hasGatewayExam: false,
    gatewayPassThreshold: 76,
    isSafetyCritical: false,
    isThresholdConcept: false,
    longitudinalPatientIds: ['eleanor-vasquez'],
    estimatedMinutes: 40,
    productiveFailureEnabled: false,
  },
  {
    moduleId: 'p1-d1-u1-m03',
    title: 'Ethics and Values in Nursing Practice',
    phase: 1,
    domainId: 'professional-identity',
    unitId: 'nursing-profession',
    sequenceOrder: 3,
    prerequisites: ['p1-d1-u1-m02'],
    conceptTags: ['ethics', 'communication', 'coping', 'stress', 'care-coordination'],
    nclex_categories: ['Safe and Effective Care Environment', 'Psychosocial Integrity'],
    hasGatewayExam: false,
    gatewayPassThreshold: 76,
    isSafetyCritical: false,
    isThresholdConcept: true,
    longitudinalPatientIds: ['jordan-okafor'],
    estimatedMinutes: 50,
    productiveFailureEnabled: true,
  },

  // Unit 2: Healthcare Systems

  {
    moduleId: 'p1-d1-u2-m01',
    title: 'The Health Care System and the Nurse\'s Place Within It',
    phase: 1,
    domainId: 'professional-identity',
    unitId: 'healthcare-systems',
    sequenceOrder: 1,
    prerequisites: ['p1-d1-u1-m01'],
    conceptTags: ['health-promotion', 'care-coordination', 'collaboration', 'leadership', 'safety'],
    nclex_categories: ['Safe and Effective Care Environment', 'Health Promotion and Maintenance'],
    hasGatewayExam: false,
    gatewayPassThreshold: 76,
    isSafetyCritical: false,
    isThresholdConcept: false,
    longitudinalPatientIds: ['marcus-webb'],
    estimatedMinutes: 45,
    productiveFailureEnabled: false,
  },

  // Unit 3: Legal and Regulatory Framework

  {
    moduleId: 'p1-d1-u3-m01',
    title: 'Legal Concepts in Nursing Practice',
    phase: 1,
    domainId: 'professional-identity',
    unitId: 'legal-framework',
    sequenceOrder: 1,
    prerequisites: ['p1-d1-u1-m02'],
    conceptTags: ['ethics', 'safety', 'communication', 'leadership'],
    nclex_categories: ['Safe and Effective Care Environment', 'Management of Care'],
    hasGatewayExam: true,
    gatewayPassThreshold: 76,
    isSafetyCritical: false,
    isThresholdConcept: false,
    longitudinalPatientIds: ['ruth-abramowitz'],
    estimatedMinutes: 50,
    productiveFailureEnabled: false,
  },

  // Domain 2: Foundations of Clinical Practice
  // Unit 1: Health Assessment Fundamentals

  {
    moduleId: 'p1-d2-u1-m01',
    title: 'Introduction to Health Assessment',
    phase: 1,
    domainId: 'clinical-foundations',
    unitId: 'health-assessment',
    sequenceOrder: 1,
    prerequisites: ['p1-d1-u1-m01'],
    conceptTags: ['communication', 'safety', 'sensory-perception', 'cognition', 'development'],
    nclex_categories: ['Health Promotion and Maintenance', 'Physiological Integrity'],
    hasGatewayExam: false,
    gatewayPassThreshold: 80,
    isSafetyCritical: true,
    isThresholdConcept: false,
    longitudinalPatientIds: ['marcus-webb', 'eleanor-vasquez'],
    estimatedMinutes: 60,
    productiveFailureEnabled: false,
  },
  {
    moduleId: 'p1-d2-u1-m02',
    title: 'Vital Signs: Measurement, Interpretation, and Clinical Response',
    phase: 1,
    domainId: 'clinical-foundations',
    unitId: 'health-assessment',
    sequenceOrder: 2,
    prerequisites: ['p1-d2-u1-m01'],
    conceptTags: ['perfusion', 'oxygenation', 'thermoregulation', 'safety'],
    nclex_categories: ['Physiological Integrity', 'Reduction of Risk Potential'],
    hasGatewayExam: false,
    gatewayPassThreshold: 80,
    isSafetyCritical: true,
    isThresholdConcept: false,
    longitudinalPatientIds: ['thomas-nguyen'],
    estimatedMinutes: 55,
    productiveFailureEnabled: true,
  },
  {
    moduleId: 'p1-d2-u1-m03',
    title: 'Pain Assessment: The Fifth Vital Sign',
    phase: 1,
    domainId: 'clinical-foundations',
    unitId: 'health-assessment',
    sequenceOrder: 3,
    prerequisites: ['p1-d2-u1-m02'],
    conceptTags: ['pain', 'communication', 'sensory-perception', 'cognition'],
    nclex_categories: ['Physiological Integrity', 'Basic Care and Comfort'],
    hasGatewayExam: false,
    gatewayPassThreshold: 80,
    isSafetyCritical: true,
    isThresholdConcept: false,
    longitudinalPatientIds: ['ruth-abramowitz'],
    estimatedMinutes: 40,
    productiveFailureEnabled: false,
  },
  {
    moduleId: 'p1-d2-u1-m04',
    title: 'Head-to-Toe Physical Examination',
    phase: 1,
    domainId: 'clinical-foundations',
    unitId: 'health-assessment',
    sequenceOrder: 4,
    prerequisites: ['p1-d2-u1-m03'],
    conceptTags: ['oxygenation', 'perfusion', 'elimination', 'mobility', 'sensory-perception', 'cognition'],
    nclex_categories: ['Health Promotion and Maintenance', 'Physiological Integrity'],
    hasGatewayExam: true,
    gatewayPassThreshold: 80,
    isSafetyCritical: true,
    isThresholdConcept: true,
    longitudinalPatientIds: ['eleanor-vasquez', 'amara-osei'],
    estimatedMinutes: 90,
    productiveFailureEnabled: false,
  },

  // Domain 3: Pharmacology Foundations
  // Unit 1: Safe Medication Administration

  {
    moduleId: 'p1-d3-u1-m01',
    title: 'Principles of Safe Medication Administration',
    phase: 1,
    domainId: 'pharmacology-foundations',
    unitId: 'medication-administration',
    sequenceOrder: 1,
    prerequisites: ['p1-d2-u1-m01'],
    conceptTags: ['safety', 'infection', 'tissue-integrity', 'evidence-based-practice'],
    nclex_categories: ['Physiological Integrity', 'Pharmacological and Parenteral Therapies'],
    hasGatewayExam: false,
    gatewayPassThreshold: 80,
    isSafetyCritical: true,
    isThresholdConcept: false,
    longitudinalPatientIds: ['eleanor-vasquez'],
    estimatedMinutes: 60,
    productiveFailureEnabled: false,
  },
  {
    moduleId: 'p1-d3-u1-m02',
    title: 'Dosage Calculations: Foundations',
    phase: 1,
    domainId: 'pharmacology-foundations',
    unitId: 'medication-administration',
    sequenceOrder: 2,
    prerequisites: ['p1-d3-u1-m01'],
    conceptTags: ['safety', 'evidence-based-practice'],
    nclex_categories: ['Physiological Integrity', 'Pharmacological and Parenteral Therapies'],
    hasGatewayExam: true,
    gatewayPassThreshold: 80,
    isSafetyCritical: true,
    isThresholdConcept: false,
    longitudinalPatientIds: [],
    estimatedMinutes: 75,
    productiveFailureEnabled: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Indexed map for O(1) lookup by moduleId. */
const REGISTRY_BY_ID: Record<string, ModuleRegistryEntry> = Object.fromEntries(
  CONTENT_REGISTRY.map((entry) => [entry.moduleId, entry])
);

/**
 * Retrieves a single module's registry entry by its ID.
 *
 * @param moduleId - The unique module slug.
 * @returns The ModuleRegistryEntry, or undefined if not found.
 */
export function getModuleById(moduleId: string): ModuleRegistryEntry | undefined {
  return REGISTRY_BY_ID[moduleId];
}

/**
 * Returns all modules in a specific phase, sorted by domain, unit, and sequence order.
 *
 * @param phase - The phase number (1–4).
 * @returns An array of ModuleRegistryEntry objects in curriculum order.
 */
export function getModulesByPhase(phase: number): ModuleRegistryEntry[] {
  return CONTENT_REGISTRY.filter((m) => m.phase === phase).sort((a, b) => {
    if (a.domainId !== b.domainId) return a.domainId.localeCompare(b.domainId);
    if (a.unitId !== b.unitId) return a.unitId.localeCompare(b.unitId);
    return a.sequenceOrder - b.sequenceOrder;
  });
}

/**
 * Returns all modules tagged with a specific core nursing concept.
 *
 * @param conceptTag - One of the 35 core nursing concept strings.
 * @returns An array of ModuleRegistryEntry objects across all phases.
 */
export function getModulesByConcept(conceptTag: string): ModuleRegistryEntry[] {
  return CONTENT_REGISTRY.filter((m) => m.conceptTags.includes(conceptTag)).sort(
    (a, b) => a.phase - b.phase || a.sequenceOrder - b.sequenceOrder
  );
}

/**
 * Returns all modules that feature a specific longitudinal patient.
 *
 * @param patientId - The patient ID string.
 * @returns An array of ModuleRegistryEntry objects in curriculum order.
 */
export function getModulesByPatient(patientId: string): ModuleRegistryEntry[] {
  return CONTENT_REGISTRY.filter((m) => m.longitudinalPatientIds.includes(patientId)).sort(
    (a, b) => a.phase - b.phase || a.sequenceOrder - b.sequenceOrder
  );
}

/**
 * Returns the prerequisite chain for a module — all modules that must be
 * completed, transitively, before this module unlocks.
 *
 * @param moduleId - The target module ID.
 * @returns An array of moduleId strings in prerequisite order.
 */
export function getPrerequisiteChain(moduleId: string): string[] {
  const visited = new Set<string>();
  const chain: string[] = [];

  function walk(id: string): void {
    const entry = REGISTRY_BY_ID[id];
    if (!entry) return;
    for (const prereq of entry.prerequisites) {
      if (!visited.has(prereq)) {
        visited.add(prereq);
        walk(prereq);
        chain.push(prereq);
      }
    }
  }

  walk(moduleId);
  return chain;
}
