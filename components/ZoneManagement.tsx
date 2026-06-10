import React, { useState, useEffect, useMemo } from 'react';
import { Zone } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from './Icons';
import Pagination from './Pagination';

interface ZoneManagementProps {
  zones: Zone[];
  onAddZone: (zone: Zone) => void;
  onUpdateZone: (zone: Zone) => void;
  onDeleteZone: (zoneId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const TrashToggleIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {active ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    )}
  </svg>
);

const ZoneManagement: React.FC<ZoneManagementProps> = ({ zones, onAddZone, onUpdateZone, onDeleteZone }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState<Partial<Zone>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredZones = useMemo(() => {
    return zones.filter(zone =>
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [zones, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredZones.length / ITEMS_PER_PAGE);
  const paginatedZones = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredZones.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredZones, currentPage]);

  useEffect(() => {
    setFormData(currentZone || {});
  }, [currentZone]);

  const openModal = (zone: Zone | null = null) => {
    setCurrentZone(zone);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentZone(null);
    setFormData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return;
    if (currentZone) {
      onUpdateZone(formData as Zone);
    } else {
      onAddZone(formData as Zone);
    }
    closeModal();
  };

  const handleDelete = (zoneId: string) => {
    if (window.confirm("Supprimer cette zone désaffectera ses stations et commandants. Continuer ?")) {
      onDeleteZone(zoneId);
    }
  };

  const handleToggleTrash = (zone: Zone) => {
    const msg = zone.isTrash
      ? `Retirer "${zone.name}" de la corbeille ? Ses stations réapparaîtront dans les statistiques.`
      : `Marquer "${zone.name}" comme zone corbeille ? Ses stations seront exclues de tous les comptages.`;
    if (window.confirm(msg)) {
      onUpdateZone({ ...zone, isTrash: !zone.isTrash });
    }
  };

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">Gestion des Zones</h2>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500">
          <PlusIcon />
          Ajouter une Zone
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
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedZones.map(zone => (
                <tr key={zone.id} className={zone.isTrash ? 'bg-amber-50/40' : ''}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{zone.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {zone.name}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {zone.isTrash ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                        <TrashIcon />
                        Corbeille
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button
                      onClick={() => handleToggleTrash(zone)}
                      className={`p-2 rounded-full transition-colors ${zone.isTrash ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                      title={zone.isTrash ? 'Retirer de la corbeille' : 'Marquer comme corbeille'}
                    >
                      <TrashToggleIcon active={!!zone.isTrash} />
                    </button>
                    <button onClick={() => openModal(zone)} className="p-2 text-indigo-600 rounded-full hover:bg-indigo-100" title="Modifier"><PencilIcon /></button>
                    <button onClick={() => handleDelete(zone.id)} className="p-2 ml-1 text-red-600 rounded-full hover:bg-red-100" title="Supprimer"><TrashIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentZone ? 'Modifier Zone' : 'Ajouter Zone'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Zone</label>
            <input type="text" value={formData.id || ''} onChange={e => setFormData({ ...formData, id: e.target.value })} required disabled={!!currentZone} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom Zone</label>
            <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
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

export default ZoneManagement;
