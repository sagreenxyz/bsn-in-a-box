import { defineCollection, z } from 'astro:content';

/**
 * The 35 core nursing concepts that thread through all phases and tag every module.
 * These are the conceptual lenses through which all clinical content is organized,
 * enabling concept-based learning (CBL) rather than topic-based instruction.
 */
const CONCEPT_TAG = z.enum([
  'oxygenation',
  'perfusion',
  'fluid-and-electrolytes',
  'immunity',
  'inflammation',
  'elimination',
  'mobility',
  'cognition',
  'mood-and-affect',
  'reproduction',
  'thermoregulation',
  'gas-exchange',
  'clotting',
  'glucose-regulation',
  'pain',
  'infection',
  'sensory-perception',
  'nutrition',
  'tissue-integrity',
  'cellular-regulation',
  'acid-base-balance',
  'hormonal-regulation',
  'intracranial-regulation',
  'coping',
  'stress',
  'development',
  'ethics',
  'communication',
  'safety',
  'health-promotion',
  'leadership',
  'evidence-based-practice',
  'informatics',
  'collaboration',
  'care-coordination',
]);

/**
 * The six longitudinal patient IDs — students follow these patients
 * across all four phases of the curriculum.
 */
const PATIENT_ID = z.enum([
  'marcus-webb',
  'eleanor-vasquez',
  'jordan-okafor',
  'amara-osei',
  'thomas-nguyen',
  'ruth-abramowitz',
]);

/**
 * MDX lesson modules — the primary educational content units.
 * Each module belongs to a phase > domain > unit hierarchy and is tagged
 * with concept tags, NCLEX categories, and associated longitudinal patients.
 */
const modulesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    /** Human-readable display title shown in navigation and lesson headers */
    title: z.string(),
    /** Unique slug identifier used throughout the unlock and progress systems */
    moduleId: z.string(),
    /** Curriculum phase (1 = Foundations, 2 = Intermediate, 3 = Advanced, 4 = Synthesis) */
    phase: z.number().int().min(1).max(4),
    /** Parent domain identifier (e.g., "professional-identity", "health-assessment") */
    domainId: z.string(),
    /** Parent unit identifier within the domain */
    unitId: z.string(),
    /** Integer sort order within the unit for sequential display */
    sequenceOrder: z.number().int().min(1),
    /** Module IDs that must be completed before this module unlocks */
    prerequisites: z.array(z.string()).default([]),
    /** Core nursing concepts addressed in this module (from the 35 CBL concepts) */
    conceptTags: z.array(CONCEPT_TAG),
    /** NCLEX-RN test plan client needs categories addressed */
    nclex_categories: z.array(z.string()).default([]),
    /** Approximate reading + activity time in minutes */
    estimatedMinutes: z.number().int().min(5),
    /**
     * True if this module addresses a threshold concept — a transformative idea
     * that permanently changes how the student understands nursing practice.
     */
    isThresholdConcept: z.boolean().default(false),
    /**
     * True if this module involves safety-critical content (medication administration,
     * IV therapy, pediatric dosing) requiring 80% gate threshold rather than 76%.
     */
    isSafetyCritical: z.boolean().default(false),
    /** Patient IDs of the longitudinal patients who appear in this module */
    longitudinalPatientIds: z.array(PATIENT_ID).default([]),
    /** True if this module has an associated competency gate exam */
    hasGatewayExam: z.boolean().default(false),
    /** Minimum passing percentage for the gate exam (76 standard, 80 safety-critical) */
    gatewayPassThreshold: z.union([z.literal(76), z.literal(80)]).default(76),
    /**
     * True if this module uses productive failure — the student encounters the
     * clinical scenario before reading the content, making decisions first.
     */
    productiveFailureEnabled: z.boolean().default(false),
  }),
});

/**
 * JSON quiz question banks keyed to module IDs.
 * Supports all seven NGN item types required for NCLEX-NGN preparation.
 */
const quizzesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    /** The moduleId this question bank belongs to */
    moduleId: z.string(),
    /** Human-readable quiz title */
    title: z.string(),
    questions: z.array(
      z.object({
        /** Unique question identifier within this bank */
        id: z.string(),
        /** NGN item type — all seven types must be supported by the quiz engine */
        type: z.enum([
          'multiple-choice',
          'multiple-response',
          'ordered-response',
          'bow-tie',
          'matrix-grid',
          'drop-down-cloze',
          'trend',
        ]),
        /** Clinical scenario stem — always grounded in a patient situation */
        stem: z.string(),
        /** Answer options presented to the student */
        options: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
          })
        ),
        /** IDs of the correct answer option(s) */
        correctAnswers: z.array(z.string()),
        /**
         * Clinical prose rationale explaining the reasoning — not just "this is correct"
         * but a full explanation connecting mechanism to consequence to clinical action.
         */
        rationale: z.string(),
        /** Concept tags addressed by this question for remediation targeting */
        conceptTags: z.array(z.string()).default([]),
        /** NCLEX client needs category */
        nclex_category: z.string().optional(),
      })
    ),
  }),
});

/**
 * JSON branching simulation scenarios for the six longitudinal patients.
 * Each scenario is a directed graph of clinical decision nodes.
 */
const simulationsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    /** Unique scenario identifier */
    scenarioId: z.string(),
    /** Which longitudinal patient this scenario features */
    patientId: PATIENT_ID,
    /** Curriculum phase this scenario belongs to */
    phase: z.number().int().min(1).max(4),
    /** Display title for the scenario */
    title: z.string(),
    /** NodeId of the first node in the directed graph */
    startNodeId: z.string(),
    nodes: z.array(
      z.object({
        /** Unique node identifier within this scenario */
        nodeId: z.string(),
        /** Node classification for engine routing logic */
        type: z.enum(['assessment', 'decision', 'intervention', 'outcome', 'end']),
        /**
         * Clinical narrative content for this node — always written in prose,
         * never as bullet points. Describes what the nurse sees, hears, and measures.
         */
        content: z.string(),
        /** Current vital signs at this point in the scenario */
        vitals: z.record(z.string(), z.string()).optional(),
        /** Relevant lab values at this point in the scenario */
        labs: z.record(z.string(), z.string()).optional(),
        /** Available choices for decision and intervention nodes */
        choices: z
          .array(
            z.object({
              id: z.string(),
              text: z.string(),
              /** Next node to route to when this choice is selected */
              nextNodeId: z.string().optional(),
              /** Whether this choice represents correct clinical reasoning */
              isCorrect: z.boolean(),
              /**
               * Prose rationale explaining the clinical reasoning behind this
               * choice — both why correct choices are correct and why incorrect
               * choices are incorrect.
               */
              rationale: z.string(),
              /** Score impact (positive for correct, negative for harmful choices) */
              scoreImpact: z.number().default(0),
            })
          )
          .optional(),
        /** Scoring metadata for assessment nodes */
        scoring: z
          .object({
            maxPoints: z.number(),
            passingThreshold: z.number(),
          })
          .optional(),
      })
    ),
  }),
});

export const collections = {
  modules: modulesCollection,
  quizzes: quizzesCollection,
  simulations: simulationsCollection,
};
