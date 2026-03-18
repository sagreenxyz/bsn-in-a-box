/**
 * LabValueReference.tsx
 *
 * A searchable, filterable reference for clinical lab values. Data is loaded
 * from public/data/lab-values.json. Features:
 *   - Search by lab name or system
 *   - Filter by body system panel
 *   - Each entry shows: normal range, panic values, clinical significance,
 *     common causes of elevation/decrease, and nursing actions
 *   - Expandable detail view for each lab value
 */

import React, { useState, useEffect, useMemo } from 'react';

interface LabValue {
  id: string;
  name: string;
  system: string;
  panel: string;
  normalRange: { low: number; high: number };
  units: string;
  panicLow: number | null;
  panicHigh: number | null;
  significance: string;
  causesElevated: string[];
  causesDecreased: string[];
  nursingActions: string;
}

const SYSTEM_COLORS: Record<string, string> = {
  electrolytes: 'border-teal-500/30 text-teal-400',
  metabolic: 'border-purple-500/30 text-purple-400',
  renal: 'border-blue-500/30 text-blue-400',
  hematology: 'border-crimson-500/30 text-crimson-400',
  hepatic: 'border-orange-500/30 text-orange-400',
  cardiac: 'border-red-500/30 text-red-400',
  coagulation: 'border-yellow-500/30 text-yellow-400',
};

export default function LabValueReference() {
  const [labs, setLabs] = useState<LabValue[]>([]);
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
        const res = await fetch(`${base}/data/lab-values.json`);
        if (res.ok) {
          const data = await res.json();
          setLabs(data);
        }
      } catch (e) {
        console.warn('BSN: Could not load lab values:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const systems = useMemo(() => ['all', ...Array.from(new Set(labs.map((l) => l.system)))], [labs]);

  const filtered = useMemo(() =>
    labs.filter((l) =>
      (systemFilter === 'all' || l.system === systemFilter) &&
      (search === '' || l.name.toLowerCase().includes(search.toLowerCase()) || l.system.toLowerCase().includes(search.toLowerCase()))
    ), [labs, search, systemFilter]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center">
        <p className="text-slate-400">Loading lab values reference...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Lab Values Reference</h2>
      <p className="mb-6 text-sm text-slate-400">Clinical reference with normal ranges, panic values, causes, and nursing actions.</p>

      {/* Search and filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="lab-search" className="sr-only">Search lab values</label>
          <input
            id="lab-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lab name or system..."
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 pl-10 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <span className="absolute left-3 top-3.5 text-slate-500" aria-hidden="true">🔍</span>
        </div>
        <div>
          <label htmlFor="system-filter" className="sr-only">Filter by system</label>
          <select
            id="system-filter"
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-slate-200 focus:border-teal-500 focus:outline-none min-h-[44px]"
          >
            {systems.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Systems' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lab list */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No lab values match your search.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lab) => {
            const isExpanded = expandedId === lab.id;
            const colorClass = SYSTEM_COLORS[lab.system] ?? 'border-slate-500/30 text-slate-400';

            return (
              <div key={lab.id} className="rounded-2xl border border-navy-700 bg-navy-800 overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : lab.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 min-h-[44px]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white">{lab.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${colorClass}`}>
                        {lab.system}
                      </span>
                      <span className="text-xs text-slate-400">{lab.panel}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm font-bold text-teal-400">
                      {lab.normalRange.low}–{lab.normalRange.high}
                    </p>
                    <p className="text-xs text-slate-500">{lab.units}</p>
                  </div>
                  <span className="flex-shrink-0 text-slate-400 text-sm ml-2">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-navy-700 p-5 space-y-4">
                    {/* Panic values */}
                    {(lab.panicLow !== null || lab.panicHigh !== null) && (
                      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-3">
                        <p className="text-xs font-semibold text-crimson-400 mb-1">⚠ Panic Values — Notify immediately</p>
                        <p className="text-sm text-slate-200">
                          {lab.panicLow !== null && `Low: <${lab.panicLow} ${lab.units}`}
                          {lab.panicLow !== null && lab.panicHigh !== null && ' · '}
                          {lab.panicHigh !== null && `High: >${lab.panicHigh} ${lab.units}`}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Clinical Significance</p>
                      <p className="text-sm leading-relaxed text-slate-300">{lab.significance}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {lab.causesElevated.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-400 mb-2">↑ Causes of Elevation</p>
                          <ul className="space-y-1">
                            {lab.causesElevated.map((c, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-1.5">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>{c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lab.causesDecreased.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-blue-400 mb-2">↓ Causes of Decrease</p>
                          <ul className="space-y-1">
                            {lab.causesDecreased.map((c, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5 flex-shrink-0">▸</span>{c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-navy-700 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2">Nursing Actions</p>
                      <p className="text-sm leading-relaxed text-slate-200">{lab.nursingActions}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
