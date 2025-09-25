import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import RecipeInput from './components/FileUpload';
import RecipeDisplay from './components/AnalysisDisplay';
import Sidebar from './components/Sidebar';
import PantryAnalysisModal from './components/PantryAnalysisModal';
import ShoppingListModal from './components/ShoppingListModal';
import MealPlanGeneratorModal from './components/MealPlanGeneratorModal'; // Import new modal
import { clipRecipeFromText, clipRecipeFromTitle, clipRecipeFromImage, findRecipesFromPantry, getSuggestionsFromPantry, generateShoppingList, generateCulinaryJourney, generateMealPlanFromSavedRecipes, generateMealPlanWithNewRecipes, generateAndAttachRecipeImage } from './services/geminiService';
import type { Instruction, Micronutrient, PantryAnalysisResult, AIGeneratedRecipeSuggestion, ShoppingListCategory, Journey, PartialRecipe } from './services/geminiService';
import { readFileAsBase64 } from './utils/fileReader';

// FIX: Define the type for the recipe input data explicitly to resolve type inference issues.
type RecipeInputData = { type: 'paste', content: string } | 
                       { type: 'title', content: string } | 
                       { type: 'image', file: File } | 
                       { type: 'camera', content: { data: string; mimeType: string }};

// Define the main Recipe data structure for the application state
export interface Recipe {
    id: string;
    recipeName: string;
    description: string;
    prepTime: string;
    cookTime: string;
    servings: string;
    ingredients: string[];
    instructions: Instruction[];
    notes?: string;
    recipeImage?: string;
    isFavorite: boolean;
    cuisine?: string;
    dietaryRestrictions?: string[];
    source?: string;
    costAnalysis?: {
        rating: string;
        justification: string;
    };
    sustainabilityScore?: {
        score: string;
        justification: string;
    };
    micronutrients?: {
        [key: string]: Micronutrient;
    };
    healthNudge?: string;
}

export interface MealPlan {
  [day: string]: string[]; // day -> array of recipe IDs
}

