/**
 * NCLEXBlueprint.tsx
 *
 * Interactive NCLEX-NGN test plan (Next Generation NCLEX) blueprint.
 * Displays the full NCLEX-RN NGN test plan client needs categories with:
 *   - Percentage weights from the 2023 NCLEX-RN test plan
 *   - Subcategories for each client needs area
 *   - Clinical judgment measurement model (CJMM) cognitive skills
 *   - Student performance tracking per category (stored in progressStore)
 *   - Links to relevant modules and practice items
 *
 * Data is consistent with the NCSBN 2023 NGN NCLEX-RN test plan.
 */

import React, { useState } from 'react';
import { getProgress, saveProgress } from '../../lib/progressStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subcategory {
  name: string;
  description: string;
  sampleTopics: string[];
}

interface ClientNeeds {
  id: string;
  category: string;
  weightMin: number;
  weightMax: number;
  color: string;
  headerColor: string;
  description: string;
  subcategories: Subcategory[];
}

// ─── NCLEX-RN 2023 NGN Test Plan data ─────────────────────────────────────────

const CLIENT_NEEDS: ClientNeeds[] = [
  {
    id: 'safe-effective-care',
    category: 'Safe and Effective Care Environment',
    weightMin: 0,
    weightMax: 0,
    color: 'border-blue-500/40 bg-blue-900/10',
    headerColor: 'text-blue-400',
    description:
      'The nurse promotes achievement of client outcomes by providing and directing nursing care that enhances the care environment.',
    subcategories: [
      {
        name: 'Management of Care (17–23%)',
        description:
          'Providing integrated, cost-effective care to clients by coordinating, supervising, and collaborating with the interdisciplinary team.',
        sampleTopics: [
          'Advance directives / living wills',
          'Advocacy',
          'Case management',
          'Client rights',
          'Collaboration with interdisciplinary team',
          'Concepts of management',
          'Continuity of care',
          'Delegation and supervision',
          'Emergency response plan',
          'Establishing priorities',
          'Ethical practice',
          'Informed consent',
          'Legal rights and responsibilities',
          'Organ donation',
          'Performance improvement / quality assurance',
          'Referrals',
          'Staff education',
        ],
      },
      {
        name: 'Safety and Infection Control (9–15%)',
        description:
          'Protecting clients, families, and health care personnel from health and environmental hazards.',
        sampleTopics: [
          'Accident/error/injury prevention',
          'Emergency response plan',
          'Ergonomic principles',
          'Handling hazardous and infectious materials',
          'Home safety',
          'Medical and surgical asepsis',
          'Reporting of incident/event/irregular occurrence',
          'Safe use of equipment',
          'Security plan',
          'Standard/transmission-based/other precautions',
          'Use of restraints/safety devices',
        ],
      },
    ],
  },
  {
    id: 'health-promotion',
    category: 'Health Promotion and Maintenance',
    weightMin: 6,
    weightMax: 12,
    color: 'border-green-500/40 bg-green-900/10',
    headerColor: 'text-green-400',
    description:
      'The nurse provides and directs nursing care of the client that incorporates the knowledge of expected growth and development principles, prevention and/or early detection of health problems, and strategies to achieve optimal health.',
    subcategories: [
      {
        name: 'Health Promotion and Maintenance (6–12%)',
        description:
          'Nursing care that incorporates knowledge of expected growth/development, prevention, early detection of health problems, and strategies for optimal health.',
        sampleTopics: [
          'Aging process',
          'Ante/intra/postpartum and newborn care',
          'Developmental stages and transitions',
          'Disease prevention',
          'Expected body image changes',
          'Family planning',
          'Health and wellness',
          'Health promotion programs',
          'Health screening',
          'High-risk behaviors',
          'Human sexuality',
          'Immunizations',
          'Lifestyle choices',
          'Principles of teaching/learning',
          'Self-care',
          'Techniques of physical assessment',
        ],
      },
    ],
  },
  {
    id: 'psychosocial',
    category: 'Psychosocial Integrity',
    weightMin: 6,
    weightMax: 12,
    color: 'border-purple-500/40 bg-purple-900/10',
    headerColor: 'text-purple-400',
    description:
      'The nurse promotes and supports the emotional, mental, and social well-being of the client experiencing stressful events, as well as clients with acute or chronic mental illness.',
    subcategories: [
      {
        name: 'Psychosocial Integrity (6–12%)',
        description:
          'Promoting and supporting emotional, mental, and social well-being of clients experiencing stressful events or mental illness.',
        sampleTopics: [
          'Abuse/neglect',
          'Behavioral interventions',
          'Chemical and other dependencies/substance use disorder',
          'Coping mechanisms',
          'Crisis intervention',
          'Cultural awareness/cultural influences on health',
          'End-of-life concepts',
          'Family dynamics',
          'Grief and loss',
          'Mental health concepts',
          'Religious and spiritual influences on health',
          'Sensory/perceptual alterations',
          'Situational role changes',
          'Stress management',
          'Support systems',
          'Therapeutic communication',
          'Therapeutic environment',
          'Unexpected body image changes',
        ],
      },
    ],
  },
  {
    id: 'physiological',
    category: 'Physiological Integrity',
    weightMin: 0,
    weightMax: 0,
    color: 'border-teal-500/40 bg-teal-900/10',
    headerColor: 'text-teal-400',
    description:
      'The nurse promotes physical health and well-being by providing care and comfort, reducing client risk potential, and managing health alterations.',
    subcategories: [
      {
        name: 'Basic Care and Comfort (6–12%)',
        description: 'Providing comfort and assistance with activities of daily living.',
        sampleTopics: [
          'Assistive devices',
          'Elimination',
          'Mobility/immobility',
          'Non-pharmacological comfort interventions',
          'Nutrition and oral hydration',
          'Palliative/comfort care',
          'Personal hygiene',
          'Rest and sleep',
        ],
      },
      {
        name: 'Pharmacological and Parenteral Therapies (12–18%)',
        description: 'Providing care related to the administration of medications and parenteral therapies.',
        sampleTopics: [
          'Adverse effects/contraindications/side effects/interactions',
          'Blood and blood products',
          'Central venous access devices',
          'Dosage calculation',
          'Expected effects/outcomes',
          'Medication administration',
          'Parenteral/IV therapies',
          'Pharmacological agents',
          'Pharmacological pain management',
          'Total parenteral nutrition',
        ],
      },
      {
        name: 'Reduction of Risk Potential (9–15%)',
        description: 'Reducing the likelihood that clients will develop complications or health problems.',
        sampleTopics: [
          'Changes/abnormalities in vital signs',
          'Diagnostic tests',
          'Laboratory values',
          'Monitoring conscious sedation',
          'Potential for alterations in body systems',
          'Potential for complications from surgical procedures and health alterations',
          'Potential for complications of diagnostic tests/treatments/procedures',
          'System-specific assessments',
          'Therapeutic procedures',
        ],
      },
      {
        name: 'Physiological Adaptation (11–17%)',
        description:
          'Managing and providing care for clients with acute, chronic, or life-threatening physical health conditions.',
        sampleTopics: [
          'Alterations in body systems',
          'Fluid and electrolyte imbalances',
          'Hemodynamics',
          'Illness management',
          'Medical emergencies',
          'Pathophysiology',
          'Unexpected response to therapies',
        ],
      },
    ],
  },
];

