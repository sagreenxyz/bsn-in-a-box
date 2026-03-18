/**
 * PatientEncounter.tsx
 *
 * Renders a longitudinal patient encounter vignette within MDX lesson content.
 * Displays the patient's name, a numbered encounter badge, and the narrative
 * clinical content as a prose block styled to be visually distinct from lesson prose.
 *
 * Props:
 *   patientId       — the longitudinal patient ID (used to look up patient data)
 *   encounterNumber — which encounter this is in the patient's timeline (1, 2, 3...)
 *   children        — the narrative clinical vignette prose content
 */

import React, { useState, useEffect } from 'react';

interface PatientData {
  name: string;
  age: number;
  gender: string;
  primaryDiagnosis: string;
}

interface PatientEncounterProps {
  patientId: string;
  encounterNumber: number;
  children: React.ReactNode;
}

const PATIENT_COLORS: Record<string, string> = {
  'marcus-webb': 'border-blue-500 bg-blue-900/10',
  'eleanor-vasquez': 'border-purple-500 bg-purple-900/10',
  'jordan-okafor': 'border-teal-500 bg-teal-900/10',
  'amara-osei': 'border-pink-500 bg-pink-900/10',
  'thomas-nguyen': 'border-orange-500 bg-orange-900/10',
  'ruth-abramowitz': 'border-gold-500 bg-gold-900/10',
};

const PATIENT_ICONS: Record<string, string> = {
  'marcus-webb': '👨🏿‍💻',
  'eleanor-vasquez': '👩🏽‍🏫',
  'jordan-okafor': '🧑🏾‍💼',
  'amara-osei': '🤰🏿',
  'thomas-nguyen': '🧒🏻',
  'ruth-abramowitz': '👩🏻‍⚕️',
};

export default function PatientEncounter({ patientId, encounterNumber, children }: PatientEncounterProps) {
  const [patient, setPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    async function loadPatient() {
      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
        const res = await fetch(`${base}/data/longitudinal-patients.json`);
        if (!res.ok) return;
        const patients: Array<PatientData & { patientId: string }> = await res.json();
        const found = patients.find((p) => p.patientId === patientId);
        if (found) setPatient(found);
      } catch (e) {
        // Non-critical — patient header will show generic label
      }
    }
    loadPatient();
  }, [patientId]);

  const colorClass = PATIENT_COLORS[patientId] ?? 'border-slate-500 bg-slate-900/10';
  const icon = PATIENT_ICONS[patientId] ?? '👤';

  return (
    <aside
      className={`my-8 rounded-2xl border-l-4 ${colorClass} p-6`}
      aria-label={`Patient encounter: ${patient?.name ?? patientId}, Encounter ${encounterNumber}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Longitudinal Patient Encounter {encounterNumber}
          </p>
          {patient ? (
            <h3 className="font-display text-lg font-bold text-white">
              {patient.name}, {patient.age} — {patient.primaryDiagnosis}
            </h3>
          ) : (
            <h3 className="font-display text-lg font-bold text-white capitalize">
              {patientId.replace(/-/g, ' ')}
            </h3>
          )}
        </div>
        <a
          href={`/patients/${patientId}`}
          className="ml-auto rounded-lg border border-current px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] flex items-center"
        >
          Patient Profile →
        </a>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed [&>p]:mb-3">
        {children}
      </div>
    </aside>
  );
}
