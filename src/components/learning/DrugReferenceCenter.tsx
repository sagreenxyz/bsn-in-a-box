/**
 * DrugReferenceCenter.tsx
 *
 * Searchable drug interaction checker loaded from public/data/drug-interactions.json.
 * Features:
 *   - Free-text search by drug name
 *   - Severity filter (major, moderate, contraindicated)
 *   - Expandable detail with mechanism, clinical effect, and nursing action
 *   - Color-coded severity badges
 */

import React, { useState, useEffect, useMemo } from 'react';

interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  mechanism: string;
  clinicalEffect: string;
  nursingAction: string;
}

const SEVERITY_CONFIG = {
  contraindicated: { label: 'CONTRAINDICATED', color: 'border-red-700 bg-red-900/20 text-red-300', badge: 'bg-red-900 text-red-300 border border-red-700' },
  major: { label: 'Major', color: 'border-orange-600 bg-orange-900/10 text-orange-300', badge: 'bg-orange-900/50 text-orange-300 border border-orange-600' },
  moderate: { label: 'Moderate', color: 'border-yellow-600 bg-yellow-900/10 text-yellow-300', badge: 'bg-yellow-900/50 text-yellow-300 border border-yellow-600' },
  minor: { label: 'Minor', color: 'border-slate-600 bg-slate-800 text-slate-300', badge: 'bg-slate-800 text-slate-400 border border-slate-600' },
};

export default function DrugReferenceCenter() {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
        const res = await fetch(`${base}/data/drug-interactions.json`);
        if (res.ok) setInteractions(await res.json());
      } catch (e) {
        console.warn('BSN: Could not load drug interactions:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() =>
    interactions.filter((i) => {
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      const searchLower = search.toLowerCase();
      const matchesSearch = search === '' || i.drug1.toLowerCase().includes(searchLower) || i.drug2.toLowerCase().includes(searchLower);
      return matchesSeverity && matchesSearch;
    }), [interactions, search, severityFilter]);

  if (loading) {
    return <div className="rounded-2xl border border-navy-700 bg-navy-900 p-8 text-center"><p className="text-slate-400">Loading drug interactions...</p></div>;
  }

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">Drug Interaction Reference</h2>
      <p className="mb-6 text-sm text-slate-400">
        High-alert drug interactions with nursing actions. Search by drug name. Data loaded locally.
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="drug-search" className="sr-only">Search by drug name</label>
          <input
            id="drug-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by drug name..."
            className="w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 pl-10 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <span className="absolute left-3 top-3.5 text-slate-500" aria-hidden="true">🔍</span>
        </div>
        <div>
          <label htmlFor="severity-filter" className="sr-only">Filter by severity</label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-slate-200 focus:border-teal-500 focus:outline-none min-h-[44px]"
          >
            <option value="all">All Severities</option>
            <option value="contraindicated">Contraindicated</option>
            <option value="major">Major</option>
            <option value="moderate">Moderate</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-8">No interactions match your search.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((interaction) => {
            const config = SEVERITY_CONFIG[interaction.severity] ?? SEVERITY_CONFIG.minor;
            const isExpanded = expandedId === interaction.id;

            return (
              <div key={interaction.id} className={`rounded-2xl border overflow-hidden ${config.color}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : interaction.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 min-h-[44px]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {interaction.drug1} <span className="text-slate-400">↔</span> {interaction.drug2}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${config.badge}`}>
                    {config.label}
                  </span>
                  <span className="flex-shrink-0 text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Mechanism</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{interaction.mechanism}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Clinical Effect</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{interaction.clinicalEffect}</p>
                    </div>
                    <div className="rounded-xl bg-navy-700 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">Nursing Action</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{interaction.nursingAction}</p>
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
