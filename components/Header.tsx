import React, { useState } from 'react';
import { User } from '../types';

const Header: React.FC<{
  currentUser: User;
  onLogout: () => void;
  showTitle?: boolean;
  onToggleSidebar?: () => void;
}> = ({ currentUser, onLogout, showTitle = true, onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const LogoutIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
  
  const UserCircleIcon = () => (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
      </svg>
  );


  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 bg-white border-b shadow-sm">
      <div className="flex items-center">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-4 text-gray-500 md:hidden focus:outline-none focus:text-gray-700"
            aria-label="Ouvrir la barre latérale"
          >
            <MenuIcon />
          </button>
        )}
        {showTitle && (
          <h1 className="ml-4 text-xl font-semibold text-gray-800">
            Helios C4I - ZoneCom
          </h1>
        )}
      </div>

      <div className="relative flex items-center pr-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center text-left focus:outline-none"
        >
          <div className="mr-3 text-right">
            <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.role}</p>
          </div>
          <UserCircleIcon />
        </button>

        {isDropdownOpen && (
          <div
            className="absolute right-0 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg top-full ring-1 ring-black ring-opacity-5"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
            <div className="py-1">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onLogout();
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <LogoutIcon />
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;