const CJMM_SKILLS = [
  {
    skill: 'Recognize Cues',
    description:
      'Identify relevant information from multiple sources (medical history, vital signs, lab values, assessment findings) to form a clinical picture.',
    example: 'Noticing a rising respiratory rate, new confusion, and low-grade fever in a post-op patient — recognizing these as potentially related cues rather than isolated findings.',
  },
  {
    skill: 'Analyze Cues',
    description:
      'Link recognized cues to the client\'s clinical presentation, consider the underlying pathophysiology, and determine significance.',
    example: 'Understanding that the combination of hypotension, tachycardia, and decreased urine output in a post-op patient may indicate hemorrhage or distributive shock.',
  },
  {
    skill: 'Prioritize Hypotheses',
    description:
      'Rank explanations for client findings by urgency and likelihood, and consider what conditions or complications may need immediate attention.',
    example: 'Determining that sepsis is the highest-priority hypothesis in a patient with fever, tachycardia, and hypotension, above less urgent differentials.',
  },
  {
    skill: 'Generate Solutions',
    description:
      'Identify evidence-based nursing actions to address client needs and achieve expected outcomes for each hypothesis.',
    example: 'Generating that the immediate nursing actions for suspected sepsis include obtaining blood cultures, administering ordered IV fluids, and preparing antibiotics.',
  },
  {
    skill: 'Take Action',
    description:
      'Implement the best nursing interventions to address the client\'s needs, exercising judgment about priority and sequence.',
    example: 'Administering ordered IV fluid bolus, drawing blood cultures, and notifying the provider of the clinical findings using SBAR — in the correct sequence.',
  },
  {
    skill: 'Evaluate Outcomes',
    description:
      'Determine the effectiveness of nursing actions and the client\'s response to care, and reassess for new or changing needs.',
    example: 'Reassessing vital signs 30 minutes after a fluid bolus, noting that hypotension has resolved but tachycardia persists, and communicating this to the provider.',
  },
];

