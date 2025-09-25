import React, { useState } from 'react';
import { PantryIcon } from './icons/PantryIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface PantryProps {
    pantryItems: string[];
    onAddPantryItem: (item: string) => void;
    onRemovePantryItem: (item: string) => void;
    onAnalyzePantry: (type: 'saved' | 'ai') => void;
    isAnalysisLoading: boolean;
}

const Pantry: React.FC<PantryProps> = ({ pantryItems, onAddPantryItem, onRemovePantryItem, onAnalyzePantry, isAnalysisLoading }) => {
    const [newItem, setNewItem] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddPantryItem(newItem);
        setNewItem('');
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                    placeholder="Add an ingredient..."
                    aria-label="New pantry item"
                />
                <button type="submit" disabled={!newItem.trim()} className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-orange-300">
                    Add
                </button>
            </form>

            {pantryItems.length > 0 ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {pantryItems.map(item => (
                        <li key={item} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group dark:bg-gray-700/50">
                            <span className="text-gray-800 dark:text-gray-200">{item}</span>
                            <button onClick={() => onRemovePantryItem(item)} className="text-gray-400 hover:text-red-600 opacity-50 group-hover:opacity-100 transition-opacity dark:text-gray-500 dark:hover:text-red-500" aria-label={`Remove ${item}`}>
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-sm text-gray-500 py-4 dark:text-gray-400">Your pantry is empty. Add some ingredients you have on hand.</p>
            )}
            
            <div className="space-y-3 pt-2 border-t dark:border-gray-700">
                 <button
                    onClick={() => onAnalyzePantry('saved')}
                    disabled={isAnalysisLoading || pantryItems.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                    {isAnalysisLoading ? <SpinnerIcon className="w-5 h-5" /> : <LightbulbIcon className="w-5 h-5" />}
                    <span>{isAnalysisLoading ? 'Analyzing...' : 'Analyze My Recipes'}</span>
                </button>
                <button
                    onClick={() => onAnalyzePantry('ai')}
                    disabled={isAnalysisLoading || pantryItems.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                    {isAnalysisLoading ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                    <span>{isAnalysisLoading ? 'Asking The Chef...' : 'Ask The Chef'}</span>
                </button>
            </div>
        </div>
    );
};

export default Pantry;
