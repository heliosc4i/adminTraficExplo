import React, { useState, useMemo, useEffect } from 'react';
import { MessageStats, User, Zone, Station } from '../types';
import { UsersIcon, GlobeAltIcon, RadioIcon, ArrowUpIcon, ArrowDownIcon, DocumentTextIcon, ClipboardListIcon } from './Icons';
import * as api from '../api';

interface DashboardProps {
  stats: MessageStats[];
  users: User[];
  zones: Zone[];
  stations: Station[];
  onRefreshStats: () => Promise<void>;
}

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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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

/**
 * Analyse de manière fiable une chaîne 'YYYY-MM-DD' en un objet Date à minuit dans le fuseau horaire *local*.
 * Cela évite que `new Date('2023-01-01')` soit interprété comme UTC et décale la date.
 */
const parseLocalDateFromString = (dateString: string): Date => {
    const parts = dateString.split('-');
    // Note : les mois sont indexés à partir de 0 dans les dates JS
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};


const Dashboard: React.FC<DashboardProps> = ({ stats, users, zones, stations, onRefreshStats }) => {
  const [displayStats, setDisplayStats] = useState<MessageStats[]>(stats);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('all');

  // Sync displayStats with incoming props, but only for the 'all' filter view
  useEffect(() => {
    if (activeFilter === 'all') {
      setDisplayStats(stats);
    }
  }, [stats, activeFilter]);


  // Real-time polling effect
  useEffect(() => {
    const intervalId = setInterval(() => {
        // Only refresh global stats if user is on the "all" view
        if(activeFilter === 'all') {
            onRefreshStats();
        }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [onRefreshStats, activeFilter]);

  const fetchFilteredStats = async (start?: Date, end?: Date) => {
      setIsLoading(true);
      try {
          const filtered = await api.getStats(start, end);
          setDisplayStats(filtered);
      } catch (error) {
          console.error("Failed to fetch filtered stats:", error);
          // Optionally, show an alert to the user
      } finally {
          setIsLoading(false);
      }
  };

  const setDateFilter = (period: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
      const today = new Date();
      setActiveFilter(period);
      let start: Date, end: Date;
      
      switch(period) {
          case 'today':
              start = getStartOfDay(today);
              end = getEndOfDay(today);
              break;
          case 'yesterday':
              const yesterday = getYesterday();
              start = getStartOfDay(yesterday);
              end = getEndOfDay(yesterday);
              break;
          case 'week':
              start = getStartOfWeek(today);
              end = getEndOfDay(today);
              break;
          case 'month':
              start = getStartOfMonth(today);
              end = getEndOfDay(today);
              break;
          case 'year':
              start = getStartOfYear(today);
              end = getEndOfDay(today);
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
          // Dates from input are UTC, convert them to local timezone for correct range
          const start = new Date(startInput.value);
          const end = new Date(endInput.value);
          fetchFilteredStats(getStartOfDay(start), getEndOfDay(end));
      }
  };
  
  const resetFilters = () => {
    setActiveFilter('all');
    setDisplayStats(stats); // Reset to the full stats from props
    const form = document.getElementById('custom-date-form') as HTMLFormElement;
    if (form) form.reset();
  }

  const staticKpiData = useMemo(() => {
      const comzonesCount = users.filter(u => u.role === 'COMZONE').length;
      return {
          zones: zones.length,
          stations: stations.length,
          comzones: comzonesCount,
      };
  }, [users, zones, stations]);

  const submissionCardLabel = useMemo(() => {
    switch (activeFilter) {
        case 'all': return "Aujourd'hui";
        case 'today': return "Aujourd'hui";
        case 'yesterday': return "Hier";
        case 'week': return 'Cette Semaine';
        case 'month': return 'Ce Mois';
        case 'year': return "Cette Année";
        case 'custom': return 'Personnalisée';
        default: return '';
    }
  }, [activeFilter]);

  const submissionKpiData = useMemo(() => {
    // When the view is global, we specifically show today's submission rate.
    // For all other filtered views, we show the rate for the selected period.
    const sourceStatsForSubmission = activeFilter === 'all'
        ? stats.filter(s => s.date === formatDateForFiltering(new Date()))
        : displayStats;

    const uniqueStationsSubmitted = new Set(sourceStatsForSubmission.map(s => s.stationId));
    
    return {
        submittedCount: uniqueStationsSubmitted.size,
        submissionRate: stations.length > 0 ? (uniqueStationsSubmitted.size / stations.length) * 100 : 0,
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
        // Utiliser une comparaison de chaînes de caractères directe est plus simple et plus fiable
        // pour le format 'AAAA-MM-JJ' que de convertir en objets Date, ce qui évite les bugs de fuseau horaire.
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) {
          return dateComparison;
        }
        
        // Un tri secondaire par ID garantit que la soumission la plus récente d'un même jour est affichée en premier.
        return parseInt(b.id, 10) - parseInt(a.id, 10);
      })
      .slice(0, 5);
  }, [stats, displayStats, activeFilter]);


  const FilterButton: React.FC<{period: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year', label: string}> = ({period, label}) => {
      const action = period === 'all' ? resetFilters : () => setDateFilter(period as 'today' | 'yesterday' | 'week' | 'month' | 'year');
      return (
         <button onClick={action} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 ${activeFilter === period ? 'bg-navy-600 text-white shadow-md scale-105' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
              {label}
          </button>
      )
  };

  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'all': return 'Globales';
      case 'today': return "d'Aujourd'hui";
      case 'yesterday': return "d'Hier";
      case 'week': return 'de la Semaine';
      case 'month': return 'du Mois';
      case 'year': return "de l'Année";
      case 'custom': return 'Personnalisées';
      default: return '';
    }
  }, [activeFilter]);


  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center p-5 space-x-4 bg-white rounded-lg shadow"><div className="p-3 bg-blue-100 rounded-full text-navy-600"><GlobeAltIcon/></div><div><p className="text-3xl font-semibold text-gray-900">{staticKpiData.zones}</p><p className="text-sm font-medium text-gray-500 truncate">Zones</p></div></div>
        <div className="flex items-center p-5 space-x-4 bg-white rounded-lg shadow"><div className="p-3 bg-green-100 rounded-full text-navy-600"><RadioIcon/></div><div><p className="text-3xl font-semibold text-gray-900">{staticKpiData.stations}</p><p className="text-sm font-medium text-gray-500 truncate">Stations</p></div></div>
        <div className="flex items-center p-5 space-x-4 bg-white rounded-lg shadow"><div className="p-3 bg-indigo-100 rounded-full text-navy-600"><UsersIcon/></div><div><p className="text-3xl font-semibold text-gray-900">{staticKpiData.comzones}</p><p className="text-sm font-medium text-gray-500 truncate">Utilisateurs (Comzone)</p></div></div>
        <div className="p-5 bg-white rounded-lg shadow">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-500 truncate">Taux de soumission ({submissionCardLabel})</p>
            <div className="p-2 bg-yellow-100 rounded-full text-navy-600"><ClipboardListIcon/></div>
          </div>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{submissionKpiData.submittedCount} / {staticKpiData.stations}</p>
          <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5">
            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${submissionKpiData.submissionRate}%` }}></div>
          </div>
        </div>
      </div>


      {/* Filters */}
       <div className="p-4 mt-8 bg-white rounded-lg shadow">
           <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-2 font-medium text-gray-500">
                    Afficher :
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterButton period="today" label="Aujourd'hui" />
                    <FilterButton period="yesterday" label="Hier" />
                    <FilterButton period="week" label="Cette Semaine" />
                    <FilterButton period="month" label="Ce Mois-ci" />
                    <FilterButton period="year" label="Cette Année" />
                </div>
                <form id="custom-date-form" onSubmit={handleCustomDateSearch} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                    <input type="date" name="startDate" className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required/>
                    <span className="hidden text-gray-500 sm:block">à</span>
                    <input type="date" name="endDate" className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required/>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 rounded-md bg-navy-600 hover:bg-navy-700">Rechercher</button>
                </form>
                 {activeFilter !== 'all' && <FilterButton period="all" label="Réinitialiser" />}
           </div>
       </div>

      {/* Filtered Stats Cards */}
        <div className="mt-6">
             <h3 className="mb-4 text-xl font-semibold text-gray-700">
                Statistiques {filterLabel}
            </h3>
             {isLoading ? (
                <div className="flex items-center justify-center p-10 text-gray-500">
                    <svg className="w-8 h-8 mr-3 animate-spin text-navy-600" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement des données...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center p-5 space-x-4 text-white bg-blue-500 rounded-lg shadow-lg"><div className="p-3 bg-blue-600 rounded-full"><ArrowUpIcon/></div><div><p className="text-3xl font-semibold">{filteredTotals.sent.toLocaleString()}</p><p className="text-sm font-medium truncate">Messages Émis</p></div></div>
                    <div className="flex items-center p-5 space-x-4 text-white bg-green-500 rounded-lg shadow-lg"><div className="p-3 bg-green-600 rounded-full"><ArrowDownIcon/></div><div><p className="text-3xl font-semibold">{filteredTotals.received.toLocaleString()}</p><p className="text-sm font-medium truncate">Messages Reçus</p></div></div>
                    <div className="flex items-center p-5 space-x-4 text-white bg-indigo-500 rounded-lg shadow-lg"><div className="p-3 bg-indigo-600 rounded-full"><DocumentTextIcon/></div><div><p className="text-3xl font-semibold">{(filteredTotals.sent + filteredTotals.received).toLocaleString()}</p><p className="text-sm font-medium truncate">Total Messages</p></div></div>
                </div>
            )}
        </div>

      {/* Recent Submissions */}
      <div className="mt-8 overflow-hidden bg-white rounded-lg shadow">
        <h3 className="p-4 font-semibold text-gray-800 border-b">
            Dernières Soumissions
        </h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Zone</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Station</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Émis / Reçus</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {latestSubmissions.length > 0 ? (
                        latestSubmissions.map(stat => (
                            <tr key={stat.id}>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{parseLocalDateFromString(stat.date).toLocaleDateString('fr-FR')}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{zones.find(z => z.id === stat.zoneId)?.name || 'Inconnue'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{stations.find(s=>s.id === stat.stationId)?.name || 'Inconnue'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    <span className="font-semibold text-blue-600">{stat.messagesSent}</span> / <span className="font-semibold text-green-600">{stat.messagesReceived}</span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="py-8 text-sm text-center text-gray-500">
                                Aucune soumission trouvée.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;