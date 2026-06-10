import React, { useState, useMemo, useEffect } from 'react';
import { MessageStats, User, Zone, Station } from '../types';
import Pagination from './Pagination';
import { DownloadIcon } from './Icons';

// --- Date Helper Functions ---
const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));
const getYesterday = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
}
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return getStartOfDay(new Date(d.setDate(diff)));
};
const getStartOfMonth = (date: Date) => getStartOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
const getStartOfYear = (date: Date) => getStartOfDay(new Date(date.getFullYear(), 0, 1));
const parseLocalDateFromString = (dateString: string): Date => {
    const parts = dateString.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

interface StatsViewerProps {
  stats: MessageStats[];
  users: User[];
  zones: Zone[];
  stations: Station[];
}

interface ChartData {
    label: string;
    sent: number;
    received: number;
}

const ITEMS_PER_PAGE = 10;

const BarChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    const maxValue = useMemo(() => {
        if (data.length === 0) return 1;
        const max = Math.max(...data.flatMap(d => [d.sent, d.received]));
        return max === 0 ? 1 : max;
    }, [data]);

    if (data.length === 0) {
        return <div className="flex items-center justify-center h-64 p-4 text-gray-500 bg-gray-50 rounded-lg">Aucune donnée à afficher pour la sélection actuelle.</div>
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-700">Messages Émis vs. Reçus</h3>
            <div className="overflow-x-auto hide-scrollbar">
                 <div className="flex items-end h-80 px-4 space-x-4 border-l border-b border-gray-200" style={{ minWidth: `${data.length * 60}px`}}>
                    {data.map(item => (
                        <div key={item.label} className="relative flex flex-col items-center flex-1 h-full">
                            <div className="flex items-end flex-grow w-full h-full gap-2">
                                 <div className="relative w-1/2 group" style={{ height: `${(item.sent / maxValue) * 100}%` }}>
                                    <div className="w-full h-full bg-blue-500 rounded-t-md hover:bg-blue-600"></div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        Émis: {item.sent.toLocaleString()}
                                    </div>
                                </div>
                                <div className="relative w-1/2 group" style={{ height: `${(item.received / maxValue) * 100}%` }}>
                                    <div className="w-full h-full bg-green-500 rounded-t-md hover:bg-green-600"></div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        Reçus: {item.received.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                             <div className="h-24 pt-2 flex items-start justify-center" style={{ width: '100%' }}>
                                <div className="transform rotate-[-65deg] origin-top-center">
                                    <span className="text-xs text-gray-600 whitespace-nowrap">{item.label}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex items-center justify-center mt-4 space-x-4">
                <div className="flex items-center"><div className="w-3 h-3 mr-2 bg-blue-500 rounded-sm"></div><span className="text-sm text-gray-600">Émis</span></div>
                <div className="flex items-center"><div className="w-3 h-3 mr-2 bg-green-500 rounded-sm"></div><span className="text-sm text-gray-600">Reçus</span></div>
            </div>
        </div>
    );
};

// --- Composants d'analyse ---

const MedalIcon: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
};

const PodiumCard: React.FC<{ rank: number; name: string; total: number; sent: number; received: number; subtitle?: string }> = ({ rank, name, total, sent, received, subtitle }) => {
    const styles: Record<number, string> = {
        1: 'border-yellow-400 bg-yellow-50',
        2: 'border-gray-300 bg-gray-50',
        3: 'border-orange-300 bg-orange-50',
    };
    const style = styles[rank] || 'border-gray-200 bg-white';
    return (
        <div className={`flex flex-col items-center p-4 border-2 rounded-xl shadow-sm text-center ${style}`}>
            <MedalIcon rank={rank} />
            <p className="mt-2 text-sm font-bold text-gray-800 leading-tight">{name}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            <p className="mt-3 text-2xl font-extrabold text-gray-900">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">messages total</p>
            <div className="flex gap-3 mt-2 text-xs">
                <span className="text-blue-600 font-semibold">↑ {sent.toLocaleString()}</span>
                <span className="text-green-600 font-semibold">↓ {received.toLocaleString()}</span>
            </div>
        </div>
    );
};

const KpiAnalysisCard: React.FC<{ icon: string; label: string; value: string; sub?: string; colorClass?: string }> = ({ icon, label, value, sub, colorClass = 'text-gray-900' }) => (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
        <span className="text-2xl mt-0.5">{icon}</span>
        <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold mt-0.5 truncate ${colorClass}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
    </div>
);

const TopRankingTable: React.FC<{
    title: string;
    icon: string;
    rows: { name: string; sub?: string; total: number; sent: number; received: number }[];
    maxTotal: number;
}> = ({ title, icon, rows, maxTotal }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
            <span className="text-lg">{icon}</span>
            <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        </div>
        <ul className="divide-y divide-gray-100">
            {rows.slice(0, 5).map((row, i) => {
                const pct = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
                const rankColors = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400', 'bg-blue-400', 'bg-indigo-400'];
                return (
                    <li key={row.name + i} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${rankColors[i]}`}>{i + 1}</span>
                                <span className="text-sm font-medium text-gray-800 truncate">{row.name}</span>
                                {row.sub && <span className="text-xs text-gray-400 hidden sm:inline truncate">· {row.sub}</span>}
                            </div>
                            <span className="text-sm font-bold text-gray-700 ml-2 flex-shrink-0">{row.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${rankColors[i]}`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            <span className="text-blue-500">↑ {row.sent.toLocaleString()} émis</span>
                            <span className="text-green-500">↓ {row.received.toLocaleString()} reçus</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    </div>
);


const StatsViewer: React.FC<StatsViewerProps> = ({ stats, users, zones, stations }) => {
  const [filterZone, setFilterZone] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [availableStations, setAvailableStations] = useState<Station[]>(stations);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState<'data' | 'analysis'>('data');

  useEffect(() => {
    if (filterZone) {
      setAvailableStations(stations.filter(s => s.zoneId === filterZone));
      if (filterStation && !stations.some(s => s.id === filterStation && s.zoneId === filterZone)) {
        setFilterStation('');
      }
    } else {
      setAvailableStations(stations);
    }
     setCurrentPage(1);
  }, [filterZone, stations, filterStation]);

  const setDateFilter = (period: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
      const today = new Date();
      setActiveFilter(period);
       setCurrentPage(1);
      switch(period) {
          case 'today': setStartDate(getStartOfDay(today)); setEndDate(getEndOfDay(today)); break;
          case 'yesterday': const yesterday = getYesterday(); setStartDate(getStartOfDay(yesterday)); setEndDate(getEndOfDay(yesterday)); break;
          case 'week': setStartDate(getStartOfWeek(today)); setEndDate(getEndOfDay(today)); break;
          case 'month': setStartDate(getStartOfMonth(today)); setEndDate(getEndOfDay(today)); break;
          case 'year': setStartDate(getStartOfYear(today)); setEndDate(getEndOfDay(today)); break;
      }
  };

  const handleCustomDateSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const start = form.elements.namedItem('startDate') as HTMLInputElement;
      const end = form.elements.namedItem('endDate') as HTMLInputElement;
      if (start.value && end.value) {
          setActiveFilter('custom');
          setCurrentPage(1);
          const startDateVal = new Date(start.value);
          const endDateVal = new Date(end.value);
          setStartDate(getStartOfDay(new Date(startDateVal.valueOf() + startDateVal.getTimezoneOffset() * 60000)));
          setEndDate(getEndOfDay(new Date(endDateVal.valueOf() + endDateVal.getTimezoneOffset() * 60000)));
      }
  };

  const resetFilters = () => {
    setActiveFilter('all');
    setStartDate(null);
    setEndDate(null);
    setFilterZone('');
    setFilterStation('');
    setCurrentPage(1);
    const form = document.getElementById('custom-date-form-stats') as HTMLFormElement;
    if (form) form.reset();
  }

  const filteredStats = useMemo(() => {
    return stats.filter(stat => {
        if (startDate && endDate) {
            const adjustedStatDate = parseLocalDateFromString(stat.date);
            if (adjustedStatDate < startDate || adjustedStatDate > endDate) return false;
        }
        if (filterZone && stat.zoneId !== filterZone) return false;
        if (filterStation && stat.stationId !== filterStation) return false;
        return true;
    });
  }, [stats, filterZone, filterStation, startDate, endDate]);

  const sortedStats = useMemo(() => {
     return [...filteredStats].sort((a, b) => b.date.localeCompare(a.date) || parseInt(b.id) - parseInt(a.id));
  }, [filteredStats]);

  const totalPages = Math.ceil(sortedStats.length / ITEMS_PER_PAGE);
  const paginatedStats = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return sortedStats.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedStats, currentPage]);

  const totals = useMemo(() => {
    return filteredStats.reduce((acc, stat) => {
        acc.sent += stat.messagesSent;
        acc.received += stat.messagesReceived;
        return acc;
    }, { sent: 0, received: 0 });
  }, [filteredStats]);

  const chartData = useMemo(() => {
    const aggregationMap = new Map<string, { sent: number; received: number }>();
    filteredStats.forEach(stat => {
        const key = filterZone ? stat.stationId : stat.zoneId;
        const existing = aggregationMap.get(key) || { sent: 0, received: 0 };
        existing.sent += stat.messagesSent;
        existing.received += stat.messagesReceived;
        aggregationMap.set(key, existing);
    });
    return Array.from(aggregationMap.entries()).map(([key, values]) => {
        let label = 'Inconnu';
        if(filterZone) {
            label = stations.find(s => s.id === key)?.name || key;
        } else {
            label = zones.find(z => z.id === key)?.name || key;
        }
        return { label, ...values };
    });
  }, [filteredStats, filterZone, zones, stations]);

  // --- Calculs d'analyse statistique ---
  const analytics = useMemo(() => {
    if (filteredStats.length === 0) return null;

    const zoneAgg = new Map<string, { sent: number; received: number; submissions: number }>();
    const stationAgg = new Map<string, { sent: number; received: number; submissions: number }>();
    const dayAgg = new Map<string, number>();

    filteredStats.forEach(s => {
      const z = zoneAgg.get(s.zoneId) ?? { sent: 0, received: 0, submissions: 0 };
      z.sent += s.messagesSent; z.received += s.messagesReceived; z.submissions++;
      zoneAgg.set(s.zoneId, z);

      const st = stationAgg.get(s.stationId) ?? { sent: 0, received: 0, submissions: 0 };
      st.sent += s.messagesSent; st.received += s.messagesReceived; st.submissions++;
      stationAgg.set(s.stationId, st);

      dayAgg.set(s.date, (dayAgg.get(s.date) ?? 0) + s.messagesSent + s.messagesReceived);
    });

    const topZones = Array.from(zoneAgg.entries())
      .map(([id, d]) => ({
        id, name: zones.find(z => z.id === id)?.name ?? id,
        total: d.sent + d.received, sent: d.sent, received: d.received, submissions: d.submissions,
      }))
      .sort((a, b) => b.total - a.total);

    const topStations = Array.from(stationAgg.entries())
      .map(([id, d]) => {
        const st = stations.find(s => s.id === id);
        return {
          id, name: st?.name ?? id,
          zoneName: zones.find(z => z.id === st?.zoneId)?.name ?? '',
          total: d.sent + d.received, sent: d.sent, received: d.received, submissions: d.submissions,
        };
      })
      .sort((a, b) => b.total - a.total);

    const sortedDays = Array.from(dayAgg.entries()).sort((a, b) => b[1] - a[1]);
    const [bestDayDate, bestDayTotal] = sortedDays[0] ?? ['—', 0];

    const totalAll = totals.sent + totals.received;
    const ratioEmisRecus = totals.received > 0
      ? ((totals.sent / totals.received) * 100).toFixed(1) + '%'
      : '∞';
    const avgPerSub = filteredStats.length > 0 ? Math.round(totalAll / filteredStats.length) : 0;

    // Zone la plus déséquilibrée (écart relatif émis vs reçus)
    const imbalancedZone = [...topZones].sort((a, b) => {
      const rA = a.total > 0 ? Math.abs(a.sent - a.received) / a.total : 0;
      const rB = b.total > 0 ? Math.abs(b.sent - b.received) / b.total : 0;
      return rB - rA;
    })[0] ?? null;

    // Nombre de jours actifs (au moins 1 soumission)
    const activeDays = dayAgg.size;

    // Zone la moins active
    const leastActiveZone = topZones.length > 1 ? topZones[topZones.length - 1] : null;

    // Station qui émet le plus
    const topEmitter = [...topStations].sort((a, b) => b.sent - a.sent)[0] ?? null;
    // Station qui reçoit le plus
    const topReceiver = [...topStations].sort((a, b) => b.received - a.received)[0] ?? null;

    // Taux de participation moyen : stations actives / stations totales
    const activeStationIds = new Set(filteredStats.map(s => s.stationId));
    const participationRate = stations.length > 0
      ? ((activeStationIds.size / stations.length) * 100).toFixed(0) + '%'
      : '—';

    return {
      topZones, topStations, bestDayDate, bestDayTotal,
      ratioEmisRecus, avgPerSub, imbalancedZone, leastActiveZone,
      topEmitter, topReceiver, activeDays, participationRate,
    };
  }, [filteredStats, zones, stations, totals]);

  const handleExportCSV = () => {
    if (filteredStats.length === 0) {
        alert("Aucune donnée à exporter pour les filtres actuels.");
        return;
    }

    const headers = ["Date", "Zone", "Station", "Messages Emis", "Messages Recus"];
    const zoneMap = new Map(zones.map(z => [z.id, z.name]));
    const stationMap = new Map(stations.map(s => [s.id, s.name]));

    const csvRows = [
        headers.join(';'),
        ...sortedStats.map(stat => {
            const row = [
                parseLocalDateFromString(stat.date).toLocaleDateString('fr-FR'),
                `"${zoneMap.get(stat.zoneId) || 'N/A'}"`,
                `"${stationMap.get(stat.stationId) || 'Inconnue'}"`,
                stat.messagesSent,
                stat.messagesReceived
            ];
            return row.join(';');
        })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`﻿${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `export_stats_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const FilterButton: React.FC<{period: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year', label: string}> = ({period, label}) => {
      const action = period === 'all' ? resetFilters : () => setDateFilter(period as 'today' | 'yesterday' | 'week' | 'month' | 'year');
      return (
         <button onClick={action} className={`flex-1 text-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 ${activeFilter === period ? 'bg-navy-600 text-white shadow-sm' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
              {label}
          </button>
      )
  };

  return (
    <div>
        {/* En-tête */}
        <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">Analyse des Statistiques</h2>
            <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 border border-transparent rounded-md shadow-sm bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={filteredStats.length === 0}
            >
                <DownloadIcon />
                Exporter en CSV
            </button>
        </div>

        {/* Filtres */}
        <div className="p-4 my-6 bg-white rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Filtrer par Zone</label>
                    <select onChange={e => setFilterZone(e.target.value)} value={filterZone} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm">
                        <option value="">Toutes les Zones</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Filtrer par Station</label>
                    <select onChange={e => setFilterStation(e.target.value)} value={filterStation} disabled={!filterZone} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-gray-100">
                        <option value="">Toutes les Stations</option>
                        {availableStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
             <div className="pt-4 border-t">
                <div className="flex items-center gap-3 w-full">
                    <div className="flex flex-1 items-center gap-1">
                        <FilterButton period="today" label="Aujourd'hui" />
                        <FilterButton period="yesterday" label="Hier" />
                        <FilterButton period="week" label="Cette semaine" />
                        <FilterButton period="month" label="Ce mois" />
                        <FilterButton period="year" label="Cette année" />
                        {(activeFilter !== 'all' || filterZone || filterStation) && <FilterButton period="all" label="Réinitialiser" />}
                    </div>
                    <div className="w-px self-stretch bg-gray-200"></div>
                    <form id="custom-date-form-stats" onSubmit={handleCustomDateSearch} className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Du</span>
                        <input type="date" name="startDate" className="px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required/>
                        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">au</span>
                        <input type="date" name="endDate" className="px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required/>
                        <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 rounded-md bg-navy-600 hover:bg-navy-700 whitespace-nowrap">Rechercher</button>
                    </form>
                </div>
           </div>
        </div>

        {/* KPI totaux */}
        <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-3">
            <div className="p-5 overflow-hidden bg-white rounded-lg shadow"><p className="text-sm font-medium text-gray-500 truncate">Total des Soumissions</p><p className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">{filteredStats.length.toLocaleString()}</p></div>
            <div className="p-5 overflow-hidden bg-white rounded-lg shadow"><p className="text-sm font-medium text-gray-500 truncate">Total des Messages Émis</p><p className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">{totals.sent.toLocaleString()}</p></div>
            <div className="p-5 overflow-hidden bg-white rounded-lg shadow"><p className="text-sm font-medium text-gray-500 truncate">Total des Messages Reçus</p><p className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">{totals.received.toLocaleString()}</p></div>
        </div>

        {/* Onglets Vue Données / Analyse */}
        <div className="flex gap-1 mb-6 p-1 bg-gray-200 rounded-lg w-fit">
            <button
                onClick={() => setActiveView('data')}
                className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${activeView === 'data' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
                📋 Données
            </button>
            <button
                onClick={() => setActiveView('analysis')}
                className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${activeView === 'analysis' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
                📊 Analyse statistique
            </button>
        </div>

        {/* ===================== VUE DONNÉES ===================== */}
        {activeView === 'data' && (
            <>
                <div className="mb-6">
                    <BarChart data={chartData} />
                </div>
                <div className="overflow-hidden bg-white rounded-lg shadow">
                    <h3 className="p-4 text-lg font-semibold text-gray-700 border-b">Détail des Soumissions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Zone</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Station</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Émis</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Reçus</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedStats.length > 0 ? (
                                    paginatedStats.map(stat => {
                                        const station = stations.find(s => s.id === stat.stationId);
                                        const zone = zones.find(z => z.id === stat.zoneId);
                                        return (
                                            <tr key={stat.id}>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{parseLocalDateFromString(stat.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{zone?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{station?.name || 'Inconnue'}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-blue-600 whitespace-nowrap">{stat.messagesSent}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">{stat.messagesReceived}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                     <tr>
                                        <td colSpan={5} className="py-8 text-sm text-center text-gray-500">
                                            Aucune soumission pour les filtres actuels.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </>
        )}

        {/* ===================== VUE ANALYSE ===================== */}
        {activeView === 'analysis' && (
            <>
                {!analytics ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <span className="text-5xl">📭</span>
                        <p className="mt-4 text-lg font-medium">Aucune donnée disponible pour cette sélection.</p>
                        <p className="text-sm">Modifiez les filtres pour afficher une analyse.</p>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* --- Podium des Zones --- */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-600 uppercase tracking-widest mb-3">🏆 Podium — Zones les plus actives</h3>
                            {analytics.topZones.length === 0 ? (
                                <p className="text-sm text-gray-400">Aucune zone avec des données.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {analytics.topZones.slice(0, 3).map((zone, i) => (
                                        <PodiumCard key={zone.id} rank={i + 1} name={zone.name} total={zone.total} sent={zone.sent} received={zone.received} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* --- Podium des Stations --- */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-600 uppercase tracking-widest mb-3">📡 Podium — Stations les plus actives</h3>
                            {analytics.topStations.length === 0 ? (
                                <p className="text-sm text-gray-400">Aucune station avec des données.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {analytics.topStations.slice(0, 3).map((st, i) => (
                                        <PodiumCard key={st.id} rank={i + 1} name={st.name} subtitle={st.zoneName} total={st.total} sent={st.sent} received={st.received} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* --- Métriques clés --- */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-600 uppercase tracking-widest mb-3">📈 Indicateurs clés</h3>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                <KpiAnalysisCard
                                    icon="⚖️"
                                    label="Ratio Émis / Reçus"
                                    value={analytics.ratioEmisRecus}
                                    sub="Pour 100 msgs reçus, X émis"
                                />
                                <KpiAnalysisCard
                                    icon="📬"
                                    label="Moy. messages / soumission"
                                    value={analytics.avgPerSub.toLocaleString()}
                                    sub="Messages (émis + reçus)"
                                />
                                <KpiAnalysisCard
                                    icon="📅"
                                    label="Jour le plus chargé"
                                    value={analytics.bestDayDate !== '—' ? parseLocalDateFromString(analytics.bestDayDate).toLocaleDateString('fr-FR') : '—'}
                                    sub={`${analytics.bestDayTotal.toLocaleString()} messages`}
                                    colorClass="text-indigo-700"
                                />
                                <KpiAnalysisCard
                                    icon="📆"
                                    label="Jours actifs"
                                    value={analytics.activeDays.toString()}
                                    sub="Jours avec au moins 1 soumission"
                                />
                                <KpiAnalysisCard
                                    icon="👥"
                                    label="Taux de participation"
                                    value={analytics.participationRate}
                                    sub={`Stations ayant soumis / ${stations.length} total`}
                                    colorClass="text-emerald-700"
                                />
                                {analytics.topEmitter && (
                                    <KpiAnalysisCard
                                        icon="📤"
                                        label="Station + émettrice"
                                        value={analytics.topEmitter.name}
                                        sub={`${analytics.topEmitter.sent.toLocaleString()} msgs émis`}
                                        colorClass="text-blue-700"
                                    />
                                )}
                                {analytics.topReceiver && (
                                    <KpiAnalysisCard
                                        icon="📥"
                                        label="Station + réceptrice"
                                        value={analytics.topReceiver.name}
                                        sub={`${analytics.topReceiver.received.toLocaleString()} msgs reçus`}
                                        colorClass="text-green-700"
                                    />
                                )}
                                {analytics.imbalancedZone && analytics.imbalancedZone.total > 0 && (
                                    <KpiAnalysisCard
                                        icon="⚠️"
                                        label="Zone la + déséquilibrée"
                                        value={analytics.imbalancedZone.name}
                                        sub={`↑${analytics.imbalancedZone.sent.toLocaleString()} vs ↓${analytics.imbalancedZone.received.toLocaleString()}`}
                                        colorClass="text-orange-600"
                                    />
                                )}
                            </div>
                        </section>

                        {/* --- Classements Top 5 --- */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-600 uppercase tracking-widest mb-3">🎖️ Classements</h3>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <TopRankingTable
                                    title="Top 5 Zones par trafic total"
                                    icon="🌐"
                                    rows={analytics.topZones.map(z => ({ name: z.name, total: z.total, sent: z.sent, received: z.received }))}
                                    maxTotal={analytics.topZones[0]?.total ?? 1}
                                />
                                <TopRankingTable
                                    title="Top 5 Stations par trafic total"
                                    icon="📡"
                                    rows={analytics.topStations.map(s => ({ name: s.name, sub: s.zoneName, total: s.total, sent: s.sent, received: s.received }))}
                                    maxTotal={analytics.topStations[0]?.total ?? 1}
                                />
                                <TopRankingTable
                                    title="Top 5 Stations — Messages Émis"
                                    icon="📤"
                                    rows={[...analytics.topStations].sort((a, b) => b.sent - a.sent).map(s => ({ name: s.name, sub: s.zoneName, total: s.sent, sent: s.sent, received: s.received }))}
                                    maxTotal={[...analytics.topStations].sort((a, b) => b.sent - a.sent)[0]?.sent ?? 1}
                                />
                                <TopRankingTable
                                    title="Top 5 Stations — Messages Reçus"
                                    icon="📥"
                                    rows={[...analytics.topStations].sort((a, b) => b.received - a.received).map(s => ({ name: s.name, sub: s.zoneName, total: s.received, sent: s.sent, received: s.received }))}
                                    maxTotal={[...analytics.topStations].sort((a, b) => b.received - a.received)[0]?.received ?? 1}
                                />
                            </div>
                        </section>

                        {/* --- Zone à surveiller --- */}
                        {analytics.leastActiveZone && (
                            <section>
                                <h3 className="text-base font-semibold text-gray-600 uppercase tracking-widest mb-3">🔍 Zone à surveiller</h3>
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
                                    <span className="text-3xl mt-1">📉</span>
                                    <div>
                                        <p className="font-bold text-red-800 text-lg">{analytics.leastActiveZone.name}</p>
                                        <p className="text-sm text-red-600 mt-1">Zone la moins active sur la période sélectionnée</p>
                                        <div className="flex gap-4 mt-2 text-sm">
                                            <span className="text-blue-700 font-semibold">↑ {analytics.leastActiveZone.sent.toLocaleString()} émis</span>
                                            <span className="text-green-700 font-semibold">↓ {analytics.leastActiveZone.received.toLocaleString()} reçus</span>
                                            <span className="text-gray-600">{analytics.leastActiveZone.submissions} soumission(s)</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default StatsViewer;
