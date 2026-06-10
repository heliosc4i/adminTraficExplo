import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ComzoneDashboard from './components/ComzoneDashboard';
import ConnectionError from './components/ConnectionError';
import { User, UserRole, Zone, Station, MessageStats } from './types';
import * as api from './api';

interface Alert {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const AlertIcon = ({ type }: { type: 'success' | 'error' }) => {
  if (type === 'success') {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-900 text-white">
        <svg className="w-16 h-16 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg">Chargement de l'application...</p>
    </div>
);


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [stats, setStats] = useState<MessageStats[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setConnectionError(null);
    try {
        const data = await api.getInitialData();
        setUsers(data.users);
        setZones(data.zones);
        setStations(data.stations);
        setStats(data.stats);
    } catch (err: any) {
        if (!silent) setConnectionError(err.message || "Impossible de charger les données initiales.");
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HELPERS ---
  const addAlert = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  // --- API Handlers ---

  const handleLogin = async (credentials: { username: string, password?: string }): Promise<string | null> => {
    try {
      const user = await api.login(credentials);
      setCurrentUser(user);
      return null;
    } catch (err: any) {
      return err.message;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- CRUD Handlers (call API and update local state) ---

  const handleAddUser = async (user: User) => {
    try {
      const newUser = await api.addUser(user);
      setUsers(prev => [...prev, newUser]);
      addAlert(`Utilisateur '${newUser.name}' créé avec succès.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const returnedUser = await api.updateUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === returnedUser.id ? returnedUser : u));
      // The backend might have updated zone assignments, so we re-fetch zones to be safe
      const updatedZones = await api.getZones();
      setZones(updatedZones);
      addAlert(`Utilisateur '${returnedUser.name}' mis à jour.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
     if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addAlert(`Utilisateur supprimé.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };

  const handleAddZone = async (zone: Zone) => {
    try {
      const newZone = await api.addZone(zone);
      setZones(prev => [...prev, newZone]);
      addAlert(`Zone '${newZone.name}' créée.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };

  const handleUpdateZone = async (updatedZone: Zone) => {
     try {
      const returnedZone = await api.updateZone(updatedZone);
      setZones(prev => prev.map(z => z.id === returnedZone.id ? returnedZone : z));
      addAlert(`Zone '${returnedZone.name}' mise à jour.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };
  
  const handleDeleteZone = async (zoneId: string) => {
    try {
      await api.deleteZone(zoneId);
      await fetchData(true);
      addAlert(`Zone supprimée.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };
  
  const handleAddStation = async (station: Station) => {
    try {
      const newStation = await api.addStation(station);
      setStations(prev => [...prev, newStation]);
      addAlert(`Station '${newStation.name}' créée.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };
  
  const handleUpdateStation = async (updatedStation: Station) => {
    try {
      const returnedStation = await api.updateStation(updatedStation);
      setStations(prev => prev.map(s => s.id === returnedStation.id ? returnedStation : s));
      addAlert(`Station '${returnedStation.name}' mise à jour.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };
  
  const handleDeleteStation = async (stationId: string) => {
    try {
      const updated = await api.deleteStation(stationId);
      setStations(prev => prev.map(s => s.id === updated.id ? updated : s));
      addAlert(`Station mise à la corbeille.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };

  const handleRestoreStation = async (stationId: string) => {
    try {
      const updated = await api.restoreStation(stationId);
      setStations(prev => prev.map(s => s.id === updated.id ? updated : s));
      addAlert(`Station restaurée.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };

  const handleAddStat = async (stat: Omit<MessageStats, 'id'>) => {
     try {
      const newStat = await api.addStat(stat);
      setStats(prev => [...prev, newStat]);
      addAlert(`Statistiques soumises avec succès.`);
    } catch (err: any) {
      addAlert(err.message, 'error');
    }
  };
  
  // --- RENDER LOGIC ---

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (connectionError) {
      return <ConnectionError onRetry={fetchData} />;
  }
  
  const renderContent = () => {
      if (!currentUser) {
        return <Login onLogin={handleLogin} />;
      }

      const trashZoneIds = new Set(zones.filter(z => z.isTrash).map(z => z.id));
      const activeStations = stations.filter(s => !s.isDeleted && !trashZoneIds.has(s.zoneId));
      const deletedStations = stations.filter(s => s.isDeleted === true || trashZoneIds.has(s.zoneId));
      const activeStationIds = new Set(activeStations.map(s => s.id));
      const activeZones = zones.filter(z => !z.isTrash);
      const activeStats = stats.filter(s => activeStationIds.has(s.stationId));

      if (currentUser.role === UserRole.SUPER_ADMIN) {
        return <SuperAdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          users={users}
          zones={zones}
          activeZones={activeZones}
          stations={activeStations}
          deletedStations={deletedStations}
          stats={activeStats}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onAddZone={handleAddZone}
          onUpdateZone={handleUpdateZone}
          onDeleteZone={handleDeleteZone}
          onAddStation={handleAddStation}
          onUpdateStation={handleUpdateStation}
          onDeleteStation={handleDeleteStation}
          onRestoreStation={handleRestoreStation}
          onRefreshStats={() => fetchData(true)}
        />;
      }

      if (currentUser.role === UserRole.COMZONE) {
        const userZone = zones.find(z => z.id === currentUser.zoneId);
        const userStations = activeStations.filter(s => s.zoneId === currentUser.zoneId);
        const userStats = stats.filter(s => s.zoneId === currentUser.zoneId);
    
        return <ComzoneDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          stations={userStations}
          zone={userZone}
          onAddStat={handleAddStat}
          stats={userStats}
        />;
      }
    
      return (
        <div className="p-4">
          <p>Role non reconnu.</p>
          <button onClick={handleLogout} className="px-4 py-2 mt-2 text-white bg-red-500 rounded">Se déconnecter</button>
        </div>
      );
  }

  return (
    <>
      <div className="fixed top-4 left-4 right-4 z-[100] space-y-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
        {alerts.map(alert => {
          const isSuccess = alert.type === 'success';
          const alertClasses = isSuccess
            ? 'bg-green-50 text-green-800 border-green-400'
            : 'bg-red-50 text-red-800 border-red-400';

          return (
            <div key={alert.id} className={`relative flex items-start p-4 text-sm rounded-lg shadow-lg border-l-4 ${alertClasses} animate-fade-in-down`} role="alert">
              <div className="flex-shrink-0">
                <AlertIcon type={alert.type} />
              </div>
              <div className="ml-3">
                <p className="font-medium">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
      {renderContent()}
    </>
  );
};

export default App;