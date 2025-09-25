import React from 'react';
import type { PantryAnalysisResult, AIGeneratedRecipeSuggestion } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { XIcon } from './icons/XIcon';
import { ChefHatIcon } from './icons/ChefHatIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { SparklesIcon } from './icons/SparklesIcon';


interface PantryAnalysisModalProps {
    isOpen: boolean;
    isLoading: boolean;
    analysisType: 'saved' | 'ai' | null;
    savedResult: PantryAnalysisResult | null;
    aiSuggestions: AIGeneratedRecipeSuggestion[] | null;
    error: string | null;
    onClose: () => void;
    onSelectSavedRecipe: (recipeId: string) => void;
    onGenerateAiRecipe: (title: string) => void;
}

const PantryAnalysisModal: React.FC<PantryAnalysisModalProps> = ({ isOpen, isLoading, analysisType, savedResult, aiSuggestions, error, onClose, onSelectSavedRecipe, onGenerateAiRecipe }) => {
    if (!isOpen) return null;

    const hasSavedResults = savedResult && (savedResult.readyToCook.length > 0 || savedResult.nearlyThere.length > 0);
    const hasAiSuggestions = aiSuggestions && aiSuggestions.length > 0;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Pantry Suggestions</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 dark:hover:text-gray-200">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-3 text-center">
                            <SpinnerIcon className="w-10 h-10 text-orange-500" />
                            <p className="text-gray-700 font-semibold dark:text-gray-200">Analyzing your pantry...</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">The AI is checking your ingredients to see what you can cook.</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-700">
                            <p className="font-bold text-red-700 dark:text-red-300">Analysis Failed</p>
                            <p className="text-sm text-red-600 mt-1 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    
                    {!isLoading && !error && analysisType === 'saved' && !hasSavedResults && (
                         <div className="text-center p-4 bg-gray-50 border rounded-lg dark:bg-gray-700/50 dark:border-gray-600">
                            <p className="font-bold text-gray-700 dark:text-gray-200">No Matches Found</p>
                            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">We couldn't find any of your saved recipes that closely match your pantry items. Try the "Ask The Chef" option for new ideas!</p>
                        </div>
                    )}

                     {!isLoading && !error && analysisType === 'ai' && !hasAiSuggestions && (
                         <div className="text-center p-4 bg-gray-50 border rounded-lg dark:bg-gray-700/50 dark:border-gray-600">
                            <p className="font-bold text-gray-700 dark:text-gray-200">The Chef is Stumped!</p>
                            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">We couldn't generate new ideas with the current ingredients. Try adding a few more core items like a protein or vegetable.</p>
                        </div>
                    )}
                    
                    {analysisType === 'saved' && hasSavedResults && (
                        <div className="space-y-6">
                            {savedResult.readyToCook.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2 dark:text-gray-200">
                                        <ChefHatIcon className="w-5 h-5 text-green-600" />
                                        Ready to Cook Now
                                    </h4>
                                    <ul className="space-y-2">
                                        {savedResult.readyToCook.map(recipe => (
                                            <li key={recipe.recipeId}>
                                                <button onClick={() => onSelectSavedRecipe(recipe.recipeId)} className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-semibold text-green-800 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-300">
                                                    {recipe.recipeName}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {savedResult.nearlyThere.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2 dark:text-gray-200">
                                        <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                                        Just a Few Items Away
                                    </h4>
                                    <ul className="space-y-3">
                                        {savedResult.nearlyThere.map(recipe => (
                                            <li key={recipe.recipeId} className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/40">
                                                <button onClick={() => onSelectSavedRecipe(recipe.recipeId)} className="w-full text-left font-semibold text-blue-800 hover:underline dark:text-blue-300">
                                                    {recipe.recipeName}
                                                </button>
                                                <div className="mt-2 pl-2">
                                                    <p className="text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">Shopping List:</p>
                                                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                                        {recipe.missingIngredients.map((ing, i) => (
                                                            <li key={i}>{ing}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {analysisType === 'ai' && hasAiSuggestions && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2 dark:text-gray-200">
                                    <SparklesIcon className="w-5 h-5 text-purple-500" />
                                    The Chef Suggests...
                                </h4>
                                <ul className="space-y-3">
                                    {aiSuggestions.map(suggestion => (
                                        <li key={suggestion.recipeName} className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/40">
                                            <p className="font-semibold text-purple-800 dark:text-purple-300">{suggestion.recipeName}</p>
                                            <p className="text-sm text-gray-700 mt-1 mb-3 dark:text-gray-300">{suggestion.description}</p>
                                            
                                            <div className="text-xs space-y-2">
                                                {suggestion.requiredPantryIngredients.length > 0 && (
                                                    <div>
                                                        <p className="font-semibold text-gray-600 uppercase dark:text-gray-400">Using:</p>
                                                        <p className="text-gray-600 dark:text-gray-400">{suggestion.requiredPantryIngredients.join(', ')}</p>
                                                    </div>
                                                )}
                                                {suggestion.optionalExtraIngredients.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="font-semibold text-gray-600 uppercase dark:text-gray-400">Optional:</p>
                                                        <p className="text-gray-600 dark:text-gray-400">{suggestion.optionalExtraIngredients.join(', ')}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => onGenerateAiRecipe(suggestion.recipeName)} className="w-full mt-4 text-center p-2 bg-purple-500 hover:bg-purple-600 rounded-lg shadow-sm text-sm font-bold text-white transition-colors">
                                                Generate This Recipe
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-4 bg-gray-50/80 border-t text-right rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PantryAnalysisModal;
