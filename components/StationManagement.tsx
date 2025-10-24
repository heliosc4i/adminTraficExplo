import React, { useState, useEffect, useMemo } from 'react';
import { Station, Zone } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from './Icons';
import Pagination from './Pagination';

interface StationManagementProps {
  stations: Station[];
  zones: Zone[];
  onAddStation: (station: Station) => void;
  onUpdateStation: (station: Station) => void;
  onDeleteStation: (stationId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const StationManagement: React.FC<StationManagementProps> = ({ stations, zones, onAddStation, onUpdateStation, onDeleteStation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState<Partial<Station>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredStations = useMemo(() => {
    return stations.filter(station => 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stations, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Gestion des Stations</h2>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500">
          <PlusIcon />
          Ajouter une Station
        </button>
      </div>

      <div className="mb-4">
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
      </div>

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
                {paginatedStations.map(station => (
                <tr key={station.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{station.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{station.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{zones.find(z => z.id === station.zoneId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button onClick={() => openModal(station)} className="p-2 text-indigo-600 rounded-full hover:bg-indigo-100"><PencilIcon/></button>
                    <button onClick={() => onDeleteStation(station.id)} className="p-2 ml-2 text-red-600 rounded-full hover:bg-red-100"><TrashIcon/></button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentStation ? 'Modifier Station' : 'Ajouter Station'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">ID Station</label>
                <input type="text" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} required disabled={!!currentStation} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nom Station</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Zone</label>
                <select value={formData.zoneId || ''} onChange={e => setFormData({...formData, zoneId: e.target.value})} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out">
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
