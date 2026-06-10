import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="p-4 text-center bg-white border-t">
      <p className="text-sm text-gray-600">
        © {new Date().getFullYear()} HeliosC4I.cm | Tous droits réservés.
      </p>
      <p className="mt-1 text-xs text-navy-700 font-semibold tracking-wide">
        Oscar d'élite du digital.
      </p>
    </footer>
  );
};

export default Footer;