export interface Filters {
    searchTerm: string;
    cuisine: string;
    dietary: string;
    prepTime: string;
}

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    cuisine: 'All',
    dietary: 'All',
    prepTime: 'All',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
    }
    return 'light';
  });
  const recipeDisplayRef = useRef<HTMLDivElement>(null); // Ref for scrolling
  
  // Pantry State
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [isPantryAnalysisLoading, setIsPantryAnalysisLoading] = useState(false);
  const [pantryAnalysisResult, setPantryAnalysisResult] = useState<PantryAnalysisResult | null>(null);
  const [pantryAiSuggestions, setPantryAiSuggestions] = useState<AIGeneratedRecipeSuggestion[] | null>(null);
  const [analysisType, setAnalysisType] = useState<'saved' | 'ai' | null>(null);
  const [pantryAnalysisError, setPantryAnalysisError] = useState<string | null>(null);

  // Meal Planner State
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  
  // Shopping List State
  const [shoppingListState, setShoppingListState] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    data: ShoppingListCategory[] | null;
    error: string | null;
  }>({ isOpen: false, isLoading: false, data: null, error: null });

  // AI Meal Plan Generator State
  const [mealPlanGeneratorState, setMealPlanGeneratorState] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
  }>({ isOpen: false, isLoading: false, error: null });

  // Journey State
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isJourneyLoading, setIsJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState<string | null>(null);

  // State for prompting for recipe source
  const [promptForSourceRecipeId, setPromptForSourceRecipeId] = useState<string | null>(null);


  // Effect to apply theme class and save preference
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Load recipes from local storage on initial render
  useEffect(() => {
    try {
      const storedRecipes = localStorage.getItem('recipes');
      if (storedRecipes) setRecipes(JSON.parse(storedRecipes));
      
      const storedPantry = localStorage.getItem('pantryItems');
      if (storedPantry) setPantryItems(JSON.parse(storedPantry));

      const storedMealPlan = localStorage.getItem('mealPlan');
      if (storedMealPlan) setMealPlan(JSON.parse(storedMealPlan));

      const storedJourney = localStorage.getItem('journey');
      if (storedJourney) setJourney(JSON.parse(storedJourney));
      
    } catch (e) {
      console.error("Failed to load data from local storage", e);
    }
  }, []);

  // Save recipes to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('recipes', JSON.stringify(recipes));
    } catch (e) {
      console.error("Failed to save recipes to local storage", e);
    }
  }, [recipes]);
  
  // Save pantry items to local storage whenever they change
  useEffect(() => {
      try {
          localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
      } catch (e) {
          console.error("Failed to save pantry items to local storage", e);
      }
  }, [pantryItems]);

  // Save meal plan to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    } catch (e) {
      console.error("Failed to save meal plan to local storage", e);
    }
  }, [mealPlan]);

  // Save journey to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('journey', JSON.stringify(journey));
    } catch (e) {
      console.error("Failed to save journey to local storage", e);
    }
  }, [journey]);
  
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId) || null;
  
  const filteredRecipes = useMemo(() => {
    return recipes
        .filter(r => showFavorites ? r.isFavorite : true)
        .filter(r => {
            const searchTerm = filters.searchTerm.toLowerCase();
            return searchTerm ? r.recipeName.toLowerCase().includes(searchTerm) || r.description.toLowerCase().includes(searchTerm) : true;
        })
        .filter(r => filters.cuisine !== 'All' ? r.cuisine === filters.cuisine : true)
        .filter(r => filters.dietary !== 'All' ? r.dietaryRestrictions?.includes(filters.dietary) : true)
        .filter(r => {
            if (filters.prepTime === 'All') return true;
            const prepTimeMinutes = parseInt(r.prepTime.match(/\d+/)?.[0] || '0', 10);
            if (filters.prepTime === '<15') return prepTimeMinutes < 15;
            if (filters.prepTime === '15-30') return prepTimeMinutes >= 15 && prepTimeMinutes <= 30;
            if (filters.prepTime === '>30') return prepTimeMinutes > 30;
            return true;
        });
  }, [recipes, showFavorites, filters]);

  const availableCuisines = useMemo(() => ['All', ...Array.from(new Set(recipes.map(r => r.cuisine).filter(Boolean)))], [recipes]);
  const availableDiets = useMemo(() => ['All', ...Array.from(new Set(recipes.flatMap(r => r.dietaryRestrictions || [])))], [recipes]);

  const handleClipRecipe = useCallback(async (data: RecipeInputData) => {
    setIsLoading(true);
    setError(null);
    setSelectedRecipeId(null);
    setPromptForSourceRecipeId(null);

    try {
      let clippedRecipeData;
      let imagePreview;

      if (data.type === 'paste') {
        clippedRecipeData = await clipRecipeFromText(data.content);
      } else if (data.type === 'title') {
        clippedRecipeData = await clipRecipeFromTitle(data.content);
      } else if (data.type === 'image' || data.type === 'camera') {
        const fileContent = data.type === 'image' ? await readFileAsBase64(data.file) : data.content;
        clippedRecipeData = await clipRecipeFromImage(fileContent);
        imagePreview = `data:${fileContent.mimeType};base64,${fileContent.data}`;
      } else {
        throw new Error('Unsupported input type');
      }

      const newRecipe: Recipe = {
        ...clippedRecipeData,
        id: new Date().toISOString(),
        isFavorite: false,
        recipeImage: imagePreview || clippedRecipeData.recipeImage,
      };
      
      setRecipes(prev => [newRecipe, ...prev]);
      setSelectedRecipeId(newRecipe.id);
      
      if (data.type === 'paste' && !newRecipe.source) {
        setPromptForSourceRecipeId(newRecipe.id);
      }

    } catch (err) {
      console.error("Clipping failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while clipping the recipe.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateRecipe = useCallback((updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  }, []);

  const handleDeleteRecipe = useCallback((recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    if (selectedRecipeId === recipeId) {
        setSelectedRecipeId(null);
    }
  }, [selectedRecipeId]);

  const handleAddPantryItem = (item: string) => {
      const trimmedItem = item.trim();
      if (trimmedItem && !pantryItems.find(i => i.toLowerCase() === trimmedItem.toLowerCase())) {
          setPantryItems(prev => [...prev, trimmedItem].sort());
      }
  };

  const handleRemovePantryItem = (itemToRemove: string) => {
      setPantryItems(prev => prev.filter(item => item !== itemToRemove));
  };
  
  const handleAnalyzePantry = async (type: 'saved' | 'ai') => {
    setIsPantryAnalysisLoading(true);
    setAnalysisType(type);
    setPantryAnalysisResult(null);
    setPantryAiSuggestions(null);
    setPantryAnalysisError(null);
    try {
      if (type === 'saved') {
        const result = await findRecipesFromPantry(pantryItems, recipes);
        setPantryAnalysisResult(result);
      } else {
        const result = await getSuggestionsFromPantry(pantryItems);
        setPantryAiSuggestions(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setPantryAnalysisError(errorMessage);
    } finally {
      setIsPantryAnalysisLoading(false);
    }
  };

  const handleClosePantryModal = () => {
    setAnalysisType(null);
    setPantryAnalysisResult(null);
    setPantryAiSuggestions(null);
    setPantryAnalysisError(null);
  };
  
  const handleSelectRecipeFromPantry = (recipeId: string) => {
      setSelectedRecipeId(recipeId);
      handleClosePantryModal();
      // Scroll to the recipe display after a short delay to allow UI to update
      setTimeout(() => {
        recipeDisplayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
  };

  const handleGenerateRecipeFromSuggestion = async (title: string) => {
    handleClosePantryModal();
    // A small delay to let the modal close smoothly before the loading indicator for clipping appears
    setTimeout(() => {
        handleClipRecipe({ type: 'title', content: title });
        // Scroll to the top where the loader will appear
        recipeDisplayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };


  const handleSetMealPlan = (newPlan: MealPlan) => {
    setMealPlan(newPlan);
  };

  const handleGenerateShoppingList = async () => {
    setShoppingListState({ isOpen: true, isLoading: true, data: null, error: null });
    
    const plannedRecipeIds = Object.values(mealPlan).flat();
    const recipesForShoppingList = recipes.filter(r => plannedRecipeIds.includes(r.id));
    
    try {
      const result = await generateShoppingList(recipesForShoppingList);
      setShoppingListState({ isOpen: true, isLoading: false, data: result, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred generating the shopping list.';
      setShoppingListState({ isOpen: true, isLoading: false, data: null, error: errorMessage });
    }
  };

  const handleCloseShoppingListModal = () => {
    setShoppingListState({ isOpen: false, isLoading: false, data: null, error: null });
  };

  const handleGenerateMealPlan = async (
    mode: 'saved' | 'new', 
    goal: string, 
    usePantry: boolean, 
    numDays: number
  ) => {
    setMealPlanGeneratorState({ isOpen: true, isLoading: true, error: null });
    try {
      if (mode === 'new') {
        // Generate brand new recipes
        const newPartialRecipes = await generateMealPlanWithNewRecipes(goal, numDays);
        
        // Enhance new recipes with AI-generated images in parallel
        const recipesWithImages = await Promise.all(
            newPartialRecipes.map(recipe => generateAndAttachRecipeImage(recipe))
        );

        const newFullRecipes: Recipe[] = recipesWithImages.map((pr, index) => ({
            ...pr,
            id: new Date().toISOString() + `-${index}`, // Unique ID
            isFavorite: false,
        }));
        
        setRecipes(prev => [...newFullRecipes, ...prev]);

        // Create the meal plan with the new recipe IDs
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const newPlan: MealPlan = {};
        newFullRecipes.forEach((recipe, i) => {
            if (i < numDays) {
                newPlan[days[i]] = [recipe.id];
            }
        });
        setMealPlan(newPlan);

      } else {
        // Generate from saved recipes
        const result = await generateMealPlanFromSavedRecipes(goal, usePantry, numDays, pantryItems, recipes);
        setMealPlan(result);
      }
      
      setMealPlanGeneratorState({ isOpen: false, isLoading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during meal plan generation.';
      setMealPlanGeneratorState(s => ({ ...s, isLoading: false, error: errorMessage }));
    }
  };


  const handleGenerateJourney = async () => {
    setIsJourneyLoading(true);
    setJourneyError(null);
    try {
      const result = await generateCulinaryJourney(recipes);
      setJourney(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during journey analysis.';
      setJourneyError(errorMessage);
    } finally {
      setIsJourneyLoading(false);
    }
  };


  return (
    <div className="bg-orange-50/50 min-h-screen dark:bg-gray-900 transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 h-full">
          <Sidebar
            recipes={recipes} // Pass all recipes for planner
            filteredRecipes={filteredRecipes} // For recipe list display
            selectedRecipeId={selectedRecipeId}
            onSelectRecipe={setSelectedRecipeId}
            showFavorites={showFavorites}
            onToggleFavoritesFilter={() => setShowFavorites(f => !f)}
            filters={filters}
            onFilterChange={handleFilterChange}
            availableCuisines={availableCuisines}
            availableDiets={availableDiets}
            pantryItems={pantryItems}
            onAddPantryItem={handleAddPantryItem}
            onRemovePantryItem={handleRemovePantryItem}
            onAnalyzePantry={handleAnalyzePantry}
            isAnalysisLoading={isPantryAnalysisLoading}
            mealPlan={mealPlan}
            onSetMealPlan={handleSetMealPlan}
            onGenerateShoppingList={handleGenerateShoppingList}
            onOpenMealPlanGenerator={() => setMealPlanGeneratorState({ isOpen: true, isLoading: false, error: null })}
            journey={journey}
            isJourneyLoading={isJourneyLoading}
            journeyError={journeyError}
            onGenerateJourney={handleGenerateJourney}
            onGenerateRecipeFromTitle={(title) => handleClipRecipe({ type: 'title', content: title })}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200/80 dark:from-gray-800 dark:to-gray-800/50 dark:border-gray-700/80">
            <RecipeInput onSubmit={handleClipRecipe} disabled={isLoading} />
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg dark:bg-red-900/30 dark:border-red-600 dark:text-red-300" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <div ref={recipeDisplayRef} className="scroll-mt-24">
            <RecipeDisplay
              recipe={selectedRecipe}
              isLoading={isLoading}
              onUpdateRecipe={handleUpdateRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              promptForSourceRecipeId={promptForSourceRecipeId}
              onDismissSourcePrompt={() => setPromptForSourceRecipeId(null)}
            />
          </div>
        </div>
      </main>
      <PantryAnalysisModal
          isOpen={!!analysisType || isPantryAnalysisLoading}
          isLoading={isPantryAnalysisLoading}
          analysisType={analysisType}
          savedResult={pantryAnalysisResult}
          aiSuggestions={pantryAiSuggestions}
          error={pantryAnalysisError}
          onClose={handleClosePantryModal}
          onSelectSavedRecipe={handleSelectRecipeFromPantry}
          onGenerateAiRecipe={handleGenerateRecipeFromSuggestion}
      />
      <ShoppingListModal
          isOpen={shoppingListState.isOpen}
          isLoading={shoppingListState.isLoading}
          data={shoppingListState.data}
          error={shoppingListState.error}
          onClose={handleCloseShoppingListModal}
      />
      <MealPlanGeneratorModal
        isOpen={mealPlanGeneratorState.isOpen}
        isLoading={mealPlanGeneratorState.isLoading}
        error={mealPlanGeneratorState.error}
        onClose={() => setMealPlanGeneratorState({ isOpen: false, isLoading: false, error: null })}
        onGenerate={handleGenerateMealPlan}
      />
    </div>
  );
};

export default App;