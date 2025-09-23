import React from 'react';
import type { Recipe } from '../App';
import { StarIcon } from './icons/StarIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface RecipeListProps {
    recipes: Recipe[];
    selectedRecipeId: string | null;
    onSelectRecipe: (id: string) => void;
    showFavorites: boolean;
    onToggleFavoritesFilter: () => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, selectedRecipeId, onSelectRecipe, showFavorites, onToggleFavoritesFilter }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-orange-500" />
                    My Recipes
                </h3>
                <label htmlFor="favorites-toggle" className="flex items-center cursor-pointer">
                    <span className="text-sm font-semibold text-gray-600 mr-2">Favorites</span>
                    <div className="relative">
                        <input id="favorites-toggle" type="checkbox" className="sr-only" checked={showFavorites} onChange={onToggleFavoritesFilter} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${showFavorites ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showFavorites ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                </label>
            </div>
            {recipes.length > 0 ? (
                <ul className="divide-y divide-gray-200/80 max-h-[60vh] overflow-y-auto">
                    {recipes.map(recipe => (
                        <li key={recipe.id}>
                            <button
                                onClick={() => onSelectRecipe(recipe.id)}
                                className={`w-full text-left p-4 transition-colors duration-150 ease-in-out ${recipe.id === selectedRecipeId ? 'bg-orange-100/80' : 'hover:bg-orange-50/60'}`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <p className={`font-semibold text-gray-800 ${recipe.id === selectedRecipeId ? 'text-orange-700' : ''}`}>{recipe.recipeName}</p>
                                    {recipe.isFavorite && <StarIcon isFilled={true} className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                                </div>
                                <p className="text-sm text-gray-500 mt-1 truncate">{recipe.description}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-6 text-center text-gray-500">
                    <p>{showFavorites ? "You haven't favorited any recipes yet." : "Your clipped recipes are saved in your browser. Get started by clipping a new one!"}</p>
                </div>
            )}
        </div>
    );
};

export default RecipeList;