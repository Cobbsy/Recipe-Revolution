import React, { useState } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface MealPlanGeneratorModalProps {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onGenerate: (mode: 'saved' | 'new', goal: string, usePantry: boolean, numDays: number) => void;
}

const MealPlanGeneratorModal: React.FC<MealPlanGeneratorModalProps> = ({ isOpen, isLoading, error, onClose, onGenerate }) => {
    const [mode, setMode] = useState<'saved' | 'new'>('saved');
    const [goal, setGoal] = useState('');
    const [usePantry, setUsePantry] = useState(true);
    const [numDays, setNumDays] = useState(5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(mode, goal, usePantry, numDays);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
                        <SparklesIcon className="w-5 h-5 text-orange-500" />
                        AI Meal Planner
                    </h3>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-700 p-1 disabled:opacity-50 dark:hover:text-gray-200">&times;</button>
                </div>

                {isLoading ? (
                    <div className="p-10 flex flex-col items-center justify-center space-y-3 text-center">
                        <SpinnerIcon className="w-10 h-10 text-orange-500" />
                        <p className="text-gray-700 font-semibold dark:text-gray-200">Planning your perfect week...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">The AI is finding the tastiest combinations for you.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
                                    <p className="font-bold">Generation Failed</p>
                                    <p>{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How should I generate the plan?</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200/80 rounded-full dark:bg-gray-700/80">
                                    <button
                                        type="button"
                                        onClick={() => setMode('saved')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'saved' ? 'bg-white shadow dark:bg-gray-800' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-900/50'}`}
                                    >
                                        Use My Saved Recipes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('new')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'new' ? 'bg-white shadow dark:bg-gray-800' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-900/50'}`}
                                    >
                                        Generate New Ideas
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">What's your goal or theme?</label>
                                <input
                                    id="goal"
                                    type="text"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    placeholder={mode === 'saved' ? "e.g., Quick weeknight dinners" : "e.g., Healthy vegetarian lunches"}
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="numDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of days</label>
                                    <select
                                        id="numDays"
                                        value={numDays}
                                        onChange={(e) => setNumDays(Number(e.target.value))}
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    >
                                        <option value={3}>3 days</option>
                                        <option value={5}>5 days</option>
                                        <option value={7}>7 days</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label htmlFor="usePantry" className={`flex items-center select-none transition-opacity ${mode === 'new' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <input
                                            id="usePantry"
                                            type="checkbox"
                                            checked={usePantry}
                                            onChange={(e) => setUsePantry(e.target.checked)}
                                            disabled={mode === 'new'}
                                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:bg-gray-300"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use pantry items</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50/80 border-t flex justify-end gap-3 rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                             <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
                                Generate My Plan
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default MealPlanGeneratorModal;