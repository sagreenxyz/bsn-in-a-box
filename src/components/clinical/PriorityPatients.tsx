/**
 * PriorityPatients.tsx
 *
 * Multi-patient assignment scenarios. Students receive a 4-6 patient
 * assignment and must triage, set priorities, and make delegation decisions.
 * Each scenario presents a batch of patients with brief status summaries,
 * then asks the student to answer priority-setting and delegation questions.
 *
 * Uses NCLEX-NGN priority-setting and delegation concepts from the Client
 * Needs category: Management of Care.
 */

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientBrief {
  id: string;
  name: string;
  room: string;
  age: number;
  diagnosis: string;
  status: string;
  vitals?: string;
  urgencyLevel: 'urgent' | 'stable' | 'watch';
}

interface ScenarioQuestion {
  id: string;
  question: string;
  choices: {
    id: string;
    text: string;
    isCorrect: boolean;
    rationale: string;
  }[];
}

interface PriorityScenario {
  id: string;
  title: string;
  context: string;
  patients: PatientBrief[];
  questions: ScenarioQuestion[];
}

// ─── Scenario data ────────────────────────────────────────────────────────────

const SCENARIOS: PriorityScenario[] = [
  {
    id: 'med-surg-morning',
    title: 'Medical-Surgical Morning Shift',
    context:
      "You are a BSN-prepared RN beginning the 0700 shift on a 32-bed medical-surgical unit. You receive report from the night nurse. You have a 4-patient assignment. Your unit also has one UAP (unlicensed assistive personnel) available to you. It is 0715. Which patient will you see FIRST?",
    patients: [
      {
        id: 'pt-a',
        name: 'A. Harrison, Robert',
        room: '412',
        age: 67,
        diagnosis: 'Post-op day 2 right hip arthroplasty',
        status: "Night nurse reports: 'He's complaining his pain is a 7/10 but he refused morphine at 0300 because it made him nauseous last time. He is due for PT at 0900.'",
        vitals: 'T 37.2, HR 82, BP 136/82, RR 16, SpO2 97% RA',
        urgencyLevel: 'watch',
      },
      {
        id: 'pt-b',
        name: 'B. Chen, Eleanor',
        room: '413',
        age: 74,
        diagnosis: 'Pneumonia, day 3 of IV cefazolin',
        status: "Night nurse reports: 'She was restless at 0500. She is normally oriented × 3 at baseline but seemed confused about where she was this morning. O2 sat was 91% on 2L NC at 0600 — I boosted her to 4L and it came up to 94%.'",
        vitals: 'T 38.4, HR 96, BP 118/72, RR 24, SpO2 94% on 4L NC (was 91% at 0600)',
        urgencyLevel: 'urgent',
      },
      {
        id: 'pt-c',
        name: 'C. Washington, Darnell',
        room: '414',
        age: 45,
        diagnosis: 'Type 2 DM, admitted for cellulitis left lower extremity',
        status: "Night nurse reports: 'He's been stable all night. Fasting glucose this morning was 218 — his target is <140. He's asking about his discharge paperwork and wants to call his wife.'",
        vitals: 'T 37.5, HR 78, BP 128/80, RR 14, SpO2 98% RA',
        urgencyLevel: 'stable',
      },
      {
        id: 'pt-d',
        name: 'D. Alvarez, Carmen',
        room: '415',
        age: 58,
        diagnosis: 'CHF exacerbation, day 2 IV furosemide',
        status: "Night nurse reports: 'She's been diuresing well — put out 3,200 mL over the last 24 hours. Her weight is down 2.8 kg from admission. She's on telemetry — had a couple of PVCs last night but otherwise NSR. Her potassium this morning was 3.1 and the doc has been paged but hasn't called back yet.'",
        vitals: 'T 36.9, HR 88 NSR with occasional PVCs, BP 142/88, RR 18, SpO2 96% 2L NC',
        urgencyLevel: 'urgent',
      },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Which patient should you assess FIRST at the start of your shift?',
        choices: [
          {
            id: 'q1a',
            text: 'Room 412: Robert Harrison — He is in pain (7/10) and has PT at 0900, so you need to address his pain before his therapy session.',
            isCorrect: false,
            rationale:
              "Pain is a priority, but a 7/10 pain score in a patient who is post-op day 2 and hemodynamically stable is not an immediate life threat. Robert can wait while you assess more acute situations — he will need pain management before PT at 0900, but you have time.",
          },
          {
            id: 'q1b',
            text: "Room 413: Eleanor Chen — New confusion, fever, tachypnea (RR 24), and O2 sat that dropped to 91% overnight in a patient with pneumonia represents a potential clinical deterioration requiring immediate assessment.",
            isCorrect: true,
            rationale:
              "Eleanor's presentation is a red flag constellation: new-onset confusion in an older adult is a significant sign of deterioration (sepsis, worsening hypoxia, medication effect). Her RR of 24 indicates work of breathing. Her O2 requiring upsizing from 2L to 4L overnight suggests worsening gas exchange. In a patient with pneumonia who is day 3 of antibiotics, this picture should prompt immediate assessment and possible rapid response team activation. New confusion + respiratory deterioration = see first.",
          },
          {
            id: 'q1c',
            text: "Room 415: Carmen Alvarez — Her potassium of 3.1 is critically low and her provider hasn't returned the page, so this needs to be escalated.",
            isCorrect: false,
            rationale:
              "Carmen's hypokalemia (3.1) requires follow-up and is clinically significant — especially with her PVCs and ongoing furosemide. However, her current vitals are stable, her rhythm is NSR with only occasional PVCs (not sustained dysrhythmia), and the provider has been paged. This is a priority but not your first assessment — Eleanor's acute respiratory change is more immediately threatening.",
          },
          {
            id: 'q1d',
            text: "Room 414: Darnell Washington — His glucose of 218 needs to be addressed before it worsens, and he is asking to leave, which suggests he may be at risk for AMA discharge.",
            isCorrect: false,
            rationale:
              "A glucose of 218 in a patient with type 2 DM and cellulitis is elevated but not an immediate emergency — it requires a call to the provider for sliding scale coverage but is not a priority over acute respiratory or hemodynamic issues. His desire for discharge paperwork doesn't signal AMA risk — he is asking about a timeline, which is appropriate to address once urgent patient needs are met.",
          },
        ],
      },
      {
        id: 'q2',
        question: "Which task from the following list is APPROPRIATE to delegate to your UAP?",
        choices: [
          {
            id: 'q2a',
            text: "Obtain Mrs. Chen's vital signs and report them to you immediately.",
            isCorrect: true,
            rationale:
              "Vital sign measurement is within the UAP scope of practice and is a non-judgment, measurable task appropriate for delegation — provided the nurse gives clear direction to report the values immediately, with specific parameters for what to report (e.g., 'tell me right away if her SpO2 drops below 93%, her RR is above 22, or she becomes more confused'). The nurse retains accountability for acting on the findings.",
          },
          {
            id: 'q2b',
            text: "Administer Mr. Harrison's non-opioid analgesic (scheduled acetaminophen) so he is ready for PT.",
            isCorrect: false,
            rationale:
              "Medication administration is NOT within the scope of practice of a UAP. Only licensed nurses and pharmacy professionals may administer medications. Delegating medication administration to a UAP is a scope-of-practice violation regardless of how routine the medication appears.",
          },
          {
            id: 'q2c',
            text: "Assess Mrs. Alvarez's heart rhythm on telemetry and determine whether her PVCs are clinically significant.",
            isCorrect: false,
            rationale:
              "Cardiac rhythm interpretation is a clinical assessment and judgment task that requires nursing licensure. UAPs may observe telemetry monitors and report changes to the nurse, but interpretation and clinical judgment about rhythm significance is exclusively within the RN scope of practice.",
          },
          {
            id: 'q2d',
            text: "Call the provider back about Mrs. Alvarez's potassium value and receive orders.",
            isCorrect: false,
            rationale:
              "Provider communication and order receipt requires a licensed nurse. A UAP cannot legally receive verbal or telephone orders, interpret medical orders, or communicate clinical assessment findings to providers in a way that involves clinical judgment. This task must be performed by the RN.",
          },
        ],
      },
      {
        id: 'q3',
        question: "Mrs. Alvarez's provider still has not returned your page at 0800. Her potassium is 3.1 and she continues to have PVCs. What is your NEXT priority action?",
        choices: [
          {
            id: 'q3a',
            text: 'Wait another 30 minutes before escalating — the provider may be in surgery.',
            isCorrect: false,
            rationale:
              "Waiting an additional 30 minutes with a patient whose potassium is 3.1 and who is having PVCs while on a loop diuretic is not an appropriate response. The RN has a duty to escalate when a critical lab value is unaddressed and the patient is symptomatic (PVCs represent a dysrhythmia risk with hypokalemia).",
          },
          {
            id: 'q3b',
            text: "Use the chain of command: contact the charge nurse to report the unanswered page, and then contact the provider's covering physician or hospitalist.",
            isCorrect: true,
            rationale:
              "The chain of command exists precisely for situations like this. When a provider is unreachable and a patient has an urgent clinical need (hypokalemia with dysrhythmia, loop diuretic ongoing), the RN escalates through the chain: charge nurse → covering provider → attending or hospitalist → medical director, if needed. Document every step and the time of each contact. This protects the patient and creates a clear record of the RN's advocacy.",
          },
          {
            id: 'q3c',
            text: "Administer oral potassium supplement from the floor supply since you know that is what she will be ordered anyway.",
            isCorrect: false,
            rationale:
              "Independent administration of a medication without an order — even a predictable, expected one — is beyond the RN scope of practice. Potassium supplementation (oral or IV) requires a provider order because the dose, route, and frequency must be individually determined. Administering it without an order constitutes practicing medicine and could harm the patient.",
          },
          {
            id: 'q3d',
            text: "Place the patient on continuous telemetry if she is not already, and perform a 12-lead ECG.",
            isCorrect: false,
            rationale:
              "Continuous telemetry monitoring is appropriate for a patient with hypokalemia and PVCs, but the question states she is already on telemetry. A 12-lead ECG may provide useful information (to look for U waves, QT prolongation) and is within the RN scope of practice — however, it does not address the core problem: the potassium needs to be replaced, which requires a provider order. Monitoring alone is not sufficient escalation.",
          },
        ],
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<string, string> = {
  urgent: 'border-red-500/50 bg-red-900/10',
  watch: 'border-yellow-500/50 bg-yellow-900/10',
  stable: 'border-slate-700 bg-slate-900',
};

const URGENCY_BADGE: Record<string, string> = {
  urgent: 'text-red-400 border-red-400',
  watch: 'text-yellow-400 border-yellow-400',
  stable: 'text-slate-400 border-slate-600',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function PriorityPatients() {
  const [scenarioIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [complete, setComplete] = useState(false);

  const scenario = SCENARIOS[scenarioIndex];
  const currentQ = scenario.questions[questionIndex];
  const selectedChoice = currentQ ? answers[currentQ.id] : undefined;
  const isRevealed = currentQ ? !!revealed[currentQ.id] : false;
  const correctChoice = currentQ?.choices.find((c) => c.isCorrect);
  const selectedChoiceObj = currentQ?.choices.find((c) => c.id === selectedChoice);

  const handleSelect = (choiceId: string) => {
    if (revealed[currentQ.id]) return;
    setAnswers((a) => ({ ...a, [currentQ.id]: choiceId }));
  };

  const handleReveal = () => {
    setRevealed((r) => ({ ...r, [currentQ.id]: true }));
  };

  const handleNext = () => {
    if (questionIndex < scenario.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setComplete(true);
    }
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setAnswers({});
    setRevealed({});
    setComplete(false);
  };

  // Score summary
  const scoreData = scenario.questions.map((q) => {
    const chosen = answers[q.id];
    const choice = q.choices.find((c) => c.id === chosen);
    return choice?.isCorrect ?? false;
  });
  const correct = scoreData.filter(Boolean).length;

  if (complete) {
    const pct = Math.round((correct / scenario.questions.length) * 100);
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center">
        <p className="text-5xl mb-4" aria-hidden="true">{pct >= 80 ? '🏆' : '📚'}</p>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Scenario Complete</h2>
        <p className="text-slate-400 mb-6">{scenario.title}</p>
        <div className="inline-block rounded-2xl border border-slate-700 bg-slate-900 px-10 py-6 mb-6">
          <p className="text-5xl font-black text-white mb-1">{correct} / {scenario.questions.length}</p>
          <p className={`text-lg font-bold ${pct >= 80 ? 'text-teal-400' : 'text-orange-400'}`}>
            {pct >= 80 ? 'Strong clinical prioritization' : 'Review priority-setting principles and retry'}
          </p>
        </div>
        <div>
          <button
            onClick={handleRestart}
            className="rounded-2xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
          >
            Retry Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Priority Patients</h2>
      <p className="mb-1 text-sm text-slate-400">{scenario.context}</p>

      {/* Patient panel */}
      <div className="mt-5 mb-6 grid gap-3 sm:grid-cols-2">
        {scenario.patients.map((pt) => (
          <div
            key={pt.id}
            className={`rounded-2xl border p-4 ${URGENCY_STYLES[pt.urgencyLevel]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-white text-sm">{pt.name}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${URGENCY_BADGE[pt.urgencyLevel]}`}
              >
                {pt.urgencyLevel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-1">Room {pt.room} · Age {pt.age} · {pt.diagnosis}</p>
            {pt.vitals && (
              <p className="text-xs text-slate-400 mb-1 font-mono">{pt.vitals}</p>
            )}
            <p className="text-xs text-slate-400 leading-relaxed italic">{pt.status}</p>
          </div>
        ))}
      </div>

      {/* Question */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-teal-400 text-sm uppercase tracking-wider">
          Question {questionIndex + 1} of {scenario.questions.length}
        </h3>
      </div>
      <p className="text-white font-semibold mb-4 leading-relaxed">{currentQ.question}</p>

      <div className="space-y-2 mb-4">
        {currentQ.choices.map((choice) => {
          const isSelected = selectedChoice === choice.id;
          const isThisCorrect = choice.isCorrect;
          let style = 'border-slate-700 bg-slate-900 hover:border-slate-600';
          if (isRevealed) {
            if (isThisCorrect) style = 'border-teal-500 bg-teal-900/20';
            else if (isSelected && !isThisCorrect) style = 'border-red-500 bg-red-900/10';
          } else if (isSelected) {
            style = 'border-teal-500 bg-teal-900/20';
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              disabled={isRevealed}
              className={`w-full text-left rounded-2xl border p-4 text-sm text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${style} ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {/* Rationale */}
      {isRevealed && selectedChoiceObj && (
        <div
          className={`mb-4 rounded-2xl border-l-4 p-4 ${
            selectedChoiceObj.isCorrect ? 'border-teal-500 bg-teal-900/20' : 'border-red-500 bg-red-900/10'
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              selectedChoiceObj.isCorrect ? 'text-teal-400' : 'text-red-400'
            }`}
          >
            {selectedChoiceObj.isCorrect ? '✓ Correct' : `✗ Incorrect — Correct answer: ${correctChoice?.id.toUpperCase()}`}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{selectedChoiceObj.rationale}</p>
          {!selectedChoiceObj.isCorrect && correctChoice && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs font-bold text-teal-400 mb-1">Why the correct answer is better:</p>
              <p className="text-sm text-slate-300 leading-relaxed">{correctChoice.rationale}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isRevealed && selectedChoice && (
          <button
            onClick={handleReveal}
            className="flex-1 rounded-2xl border border-teal-600 px-5 py-2.5 font-semibold text-teal-300 hover:bg-teal-900/20 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          >
            Reveal Answer & Rationale
          </button>
        )}
        {isRevealed && (
          <button
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
          >
            {questionIndex < scenario.questions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        )}
      </div>
    </div>
  );
}
