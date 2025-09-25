import React, { useState } from 'react';
import type { MealPlan, Recipe } from '../App';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface MealPlannerProps {
    mealPlan: MealPlan;
    onSetMealPlan: (plan: MealPlan) => void;
    recipes: Recipe[];
    onGenerateShoppingList: () => void;
    onSelectRecipe: (id: string) => void;
    onOpenGenerator: () => void;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MealPlanner: React.FC<MealPlannerProps> = ({ mealPlan, onSetMealPlan, recipes, onGenerateShoppingList, onSelectRecipe, onOpenGenerator }) => {
    const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, day: string) => {
        e.preventDefault();
        setDraggedOverDay(day);
    };

    const handleDragLeave = () => {
        setDraggedOverDay(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: string) => {
        e.preventDefault();
        setDraggedOverDay(null);
        const recipeId = e.dataTransfer.getData('recipeId');
        if (recipeId) {
            const newPlan = { ...mealPlan };
            if (!newPlan[day]) {
                newPlan[day] = [];
            }
            // Avoid adding duplicates
            if (!newPlan[day].includes(recipeId)) {
                newPlan[day].push(recipeId);
                onSetMealPlan(newPlan);
            }
        }
    };
    
    const handleRemoveFromPlan = (recipeId: string, day: string) => {
        const newPlan = { ...mealPlan };
        newPlan[day] = newPlan[day].filter(id => id !== recipeId);
        if (newPlan[day].length === 0) {
            delete newPlan[day];
        }
        onSetMealPlan(newPlan);
    };

    const plannedRecipesCount = Object.values(mealPlan).flat().length;

    return (
        <div className="space-y-4">
            <button
                onClick={onOpenGenerator}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
            >
                <SparklesIcon className="w-5 h-5" />
                <span>Generate Plan with AI</span>
            </button>
            <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Or drag recipes from the list and drop them onto a day to plan your week.</p>
            </div>
            <div className="space-y-3">
                {daysOfWeek.map(day => {
                    const plannedRecipeIds = mealPlan[day] || [];
                    return (
                        <div
                            key={day}
                            onDragOver={(e) => handleDragOver(e, day)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${draggedOverDay === day ? 'border-orange-400 bg-orange-100/50 border-dashed dark:bg-orange-900/40' : 'border-transparent bg-gray-50 dark:bg-gray-700/50'}`}
                        >
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">{day}</h4>
                            {plannedRecipeIds.length > 0 ? (
                                <ul className="mt-2 space-y-1">
                                    {plannedRecipeIds.map(id => {
                                        const recipe = recipes.find(r => r.id === id);
                                        if (!recipe) return null;
                                        return (
                                            <li key={id} className="group flex items-center justify-between text-sm p-1.5 bg-white rounded-md shadow-sm dark:bg-gray-600">
                                                <button onClick={() => onSelectRecipe(id)} className="truncate hover:underline text-gray-700 font-medium dark:text-gray-200">
                                                    {recipe.recipeName}
                                                </button>
                                                <button onClick={() => handleRemoveFromPlan(id, day)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity">
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">Drop a recipe here</p>
                            )}
                        </div>
                    );
                })}
            </div>
            <button
                onClick={onGenerateShoppingList}
                disabled={plannedRecipesCount === 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
            >
                <ShoppingCartIcon className="w-5 h-5" />
                <span>Generate Shopping List</span>
            </button>
        </div>
    );
};

export default MealPlanner;