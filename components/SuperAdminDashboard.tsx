import React, { useState } from 'react';
import { User, Zone, Station, MessageStats } from '../types';
import logoUrl from '../logo.png';
import Header from './Header';
import Footer from './Footer';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import ZoneManagement from './ZoneManagement';
import StationManagement from './StationManagement';
import StatsViewer from './StatsViewer';
import { UsersIcon, GlobeAltIcon, RadioIcon, ChartBarIcon } from './Icons';

interface SuperAdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  users: User[];
  zones: Zone[];
  activeZones: Zone[];
  stations: Station[];
  deletedStations: Station[];
  stats: MessageStats[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddZone: (zone: Zone) => void;
  onUpdateZone: (zone: Zone) => void;
  onDeleteZone: (zoneId: string) => void;
  onAddStation: (station: Station) => void;
  onUpdateStation: (station: Station) => void;
  onDeleteStation: (stationId: string) => void;
  onRestoreStation: (stationId: string) => void;
  onRefreshStats: () => Promise<void>;
}

type View = 'dashboard' | 'users' | 'zones' | 'stations' | 'stats';

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props: SuperAdminDashboardProps) => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const renderView = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement users={props.users} zones={props.activeZones} onAddUser={props.onAddUser} onUpdateUser={props.onUpdateUser} onDeleteUser={props.onDeleteUser} />;
      case 'zones':
        return <ZoneManagement zones={props.zones} onAddZone={props.onAddZone} onUpdateZone={props.onUpdateZone} onDeleteZone={props.onDeleteZone} />;
      case 'stations':
        return <StationManagement stations={props.stations} deletedStations={props.deletedStations} zones={props.activeZones} onAddStation={props.onAddStation} onUpdateStation={props.onUpdateStation} onDeleteStation={props.onDeleteStation} onRestoreStation={props.onRestoreStation} />;
      case 'stats':
        return <StatsViewer stats={props.stats} users={props.users} zones={props.activeZones} stations={props.stations} />;
      case 'dashboard':
      default:
        return <Dashboard stats={props.stats} users={props.users} zones={props.activeZones} stations={props.stations} onRefreshStats={props.onRefreshStats} />;
    }
  };

  const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon /> },
      { id: 'users', label: 'Utilisateurs', icon: <UsersIcon /> },
      { id: 'zones', label: 'Zones', icon: <GlobeAltIcon /> },
      { id: 'stations', label: 'Stations', icon: <RadioIcon /> },
      { id: 'stats', label: 'Statistiques', icon: <ChartBarIcon /> }
  ];

  return (
    <div className="relative min-h-screen md:flex">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
          <div 
              className="fixed inset-0 z-20 bg-black opacity-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-navy-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-navy-900 flex-shrink-0">
          <img src={logoUrl} alt="Helios C4I" className="h-10 object-contain mix-blend-screen" />
          <span className="ml-3 text-xl font-semibold text-white">Admin TraficExplo</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as View);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 border-l-2 ${
                activeView === item.id
                  ? 'bg-white/10 text-white border-white/70'
                  : 'text-navy-300 hover:bg-white/5 hover:text-white border-transparent'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          <p className="text-xs text-navy-400 text-center">Helios C4I &copy; {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-0">
        <Header 
          currentUser={props.currentUser} 
          onLogout={props.onLogout} 
          showTitle={false}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container px-4 py-8 mx-auto sm:px-6">
            {renderView()}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;