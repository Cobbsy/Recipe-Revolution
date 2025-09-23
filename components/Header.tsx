import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200/80">
      <div className="container mx-auto max-w-4xl p-4 flex items-center gap-3">
        <div className="bg-orange-500 p-2 rounded-lg">
            <ChefHatIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">
          Smart Recipe Clipper
        </h1>
      </div>
    </header>
  );
};

export default Header;