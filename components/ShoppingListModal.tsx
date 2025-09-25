import React from 'react';
import type { ShoppingListCategory } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckSquareIcon } from './icons/CheckSquareIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';

interface ShoppingListModalProps {
    isOpen: boolean;
    isLoading: boolean;
    data: ShoppingListCategory[] | null;
    error: string | null;
    onClose: () => void;
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, isLoading, data, error, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
                        <ShoppingCartIcon className="w-5 h-5 text-orange-500" />
                        Your Shopping List
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 dark:hover:text-gray-200">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-3 text-center">
                            <SpinnerIcon className="w-10 h-10 text-orange-500" />
                            <p className="text-gray-700 font-semibold dark:text-gray-200">Generating your list...</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">The AI is consolidating and categorizing ingredients from your meal plan.</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-700">
                            <p className="font-bold text-red-700 dark:text-red-300">Generation Failed</p>
                            <p className="text-sm text-red-600 mt-1 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {data && (
                        <div className="space-y-6">
                            {data.map(category => (
                                <div key={category.category}>
                                    <h4 className="font-bold text-gray-800 text-lg mb-2 border-b-2 border-orange-200 pb-1 dark:text-gray-200 dark:border-orange-800">
                                        {category.category}
                                    </h4>
                                    <ul className="space-y-2.5">
                                        {category.items.map((item, index) => (
                                            <li key={index} className="flex items-start">
                                                <label className="flex items-center text-gray-700 cursor-pointer dark:text-gray-300">
                                                    <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-3 dark:bg-gray-700 dark:border-gray-500 dark:text-orange-500" />
                                                    <span>{item}</span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50/80 border-t text-right rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShoppingListModal;