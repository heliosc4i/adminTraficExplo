import React, { useState, useEffect, useMemo } from 'react';
import { Station, Zone } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, SearchIcon, TrashIcon } from './Icons';
import Pagination from './Pagination';

interface StationManagementProps {
  stations: Station[];
  deletedStations: Station[];
  zones: Zone[];
  onAddStation: (station: Station) => void;
  onUpdateStation: (station: Station) => void;
  onDeleteStation: (stationId: string) => void;
  onRestoreStation: (stationId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const RestoreIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const StationManagement: React.FC<StationManagementProps> = ({ stations, deletedStations, zones, onAddStation, onUpdateStation, onDeleteStation, onRestoreStation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState<Partial<Station>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTrash, setShowTrash] = useState(false);

  const filteredStations = useMemo(() => {
    return stations.filter(station =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stations, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredStations.length / ITEMS_PER_PAGE);
  const paginatedStations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStations, currentPage]);

  useEffect(() => {
    setFormData(currentStation || { zoneId: zones[0]?.id });
  }, [currentStation, zones]);

  const openModal = (station: Station | null = null) => {
    setCurrentStation(station);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStation(null);
    setFormData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.zoneId) return;
    if (currentStation) {
      onUpdateStation(formData as Station);
    } else {
      onAddStation(formData as Station);
    }
    closeModal();
  };

  const handleTrash = (stationId: string) => {
    if (window.confirm('Mettre cette station à la corbeille ? Elle sera masquée des statistiques mais ses données historiques seront conservées.')) {
      onDeleteStation(stationId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">Gestion des Stations</h2>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500">
          <PlusIcon />
          Ajouter une Station
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Rechercher par nom ou ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="block w-full py-2 pl-10 pr-4 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out"
        />
      </div>

      {/* Active stations table */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Zone</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStations.length > 0 ? paginatedStations.map(station => (
                <tr key={station.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{station.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{station.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{zones.find(z => z.id === station.zoneId)?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button onClick={() => openModal(station)} className="p-2 text-indigo-600 rounded-full hover:bg-indigo-100" title="Modifier"><PencilIcon /></button>
                    <button onClick={() => handleTrash(station.id)} className="p-2 text-red-400 rounded-full hover:bg-red-50" title="Mettre à la corbeille"><TrashIcon /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-sm text-center text-gray-400">
                    {searchTerm ? 'Aucune station trouvée.' : 'Aucune station active.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Trash section */}
      {deletedStations.length > 0 && (
        <div>
          <button
            onClick={() => setShowTrash(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <TrashIcon />
            Corbeille
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-400 rounded-full">
              {deletedStations.length}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showTrash ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTrash && (
            <div className="mt-3 overflow-hidden bg-white border border-red-100 rounded-lg shadow-sm">
              <div className="px-5 py-3 border-b border-red-100 bg-red-50">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Stations supprimées — données historiques conservées</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">ID</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">Nom</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">Zone d'origine</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-400 uppercase">Restaurer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deletedStations.map(station => (
                      <tr key={station.id} className="bg-red-50/30">
                        <td className="px-6 py-3 text-sm font-medium text-gray-500 whitespace-nowrap line-through">{station.id}</td>
                        <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap line-through">{station.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">{zones.find(z => z.id === station.zoneId)?.name || 'Zone supprimée'}</td>
                        <td className="px-6 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => onRestoreStation(station.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                          >
                            <RestoreIcon />
                            Restaurer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentStation ? 'Modifier Station' : 'Ajouter Station'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Station</label>
            <input type="text" value={formData.id || ''} onChange={e => setFormData({ ...formData, id: e.target.value })} required disabled={!!currentStation} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom Station</label>
            <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zone</label>
            <select value={formData.zoneId || ''} onChange={e => setFormData({ ...formData, zoneId: e.target.value })} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out">
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 text-right">
            <button type="button" onClick={closeModal} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-navy-600 border border-transparent rounded-md shadow-sm hover:bg-navy-700">Sauvegarder</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StationManagement;
