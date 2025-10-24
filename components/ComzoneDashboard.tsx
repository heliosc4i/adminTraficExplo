import React, { useState, useMemo } from 'react';
import { User, Station, Zone, MessageStats } from '../types';
import Header from './Header';
import Footer from './Footer';
import { PlusIcon, ClipboardListIcon } from './Icons';

interface ComzoneDashboardProps {
  currentUser: User;
  onLogout: () => void;
  stations: Station[];
  zone?: Zone;
  stats: MessageStats[];
  onAddStat: (stat: Omit<MessageStats, 'id'>) => Promise<void>;
}

const ComzoneDashboard: React.FC<ComzoneDashboardProps> = ({ currentUser, onLogout, stations, zone, stats, onAddStat }) => {
  const [stationId, setStationId] = useState<string>(stations[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [messagesSent, setMessagesSent] = useState('');
  const [messagesReceived, setMessagesReceived] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!stationId || !date || messagesSent === '' || messagesReceived === '') {
        setError('Veuillez remplir tous les champs.');
        return;
    }
    
    const sent = parseInt(messagesSent, 10);
    const received = parseInt(messagesReceived, 10);

    if (isNaN(sent) || isNaN(received) || sent < 0 || received < 0) {
        setError('Les nombres de messages doivent être des entiers positifs.');
        return;
    }
    
    // Check for duplicate submission
    const alreadySubmitted = stats.some(s => s.stationId === stationId && s.date === date);
    if (alreadySubmitted) {
        if (!window.confirm("Des statistiques ont déjà été soumises pour cette station à cette date. Voulez-vous vraiment soumettre à nouveau ?")) {
            return;
        }
    }

    setIsSubmitting(true);
    try {
        await onAddStat({
            stationId,
            date,
            messagesSent: sent,
            messagesReceived: received,
            zoneId: zone!.id,
        });
        // Reset form on success
        setMessagesSent('');
        setMessagesReceived('');
    } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de la soumission.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const recentStats = useMemo(() => {
    return [...stats]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
  }, [stats]);
  
  const getStationName = (id: string) => stations.find(s => s.id === id)?.name || 'Inconnue';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header currentUser={currentUser} onLogout={onLogout} />
      <main className="flex-1">
        <div className="container px-4 py-8 mx-auto sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
                Tableau de Bord - Zone {zone?.name || 'Non Assignée'}
            </h1>
            <p className="mt-1 text-gray-600">
                Soumettez et consultez les statistiques de trafic pour votre zone.
            </p>

            <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3">
                {/* Submission Form */}
                <div className="lg:col-span-1">
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-800">Soumettre les Statistiques</h2>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="station" className="block text-sm font-medium text-gray-700">Station</label>
                                <select id="station" value={stationId} onChange={e => setStationId(e.target.value)} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm">
                                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="sent" className="block text-sm font-medium text-gray-700">Messages Émis</label>
                                <input type="number" id="sent" value={messagesSent} onChange={e => setMessagesSent(e.target.value)} min="0" required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="received" className="block text-sm font-medium text-gray-700">Messages Reçus</label>
                                <input type="number" id="received" value={messagesReceived} onChange={e => setMessagesReceived(e.target.value)} min="0" required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm" />
                            </div>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <button type="submit" disabled={isSubmitting || stations.length === 0} className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                <PlusIcon />
                                {isSubmitting ? 'Soumission...' : 'Soumettre'}
                            </button>
                            {stations.length === 0 && <p className="mt-2 text-sm text-center text-yellow-700">Aucune station n'est assignée à cette zone.</p>}
                        </form>
                    </div>
                </div>

                {/* Recent Submissions */}
                <div className="lg:col-span-2">
                    <div className="overflow-hidden bg-white rounded-lg shadow">
                         <div className="flex items-center p-4 border-b">
                            <ClipboardListIcon />
                            <h2 className="ml-3 text-xl font-semibold text-gray-800">Dernières Soumissions de la Zone</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Station</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Émis</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Reçus</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentStats.length > 0 ? recentStats.map(stat => (
                                        <tr key={stat.id}>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(stat.date + 'T00:00:00').toLocaleDateString('fr-FR')}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{getStationName(stat.stationId)}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-blue-600 whitespace-nowrap">{stat.messagesSent}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">{stat.messagesReceived}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-sm text-center text-gray-500">
                                                Aucune soumission récente pour cette zone.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComzoneDashboard;