// ─── Progress tracking ────────────────────────────────────────────────────────

function getCategoryScores(): Record<string, number> {
  try {
    const progress = getProgress();
    const bp = (progress as any).nclexBlueprint;
    if (typeof bp === 'object' && bp !== null) {
      return bp as Record<string, number>;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveCategoryScore(categoryId: string, score: number) {
  try {
    const progress = getProgress();
    if (!(progress as any).nclexBlueprint) (progress as any).nclexBlueprint = {};
    (progress as any).nclexBlueprint[`${categoryId}`] = score;
    saveProgress(progress);
  } catch {
    // ignore
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NCLEXBlueprint() {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'cjmm'>('blueprint');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(getCategoryScores);

  const handleScoreChange = (categoryId: string, subcatName: string, value: number) => {
    const key = `${categoryId}:${subcatName}`;
    const updated = { ...scores, [key]: value };
    setScores(updated);
    saveCategoryScore(key, value);
  };

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">NCLEX-NGN Blueprint</h2>
      <p className="mb-6 text-sm text-slate-400">
        The 2023 Next Generation NCLEX-RN test plan. Understand the client needs categories,
        weightings, and the Clinical Judgment Measurement Model (CJMM) cognitive skills that
        structure NGN question formats.
      </p>

      {/* Tab nav */}
      <div className="mb-6 flex gap-2">
        {(
          [
            { id: 'blueprint', label: 'Client Needs Blueprint' },
            { id: 'cjmm', label: 'Clinical Judgment Model' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-slate-200'
            }`}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Blueprint tab */}
      {activeTab === 'blueprint' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-4">
            Click a category to expand subcategories, view sample topics, and record your self-assessed proficiency.
          </p>
          {CLIENT_NEEDS.map((cn) => {
            const isOpen = expanded === cn.id;
            return (
              <div key={cn.id} className={`rounded-2xl border ${cn.color} overflow-hidden`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : cn.id)}
                  className="w-full text-left p-4 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-bold text-sm mb-0.5 ${cn.headerColor}`}>
                        {cn.category}
                      </p>
                      {cn.weightMin > 0 && (
                        <p className="text-xs text-slate-500">
                          {cn.weightMin}–{cn.weightMax}% of exam
                        </p>
                      )}
                      {cn.weightMin === 0 && (
                        <p className="text-xs text-slate-500">
                          Contains multiple subcategories (see below)
                        </p>
                      )}
                    </div>
                    <span className="text-slate-500 text-lg flex-shrink-0" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-5">
                    <p className="text-sm text-slate-300 leading-relaxed">{cn.description}</p>

                    {cn.subcategories.map((sub) => {
                      const key = `${cn.id}:${sub.name}`;
                      const score = scores[key] ?? 0;
                      return (
                        <div key={sub.name} className="rounded-xl bg-slate-900/60 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <h4 className={`font-bold text-sm ${cn.headerColor}`}>{sub.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">My proficiency:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleScoreChange(cn.id, sub.name, star)}
                                    className={`text-lg focus:outline-none focus:ring-1 focus:ring-teal-500 rounded ${
                                      star <= score ? 'text-teal-400' : 'text-slate-700'
                                    }`}
                                    aria-label={`Rate ${sub.name} proficiency ${star} out of 5`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 mb-3 leading-relaxed">{sub.description}</p>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Sample topics
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {sub.sampleTopics.map((topic) => (
                                <span
                                  key={topic}
                                  className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CJMM tab */}
      {activeTab === 'cjmm' && (
        <div>
          <div className="mb-6 rounded-2xl border border-teal-500/20 bg-teal-900/10 p-5">
            <h3 className="font-bold text-teal-400 mb-2">Clinical Judgment Measurement Model</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              The NGN uses the NCSBN Clinical Judgment Measurement Model (CJMM) to assess
              higher-order thinking. Rather than testing isolated recall, NGN items require
              students to demonstrate the six cognitive skills that characterize expert clinical
              reasoning. These skills are embedded in all NGN item types (bowtie, extended
              drag-and-drop, matrix, trend, and enhanced multiple-choice).
            </p>
          </div>

          <div className="space-y-3">
            {CJMM_SKILLS.map((item, i) => (
              <div
                key={item.skill}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center">
                    <span className="text-teal-400 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.skill}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{item.description}</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Example
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed italic">{item.example}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
