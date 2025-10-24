import React, { useState, useEffect, useMemo } from 'react';
import { User, Zone, UserRole } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon, SearchIcon, EyeIcon, EyeOffIcon } from './Icons';
import Pagination from './Pagination';

interface UserManagementProps {
  users: User[];
  zones: Zone[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const UserManagement: React.FC<UserManagementProps> = ({ users, zones, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // State for Reset Password Modal
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);


  const grades = useMemo(() => [...new Set(users.map(u => u.grade).filter(Boolean))], [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
        const term = searchTerm.toLowerCase();
        const matchesTerm = user.name.toLowerCase().includes(term) ||
                              user.id.toLowerCase().includes(term) ||
                              user.username.toLowerCase().includes(term) ||
                              user.email.toLowerCase().includes(term);
        const matchesGrade = gradeFilter ? user.grade === gradeFilter : true;
        return matchesTerm && matchesGrade;
    });
  }, [users, searchTerm, gradeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter]);
  
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  
  useEffect(() => {
    if (currentUser) {
      setFormData(currentUser);
    } else {
      setFormData({ role: UserRole.COMZONE });
    }
  }, [currentUser]);
  
  const openModal = (user: User | null = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setFormData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(currentUser) {
        onUpdateUser(formData as User);
    } else {
        const newUser: User = {
            id: formData.id!, // Matricule
            username: formData.username!,
            name: formData.name!,
            email: formData.email!,
            role: formData.role!,
            zoneId: formData.zoneId,
            grade: formData.grade,
            password: formData.password!
        };
        onAddUser(newUser);
    }
    closeModal();
  };
  
  const openResetPasswordModal = (user: User) => {
    setUserToReset(user);
    setIsResetPasswordModalOpen(true);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setUserToReset(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsPasswordVisible(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
        setPasswordError('Les mots de passe ne correspondent pas.');
        return;
    }
    if (userToReset && newPassword) {
      onUpdateUser({ ...userToReset, password: newPassword });
      closeResetPasswordModal();
    }
  };

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500">
          <PlusIcon />
          Ajouter un Utilisateur
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 mb-4 bg-white rounded-lg shadow md:flex-row md:items-center">
          <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon />
              </span>
              <input 
                  type="text" 
                  placeholder="Rechercher par nom, matricule, username..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="block w-full py-2 pl-10 pr-4 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out"
              />
          </div>
          <div className="min-w-[200px]">
              <select 
                  value={gradeFilter} 
                  onChange={e => setGradeFilter(e.target.value)} 
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out"
              >
                  <option value="">Filtrer par grade</option>
                  {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
          </div>
      </div>


      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Matricule & Grade</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Zone</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map(user => (
                <tr key={user.id}>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-gray-500">@{user.username}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.id}</div>
                        <div className="text-gray-500">{user.grade}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div>{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{user.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{zones.find(z => z.id === user.zoneId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button onClick={() => openResetPasswordModal(user)} className="p-2 text-yellow-600 rounded-full hover:bg-yellow-100" title="Réinitialiser le mot de passe"><KeyIcon/></button>
                    <button onClick={() => openModal(user)} className="p-2 ml-2 text-indigo-600 rounded-full hover:bg-indigo-100" title="Modifier"><PencilIcon/></button>
                    {user.role !== UserRole.SUPER_ADMIN && (
                        <button onClick={() => onDeleteUser(user.id)} className="p-2 ml-2 text-red-600 rounded-full hover:bg-red-100" title="Supprimer"><TrashIcon/></button>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentUser ? 'Modifier Utilisateur' : 'Ajouter Utilisateur'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                    <input type="text" name="username" value={formData.username || ''} onChange={handleInputChange} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Matricule</label>
                    <input type="text" name="id" value={formData.id || ''} onChange={handleInputChange} required disabled={!!currentUser} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nom et Prénom</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <input type="text" name="grade" value={formData.grade || ''} onChange={handleInputChange} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                <select name="role" value={formData.role || ''} onChange={handleInputChange} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out">
                    <option value={UserRole.COMZONE}>COMZONE</option>
                    <option value={UserRole.SUPER_ADMIN}>SUPER_ADMIN</option>
                </select>
            </div>
            {formData.role === UserRole.COMZONE && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <select name="zoneId" value={formData.zoneId || ''} onChange={handleInputChange} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out">
                        <option value="">Non assigné</option>
                        {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {!currentUser && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mot de passe initial</label>
                    <input type="password" name="password" value={formData.password || ''} onChange={handleInputChange} required className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out" />
                </div>
            )}
            <div className="pt-4 text-right">
                <button type="button" onClick={closeModal} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-navy-600 border border-transparent rounded-md shadow-sm hover:bg-navy-700">Sauvegarder</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isResetPasswordModalOpen} onClose={closeResetPasswordModal} title={`Réinitialiser le mot de passe pour ${userToReset?.name}`}>
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="relative">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                <input 
                    type={isPasswordVisible ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    className="block w-full px-3 py-2 pr-10 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out"
                    autoFocus
                />
                 <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 top-6 flex items-center pr-3">
                    {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
            <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input 
                    type={isPasswordVisible ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    className="block w-full px-3 py-2 pr-10 mt-1 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm transition duration-150 ease-in-out"
                />
                 <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 top-6 flex items-center pr-3">
                    {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
            {passwordError && <p className="text-sm text-center text-red-600">{passwordError}</p>}
            <div className="pt-4 text-right">
                <button type="button" onClick={closeResetPasswordModal} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-navy-600 border border-transparent rounded-md shadow-sm hover:bg-navy-700">Réinitialiser</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
