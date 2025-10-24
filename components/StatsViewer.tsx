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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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


const StatsViewer: React.FC<StatsViewerProps> = ({ stats, users, zones, stations }) => {
  const [filterZone, setFilterZone] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [availableStations, setAvailableStations] = useState<Station[]>(stations);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
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
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
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
         <button onClick={action} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 ${activeFilter === period ? 'bg-navy-600 text-white shadow-md scale-105' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
              {label}
          </button>
      )
  };

  return (
    <div>
        <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-bold text-gray-800">Analyse des Statistiques</h2>
            <button 
                onClick={handleExportCSV} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 border border-transparent rounded-md shadow-sm bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={filteredStats.length === 0}
                title={filteredStats.length === 0 ? "Aucune donnée à exporter" : "Exporter les données filtrées en CSV"}
            >
                <DownloadIcon />
                Exporter en CSV
            </button>
        </div>
        
        <div className="p-4 my-6 bg-white rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Filtrer par Zone</label>
                    <select onChange={e => setFilterZone(e.target.value)} value={filterZone} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out">
                        <option value="">Toutes les Zones</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Filtrer par Station</label>
                    <select onChange={e => setFilterStation(e.target.value)} value={filterStation} disabled={!filterZone} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100">
                        <option value="">Toutes les Stations</option>
                        {availableStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
             <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                <div className="flex flex-wrap items-center gap-2 font-medium text-gray-500">
                    Période :
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterButton period="today" label="Aujourd'hui" />
                    <FilterButton period="yesterday" label="Hier" />
                    <FilterButton period="week" label="Cette Semaine" />
                    <FilterButton period="month" label="Ce Mois-ci" />
                    <FilterButton period="year" label="Cette Année" />
                </div>
                <form id="custom-date-form-stats" onSubmit={handleCustomDateSearch} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                    <input type="date" name="startDate" className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required/>
                    <span className="hidden text-gray-500 sm:block">à</span>
                    <input type="date" name="endDate" className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500" required/>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 rounded-md bg-navy-600 hover:bg-navy-700">Rechercher</button>
                </form>
                 {(activeFilter !== 'all' || filterZone || filterStation) && <FilterButton period="all" label="Réinitialiser" />}
           </div>
        </div>

        <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-3">
            <div className="p-5 overflow-hidden bg-white rounded-lg shadow"><p className="text-sm font-medium text-gray-500 truncate">Total des Soumissions</p><p className="mt-1 text-3xl font-semibold text-gray-900">{filteredStats.length.toLocaleString()}</p></div>
            <div className="p-5 overflow-hidden bg-white rounded-lg shadow"><p className="text-sm font-medium text-gray-500 truncate">Total des Messages Émis</p><p className="mt-1 text-3xl font-semibold text-gray-900">{totals.sent.toLocaleString()}</p></div>
            <div className="p-5 overflow-hidden bg-white rounded-lg shadow"><p className="text-sm font-medium text-gray-500 truncate">Total des Messages Reçus</p><p className="mt-1 text-3xl font-semibold text-gray-900">{totals.received.toLocaleString()}</p></div>
        </div>

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
    </div>
  );
};

export default StatsViewer;