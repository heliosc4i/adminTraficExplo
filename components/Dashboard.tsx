import React, { useState, useMemo, useEffect } from 'react';
import { MessageStats, User, Zone, Station } from '../types';
import { UsersIcon, GlobeAltIcon, RadioIcon, ArrowUpIcon, ArrowDownIcon, DocumentTextIcon, ClipboardListIcon, ExclamationCircleIcon, CheckCircleIcon } from './Icons';
import * as api from '../api';

interface DashboardProps {
  stats: MessageStats[];
  users: User[];
  zones: Zone[];
  stations: Station[];
  onRefreshStats: () => Promise<void>;
}

const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));
const getYesterday = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
};
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return getStartOfDay(new Date(d.setDate(diff)));
};
const getStartOfMonth = (date: Date) => getStartOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
const getStartOfYear = (date: Date) => getStartOfDay(new Date(date.getFullYear(), 0, 1));
const formatDateForFiltering = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const parseLocalDateFromString = (dateString: string): Date => {
    const parts = dateString.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};


const Dashboard: React.FC<DashboardProps> = ({ stats, users, zones, stations, onRefreshStats }) => {
  const [displayStats, setDisplayStats] = useState<MessageStats[]>(stats);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [alertDate, setAlertDate] = useState<string>(formatDateForFiltering(new Date()));
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeFilter === 'all') setDisplayStats(stats);
  }, [stats, activeFilter]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (activeFilter === 'all') onRefreshStats();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [onRefreshStats, activeFilter]);

  const fetchFilteredStats = async (start?: Date, end?: Date) => {
    setIsLoading(true);
    try {
      const filtered = await api.getStats(start, end);
      setDisplayStats(filtered);
    } catch (error) {
      console.error("Failed to fetch filtered stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setDateFilter = (period: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    const today = new Date();
    setActiveFilter(period);
    let start: Date, end: Date;
    switch (period) {
      case 'today':
        start = getStartOfDay(today); end = getEndOfDay(today);
        setAlertDate(formatDateForFiltering(new Date()));
        break;
      case 'yesterday':
        const yesterday = getYesterday();
        start = getStartOfDay(yesterday); end = getEndOfDay(yesterday);
        setAlertDate(formatDateForFiltering(yesterday));
        break;
      case 'week':
        start = getStartOfWeek(today); end = getEndOfDay(today);
        setAlertDate(formatDateForFiltering(new Date()));
        break;
      case 'month':
        start = getStartOfMonth(today); end = getEndOfDay(today);
        setAlertDate(formatDateForFiltering(new Date()));
        break;
      case 'year':
        start = getStartOfYear(today); end = getEndOfDay(today);
        setAlertDate(formatDateForFiltering(new Date()));
        break;
    }
    fetchFilteredStats(start, end);
  };

  const handleCustomDateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const startInput = form.elements.namedItem('startDate') as HTMLInputElement;
    const endInput = form.elements.namedItem('endDate') as HTMLInputElement;
    if (startInput.value && endInput.value) {
      setActiveFilter('custom');
      const start = new Date(startInput.value);
      const end = new Date(endInput.value);
      // Synchronise le panel "Zones sans soumission" sur le dernier jour de la plage sélectionnée
      setAlertDate(endInput.value);
      fetchFilteredStats(getStartOfDay(start), getEndOfDay(end));
    }
  };

  const resetFilters = () => {
    setActiveFilter('all');
    setDisplayStats(stats);
    setAlertDate(formatDateForFiltering(new Date()));
    const form = document.getElementById('custom-date-form') as HTMLFormElement;
    if (form) form.reset();
  };

  const staticKpiData = useMemo(() => {
    const comzonesCount = users.filter(u => u.role === 'COMZONE').length;
    return { zones: zones.length, stations: stations.length, comzones: comzonesCount };
  }, [users, zones, stations]);

  const submissionCardLabel = useMemo(() => {
    switch (activeFilter) {
      case 'all': case 'today': return "Aujourd'hui";
      case 'yesterday': return "Hier";
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'year': return "Cette année";
      case 'custom': return 'Période';
      default: return '';
    }
  }, [activeFilter]);

  const submissionKpiData = useMemo(() => {
    const sourceStats = activeFilter === 'all'
      ? stats.filter(s => s.date === formatDateForFiltering(new Date()))
      : displayStats;
    const uniqueStations = new Set(sourceStats.map(s => s.stationId));
    return {
      submittedCount: uniqueStations.size,
      submissionRate: stations.length > 0 ? (uniqueStations.size / stations.length) * 100 : 0,
    };
  }, [activeFilter, displayStats, stats, stations.length]);

  const filteredTotals = useMemo(() => {
    return displayStats.reduce((acc, s) => {
      acc.sent += s.messagesSent;
      acc.received += s.messagesReceived;
      return acc;
    }, { sent: 0, received: 0 });
  }, [displayStats]);

  const latestSubmissions = useMemo(() => {
    const sourceData = activeFilter === 'all' ? stats : displayStats;
    return [...sourceData]
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        return d !== 0 ? d : parseInt(b.id, 10) - parseInt(a.id, 10);
      })
      .slice(0, 5);
  }, [stats, displayStats, activeFilter]);

  const zonesWithMissingSubmissions = useMemo(() => {
    const windowStart = (() => {
      const d = new Date(alertDate);
      d.setDate(d.getDate() - 30);
      return formatDateForFiltering(d);
    })();
    const recentlyActiveStationIds = new Set(
      stats.filter((s: MessageStats) => s.date >= windowStart && s.date <= alertDate).map((s: MessageStats) => s.stationId)
    );
    const submittedOnAlertDate = new Set(
      stats.filter((s: MessageStats) => s.date === alertDate).map((s: MessageStats) => s.stationId)
    );
    return zones
      .map((zone: Zone) => {
        const zoneStations = stations.filter((s: Station) => s.zoneId === zone.id);
        const activeStations = zoneStations.filter((s: Station) => recentlyActiveStationIds.has(s.id));
        const missingStations = activeStations.filter((s: Station) => !submittedOnAlertDate.has(s.id));
        return { zone, zoneStations: activeStations, missingStations };
      })
      .filter((item: { zone: Zone; zoneStations: Station[]; missingStations: Station[] }) =>
        item.zoneStations.length > 0 && item.missingStations.length > 0
      )
      .sort((a: { missingStations: Station[] }, b: { missingStations: Station[] }) =>
        b.missingStations.length - a.missingStations.length
      );
  }, [alertDate, stats, zones, stations]);

  const toggleZoneExpansion = (zoneId: string) => {
    setExpandedZones((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId); else next.add(zoneId);
      return next;
    });
  };

  const FilterButton: React.FC<{ period: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year'; label: string }> = ({ period, label }) => {
    const action = period === 'all' ? resetFilters : () => setDateFilter(period as 'today' | 'yesterday' | 'week' | 'month' | 'year');
    return (
      <button
        onClick={action}
        className={`flex-1 text-center px-2 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none whitespace-nowrap ${
          activeFilter === period ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {label}
      </button>
    );
  };

  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'all': return 'globales';
      case 'today': return "d'aujourd'hui";
      case 'yesterday': return "d'hier";
      case 'week': return 'de la semaine';
      case 'month': return 'du mois';
      case 'year': return "de l'année";
      case 'custom': return 'personnalisées';
      default: return '';
    }
  }, [activeFilter]);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord</h2>
        <p className="mt-0.5 text-sm text-gray-500 capitalize">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50 text-blue-600"><GlobeAltIcon /></div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Zones</p>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{staticKpiData.zones}</p>
            </div>
          </div>
          <div className="h-1 bg-blue-500"></div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-shrink-0 p-3 rounded-lg bg-emerald-50 text-emerald-600"><RadioIcon /></div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Stations</p>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{staticKpiData.stations}</p>
            </div>
          </div>
          <div className="h-1 bg-emerald-500"></div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-shrink-0 p-3 rounded-lg bg-violet-50 text-violet-600"><UsersIcon /></div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{staticKpiData.comzones}</p>
            </div>
          </div>
          <div className="h-1 bg-violet-500"></div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-shrink-0 p-3 rounded-lg bg-amber-50 text-amber-600"><ClipboardListIcon /></div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Soumissions · {submissionCardLabel}</p>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {submissionKpiData.submittedCount}
                <span className="ml-1 text-lg font-medium text-gray-400">/ {staticKpiData.stations}</span>
              </p>
            </div>
          </div>
          <div className="h-1 bg-amber-400"></div>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 w-full">
            <div className="flex flex-1 items-center gap-0.5 p-1 bg-gray-100 rounded-lg">
              <FilterButton period="today" label="Aujourd'hui" />
              <FilterButton period="yesterday" label="Hier" />
              <FilterButton period="week" label="Cette semaine" />
              <FilterButton period="month" label="Ce mois" />
              <FilterButton period="year" label="Cette année" />
              {activeFilter !== 'all' && <FilterButton period="all" label="↺ Réinit." />}
            </div>
            <div className="w-px self-stretch bg-gray-200"></div>
            <form id="custom-date-form" onSubmit={handleCustomDateSearch} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Du</span>
              <input type="date" name="startDate" className="px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required />
              <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">au</span>
              <input type="date" name="endDate" className="px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required />
              <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 rounded-lg bg-navy-600 hover:bg-navy-700 whitespace-nowrap">Rechercher</button>
            </form>
        </div>
      </div>

      {/* Filtered Stats */}
      <div>
        <p className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">Statistiques {filterLabel}</p>
        {isLoading ? (
          <div className="flex items-center justify-center p-8 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400">
            <svg className="w-5 h-5 mr-2 animate-spin text-navy-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50 text-blue-600"><ArrowUpIcon /></div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Émis</p>
                <p className="text-2xl font-bold text-blue-600 sm:text-3xl">{filteredTotals.sent.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex-shrink-0 p-3 rounded-lg bg-emerald-50 text-emerald-600"><ArrowDownIcon /></div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Reçus</p>
                <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">{filteredTotals.received.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex-shrink-0 p-3 rounded-lg bg-violet-50 text-violet-600"><DocumentTextIcon /></div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Total</p>
                <p className="text-2xl font-bold text-violet-600 sm:text-3xl">{(filteredTotals.sent + filteredTotals.received).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Recent Submissions + Missing Zones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent Submissions */}
        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Dernières Soumissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Zone</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Station</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Émis / Reçus</th>
                </tr>
              </thead>
              <tbody>
                {latestSubmissions.length > 0 ? (
                  latestSubmissions.map(stat => (
                    <tr key={stat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{parseLocalDateFromString(stat.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">{zones.find(z => z.id === stat.zoneId)?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{stations.find(s => s.id === stat.stationId)?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                        <span className="font-semibold text-blue-600">{stat.messagesSent}</span>
                        <span className="mx-1.5 text-gray-300">/</span>
                        <span className="font-semibold text-emerald-600">{stat.messagesReceived}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-sm text-center text-gray-400">Aucune soumission.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zones sans soumission */}
        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ExclamationCircleIcon className="flex-shrink-0 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-800">Zones sans soumission</h3>
              {zonesWithMissingSubmissions.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {zonesWithMissingSubmissions.length}
                </span>
              )}
            </div>
            <input
              type="date"
              value={alertDate}
              onChange={e => setAlertDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>

          {zonesWithMissingSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-emerald-500">
              <CheckCircleIcon />
              <p className="mt-2 text-sm font-medium text-emerald-600">Toutes les zones ont soumis.</p>
            </div>
          ) : (
            <ul className="overflow-y-auto divide-y divide-gray-50 max-h-80">
              {zonesWithMissingSubmissions.map(({ zone, zoneStations, missingStations }) => {
                const submittedCount = zoneStations.length - missingStations.length;
                const isPartial = submittedCount > 0;
                const isExpanded = expandedZones.has(zone.id);
                return (
                  <li key={zone.id}>
                    <button
                      onClick={() => toggleZoneExpansion(zone.id)}
                      className="flex items-center justify-between w-full px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${isPartial ? 'bg-amber-400' : 'bg-red-500'}`}></span>
                        <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isPartial ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {isPartial ? 'Partielle' : 'Aucune'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-gray-400">{submittedCount}/{zoneStations.length}</span>
                        <svg className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pt-1 pb-3 bg-gray-50">
                        <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Stations manquantes</p>
                        <ul className="space-y-1.5">
                          {missingStations.map(station => (
                            <li key={station.id} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400"></span>
                              {station.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
