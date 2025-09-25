import React, { useState } from 'react';
import RecipeList from './RecipeList';
import Pantry from './Pantry';
import MealPlanner from './MealPlanner';
import JourneyPlanner from './JourneyPlanner';
import type { Recipe, MealPlan, Filters } from '../App';
import type { Journey } from '../services/geminiService';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PantryIcon } from './icons/PantryIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CompassIcon } from './icons/CompassIcon';


interface SidebarProps {
    recipes: Recipe[];
    filteredRecipes: Recipe[];
    selectedRecipeId: string | null;
    onSelectRecipe: (id: string) => void;
    showFavorites: boolean;
    onToggleFavoritesFilter: () => void;
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    availableCuisines: string[];
    availableDiets: string[];
    pantryItems: string[];
    onAddPantryItem: (item: string) => void;
    onRemovePantryItem: (item: string) => void;
    onAnalyzePantry: (type: 'saved' | 'ai') => void;
    isAnalysisLoading: boolean;
    mealPlan: MealPlan;
    onSetMealPlan: (plan: MealPlan) => void;
    onGenerateShoppingList: () => void;
    onOpenMealPlanGenerator: () => void;
    journey: Journey | null;
    isJourneyLoading: boolean;
    journeyError: string | null;
    onGenerateJourney: () => void;
    onGenerateRecipeFromTitle: (title: string) => void;
}

type Tab = 'recipes' | 'pantry' | 'planner' | 'journey';

const Sidebar: React.FC<SidebarProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>('recipes');

    const tabs: { id: Tab, name: string, icon: React.FC<any> }[] = [
        { id: 'recipes', name: 'Recipes', icon: BookOpenIcon },
        { id: 'pantry', name: 'Pantry', icon: PantryIcon },
        { id: 'planner', name: 'Planner', icon: CalendarIcon },
        { id: 'journey', name: 'Journey', icon: CompassIcon },
    ];

    return (
        <aside className="lg:sticky lg:top-24 h-full">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 flex flex-col h-full lg:max-h-[calc(100vh-7.5rem)] dark:bg-gray-800 dark:border-gray-700/80">
                <div className="flex-shrink-0 grid grid-cols-4 gap-1 p-1 bg-gray-100/80 rounded-t-2xl border-b border-gray-200/80 dark:bg-gray-900/80 dark:border-gray-700/80">
                    {tabs.map(tab => (
                         <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow-sm dark:bg-gray-700' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
                         >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'recipes' && (
                        <RecipeList 
                            recipes={props.filteredRecipes}
                            selectedRecipeId={props.selectedRecipeId}
                            onSelectRecipe={props.onSelectRecipe}
                            showFavorites={props.showFavorites}
                            onToggleFavoritesFilter={props.onToggleFavoritesFilter}
                            filters={props.filters}
                            onFilterChange={props.onFilterChange}
                            availableCuisines={props.availableCuisines}
                            availableDiets={props.availableDiets}
                        />
                    )}
                    {activeTab === 'pantry' && (
                        <div className="p-4">
                            <Pantry
                                pantryItems={props.pantryItems}
                                onAddPantryItem={props.onAddPantryItem}
                                onRemovePantryItem={props.onRemovePantryItem}
                                onAnalyzePantry={props.onAnalyzePantry}
                                isAnalysisLoading={props.isAnalysisLoading}
                            />
                        </div>
                    )}
                    {activeTab === 'planner' && (
                       <div className="p-4">
                           <MealPlanner
                                mealPlan={props.mealPlan}
                                onSetMealPlan={props.onSetMealPlan}
                                recipes={props.recipes}
                                onGenerateShoppingList={props.onGenerateShoppingList}
                                onSelectRecipe={props.onSelectRecipe}
                                onOpenGenerator={props.onOpenMealPlanGenerator}
                           />
                       </div>
                    )}
                    {activeTab === 'journey' && (
                        <div className="p-4">
                            <JourneyPlanner
                                journey={props.journey}
                                isLoading={props.isJourneyLoading}
                                error={props.journeyError}
                                onGenerateJourney={props.onGenerateJourney}
                                onGenerateRecipe={props.onGenerateRecipeFromTitle}
                            />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;