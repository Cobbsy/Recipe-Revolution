import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200/80 dark:bg-gray-800/80 dark:border-gray-700/80">
      <div className="container mx-auto max-w-7xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
              <ChefHatIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight dark:text-gray-100">
              Recipe Revolution
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Smart Recipe Clipper</p>
          </div>
        </div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};

export default Header;