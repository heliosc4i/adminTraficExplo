import React, { useState } from 'react';
import { User, Zone, Station, MessageStats } from '../types';
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
  stations: Station[];
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
  onRefreshStats: () => Promise<void>;
}

type View = 'dashboard' | 'users' | 'zones' | 'stations' | 'stats';

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const renderView = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement users={props.users} zones={props.zones} onAddUser={props.onAddUser} onUpdateUser={props.onUpdateUser} onDeleteUser={props.onDeleteUser} />;
      case 'zones':
        return <ZoneManagement zones={props.zones} onAddZone={props.onAddZone} onUpdateZone={props.onUpdateZone} onDeleteZone={props.onDeleteZone} />;
      case 'stations':
        return <StationManagement stations={props.stations} zones={props.zones} onAddStation={props.onAddStation} onUpdateStation={props.onUpdateStation} onDeleteStation={props.onDeleteStation} />;
      case 'stats':
        return <StatsViewer stats={props.stats} users={props.users} zones={props.zones} stations={props.stations} />;
      case 'dashboard':
      default:
        return <Dashboard stats={props.stats} users={props.users} zones={props.zones} stations={props.stations} onRefreshStats={props.onRefreshStats} />;
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
        <div className="flex items-center justify-center h-16 text-white bg-navy-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          <span className="ml-2 text-xl font-semibold">Admin TraficExplo</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => (
            <button
                key={item.id}
                onClick={() => {
                    setActiveView(item.id as View);
                    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
                }}
                className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeView === item.id 
                    ? 'bg-navy-900 text-white' 
                    : 'text-navy-100 hover:bg-navy-700 hover:text-white'
                }`}
            >
                {item.icon}
                <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
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