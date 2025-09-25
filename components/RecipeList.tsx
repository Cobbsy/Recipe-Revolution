import React, { useState } from 'react';
import type { Recipe, Filters } from '../App';
import { StarIcon } from './icons/StarIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SearchIcon } from './icons/SearchIcon';
import { FilterIcon } from './icons/FilterIcon';


interface RecipeListProps {
    recipes: Recipe[];
    selectedRecipeId: string | null;
    onSelectRecipe: (id: string) => void;
    showFavorites: boolean;
    onToggleFavoritesFilter: () => void;
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    availableCuisines: string[];
    availableDiets: string[];
}

const RecipeFilters: React.FC<Omit<RecipeListProps, 'recipes' | 'selectedRecipeId' | 'onSelectRecipe'>> = ({
    filters,
    onFilterChange,
    availableCuisines,
    availableDiets
}) => {
    return (
        <div className="p-3 space-y-3">
            <div className="relative">
                <SearchIcon className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search recipes..."
                    value={filters.searchTerm}
                    onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
                    className="w-full p-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div>
                    <label htmlFor="cuisine-filter" className="sr-only">Cuisine</label>
                    <select
                        id="cuisine-filter"
                        value={filters.cuisine}
                        onChange={(e) => onFilterChange({ cuisine: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        {availableCuisines.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="diet-filter" className="sr-only">Dietary</label>
                    <select
                        id="diet-filter"
                        value={filters.dietary}
                        onChange={(e) => onFilterChange({ dietary: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        {availableDiets.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="prep-time-filter" className="sr-only">Prep Time</label>
                    <select
                        id="prep-time-filter"
                        value={filters.prepTime}
                        onChange={(e) => onFilterChange({ prepTime: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        <option value="All">Any Prep Time</option>
                        <option value="<15">Under 15 min</option>
                        <option value="15-30">15-30 min</option>
                        <option value=">30">Over 30 min</option>
                    </select>
                </div>
            </div>
        </div>
    );
};


const RecipeList: React.FC<RecipeListProps> = ({ 
    recipes, 
    selectedRecipeId, 
    onSelectRecipe, 
    showFavorites, 
    onToggleFavoritesFilter,
    filters,
    onFilterChange,
    availableCuisines,
    availableDiets
}) => {
    
    const [showFilters, setShowFilters] = useState(false);
    
    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, recipeId: string) => {
        e.dataTransfer.setData('recipeId', recipeId);
    };

    const isAnyFilterActive = filters.searchTerm || filters.cuisine !== 'All' || filters.dietary !== 'All' || filters.prepTime !== 'All';
    
    return (
        <div>
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-sm z-10 dark:bg-gray-800/80 dark:border-gray-700/80">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                    <BookOpenIcon className="w-5 h-5 text-orange-500" />
                    My Recipes
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters(f => !f)} className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-orange-100 dark:bg-orange-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <FilterIcon className={`w-5 h-5 transition-colors ${showFilters || isAnyFilterActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    </button>
                    <label htmlFor="favorites-toggle" className="flex items-center cursor-pointer" title="Show only favorites">
                        <input id="favorites-toggle" type="checkbox" className="sr-only" checked={showFavorites} onChange={onToggleFavoritesFilter} />
                        <div className={`p-1 rounded-full transition-colors ${showFavorites ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <StarIcon isFilled={showFavorites} className={`w-5 h-5 transition-colors ${showFavorites ? 'text-white' : 'text-white/70'}`} />
                        </div>
                    </label>
                </div>
            </div>
            
            {showFilters && (
                <div className="border-b dark:border-gray-700/80">
                    <RecipeFilters 
                        filters={filters} 
                        onFilterChange={onFilterChange}
                        availableCuisines={availableCuisines}
                        availableDiets={availableDiets}
                        showFavorites={showFavorites}
                        onToggleFavoritesFilter={onToggleFavoritesFilter}
                    />
                </div>
            )}

            {recipes.length > 0 ? (
                <ul className="divide-y divide-gray-200/80 dark:divide-gray-700/80">
                    {recipes.map(recipe => (
                        <li key={recipe.id}>
                            <button
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, recipe.id)}
                                onClick={() => onSelectRecipe(recipe.id)}
                                className={`w-full text-left p-3 transition-colors duration-150 ease-in-out cursor-grab active:cursor-grabbing ${recipe.id === selectedRecipeId ? 'bg-orange-100/80 dark:bg-orange-900/50' : 'hover:bg-orange-50/60 dark:hover:bg-gray-700/60'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {recipe.recipeImage ? (
                                        <img src={recipe.recipeImage} alt={recipe.recipeName} className="w-14 h-14 object-cover rounded-md flex-shrink-0 border border-gray-200 dark:border-gray-600" />
                                     ) : (
                                        <div className="w-14 h-14 bg-orange-100 rounded-md flex-shrink-0 flex items-center justify-center dark:bg-orange-900/50">
                                            <BookOpenIcon className="w-6 h-6 text-orange-400" />
                                        </div>
                                    )}
                                    <div className="flex-grow overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`font-semibold text-gray-800 leading-tight dark:text-gray-200 ${recipe.id === selectedRecipeId ? 'text-orange-700 dark:text-orange-400' : ''}`}>{recipe.recipeName}</p>
                                            {recipe.isFavorite && <StarIcon isFilled={true} className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 truncate dark:text-gray-400">{recipe.description}</p>
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    {isAnyFilterActive || showFavorites
                        ? <p>No recipes match your current filters. Try adjusting your search.</p>
                        : <p>Your clipped recipes are saved in your browser. Get started by clipping a new one!</p>
                    }
                </div>
            )}
        </div>
    );
};

export default RecipeList;
