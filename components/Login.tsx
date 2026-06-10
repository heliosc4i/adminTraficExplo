import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';
import logoUrl from '../logo.png';

interface LoginProps {
  onLogin: (credentials: { username: string, password?: string }) => Promise<string | null>;
}

// Simple inline SVG icons for the form
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        setError('Veuillez remplir tous les champs.');
        return;
    }
    setError('');
    setIsLoading(true);
    const errorMessage = await onLogin({ username, password });
    setIsLoading(false);
    if (errorMessage) {
        setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-navy-800 to-navy-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
            <img
                src={logoUrl}
                alt="Helios C4I"
                className="h-24 mx-auto object-contain"
            />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-800">
                Admin - TraficExplo
            </h1>
            <p className="mt-2 text-sm text-gray-600">
                Connectez-vous pour accéder à votre tableau de bord
            </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full px-3 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 focus:border-navy-500 focus:z-10 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 focus:border-navy-500 focus:z-10 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                aria-label={isPasswordVisible ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md" role="alert">
                <ErrorIcon />
                <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out border border-transparent rounded-md shadow-sm group bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:bg-navy-400 disabled:cursor-not-allowed transform hover:scale-105"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {isLoading && (
                    <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
              </span>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
         <p className="mt-4 text-xs text-center text-gray-400">
            © {new Date().getFullYear()} HeliosC4I.cm | Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Login;