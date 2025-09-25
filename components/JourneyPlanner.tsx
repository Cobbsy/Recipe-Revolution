import React from 'react';
import type { Journey } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CompassIcon } from './icons/CompassIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ChefHatIcon } from './icons/ChefHatIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface JourneyPlannerProps {
    journey: Journey | null;
    isLoading: boolean;
    error: string | null;
    onGenerateJourney: () => void;
    onGenerateRecipe: (title: string) => void;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-3 text-center py-8">
        <SpinnerIcon className="w-10 h-10 text-orange-500" />
        <p className="text-gray-700 font-semibold dark:text-gray-200">Charting Your Culinary Course...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">The AI is analyzing your recipes to create a personalized journey.</p>
    </div>
);

const InitialState: React.FC<{ onGenerate: () => void }> = ({ onGenerate }) => (
    <div className="text-center py-8 space-y-4">
        <CompassIcon className="w-16 h-16 text-gray-300 mx-auto dark:text-gray-600" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Discover Your Culinary Journey</h3>
        <p className="text-sm text-gray-600 max-w-xs mx-auto dark:text-gray-400">Analyze your saved recipes to get a personalized flavor profile, skill challenges, and cuisine tours.</p>
        <button
            onClick={onGenerate}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
        >
            <CompassIcon className="w-5 h-5" />
            <span>Start My Journey</span>
        </button>
    </div>
);


const JourneyDisplay: React.FC<{ journey: Journey, onGenerateRecipe: (title: string) => void }> = ({ journey, onGenerateRecipe }) => (
    <div className="space-y-6">
        {/* Flavor Profile */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/30 dark:border-orange-800/50">
            <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2 dark:text-gray-200">
                <BookOpenIcon className="w-5 h-5 text-orange-600" />
                Your Flavor Profile
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{journey.flavorProfile}</p>
        </div>

        {/* Skill Challenge */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-800/50">
            <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2 dark:text-gray-200">
                <ChefHatIcon className="w-5 h-5 text-blue-600" />
                Next Skill Challenge: <span className="text-blue-700 dark:text-blue-300">{journey.skillChallenge.skillName}</span>
            </h4>
            <p className="text-sm text-gray-700 mb-3 dark:text-gray-300">{journey.skillChallenge.description}</p>
            <button 
                onClick={() => onGenerateRecipe(journey.skillChallenge.suggestedRecipeTitle)}
                className="w-full text-left p-2 bg-white hover:bg-blue-100/50 rounded-lg shadow-sm text-sm dark:bg-gray-700 dark:hover:bg-blue-900/20"
            >
                <span className="font-semibold text-gray-600 block dark:text-gray-400">Try this recipe:</span>
                <span className="font-bold text-blue-800 dark:text-blue-300">{journey.skillChallenge.suggestedRecipeTitle} &rarr;</span>
            </button>
        </div>
        
        {/* Cuisine Tour */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/30 dark:border-green-800/50">
            <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2 dark:text-gray-200">
                <GlobeIcon className="w-5 h-5 text-green-600" />
                Cuisine Tour: <span className="text-green-700 dark:text-green-300">{journey.cuisineTour.cuisineName}</span>
            </h4>
            <p className="text-sm text-gray-700 mb-3 dark:text-gray-300">{journey.cuisineTour.description}</p>
             <button 
                onClick={() => onGenerateRecipe(journey.cuisineTour.suggestedFirstRecipeTitle)}
                className="w-full text-left p-2 bg-white hover:bg-green-100/50 rounded-lg shadow-sm text-sm dark:bg-gray-700 dark:hover:bg-green-900/20"
            >
                <span className="font-semibold text-gray-600 block dark:text-gray-400">Start with this recipe:</span>
                <span className="font-bold text-green-800 dark:text-green-300">{journey.cuisineTour.suggestedFirstRecipeTitle} &rarr;</span>
            </button>
        </div>
    </div>
);


const JourneyPlanner: React.FC<JourneyPlannerProps> = ({ journey, isLoading, error, onGenerateJourney, onGenerateRecipe }) => {

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-700">
                <p className="font-bold text-red-700 dark:text-red-300">Analysis Failed</p>
                <p className="text-sm text-red-600 mt-1 dark:text-red-400">{error}</p>
                 <button
                    onClick={onGenerateJourney}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                    Try Again
                </button>
            </div>
        );
    }
    
    if (journey) {
        return <JourneyDisplay journey={journey} onGenerateRecipe={onGenerateRecipe} />;
    }

    return <InitialState onGenerate={onGenerateJourney} />;
};

export default JourneyPlanner;