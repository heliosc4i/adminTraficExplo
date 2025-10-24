import React from 'react';

interface ConnectionErrorProps {
  onRetry: () => void;
}

const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRetry }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-8 text-center bg-white rounded-lg shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Erreur de Connexion</h2>
        <p className="mt-2 text-gray-600">
          L'application n'a pas pu communiquer avec le serveur.
        </p>
        <div className="p-4 mt-6 text-left bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-gray-700">Actions Suggérées :</h3>
            <ul className="mt-2 text-sm list-decimal list-inside text-gray-600 space-y-2">
                <li>
                    <strong>Le serveur est-il démarré ?</strong> Ouvrez un terminal, naviguez dans le dossier <code className="px-1 py-0.5 text-sm bg-gray-200 rounded">backend</code>, et exécutez la commande <code className="px-1 py-0.5 text-sm bg-gray-200 rounded">node server.js</code>.
                </li>
                <li>
                    <strong>Le terminal du serveur affiche-t-il des erreurs ?</strong> S'il y a des erreurs rouges dans le terminal (par exemple, un problème de connexion à la base de données), le serveur s'est peut-être arrêté. Corrigez l'erreur et relancez le serveur.
                </li>
                 <li>
                    <strong>Vérifiez la console du navigateur.</strong> Appuyez sur F12 ou Ctrl+Shift+I, allez dans l'onglet "Console" et recherchez des messages d'erreur plus détaillés.
                </li>
            </ul>
        </div>
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 mt-6 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500"
        >
          Réessayer la connexion
        </button>
      </div>
    </div>
  );
};

export default ConnectionError;
