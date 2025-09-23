import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { extractRecipe, extractRecipeFromImage, generateRecipeFromTitle, Recipe as BaseRecipe } from './services/geminiService';
import { readFileAsBase64 } from './utils/fileReader';
import Header from './components/Header';
import RecipeInput from './components/FileUpload';
import RecipeDisplay from './components/AnalysisDisplay';
import RecipeList from './components/RecipeList';

// Add client-side fields to the base recipe type
export type Recipe = BaseRecipe & {
  id: string;
  isFavorite: boolean;
};

const loadRecipesFromLocalStorage = (): Recipe[] => {
  try {
    const savedRecipes = localStorage.getItem('userRecipes');
    return savedRecipes ? JSON.parse(savedRecipes) : [];
  } catch (error) {
    console.error("Could not load recipes from local storage", error);
    return [];
  }
};

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipesFromLocalStorage);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(() => {
    const loadedRecipes = loadRecipesFromLocalStorage();
    return loadedRecipes.length > 0 ? loadedRecipes[0].id : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('userRecipes', JSON.stringify(recipes));
    } catch (error) {
      console.error("Could not save recipes to local storage", error);
    }
  }, [recipes]);

  const handleClipRecipe = useCallback(async (data: { type: 'paste', content: string } | { type: 'title', content: string } | { type: 'image', file: File }) => {
    setIsLoading(true);
    setError('');
    
    try {
      let result: Omit<Recipe, 'id' | 'isFavorite'>;
      switch (data.type) {
        case 'paste':
          if (!data.content.trim()) {
            setError('Please paste some recipe text first.');
            setIsLoading(false);
            return;
          }
          result = await extractRecipe(data.content);
          break;
        case 'title':
            if (!data.content.trim()) {
                setError('Please enter a recipe title first.');
                setIsLoading(false);
                return;
            }
            result = await generateRecipeFromTitle(data.content);
            break;
        case 'image':
          const imageData = await readFileAsBase64(data.file);
          result = await extractRecipeFromImage(imageData);
          break;
      }
      
      const newRecipe: Recipe = {
        ...result,
        id: Date.now().toString(),
        isFavorite: false,
      };

      setRecipes(prev => [newRecipe, ...prev]);
      setSelectedRecipeId(newRecipe.id);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`We couldn't clip that recipe. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleUpdateRecipe = useCallback((updatedRecipe: Recipe) => {
    setRecipes(prevRecipes => prevRecipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  }, []);

  const handleDeleteRecipe = useCallback((recipeId: string) => {
    const remainingRecipes = recipes.filter(r => r.id !== recipeId);
    setRecipes(remainingRecipes);
    if (selectedRecipeId === recipeId) {
        // If the selected recipe is deleted, select the first one in the remaining list or none.
        setSelectedRecipeId(remainingRecipes.length > 0 ? remainingRecipes[0].id : null);
    }
  }, [selectedRecipeId, recipes]);

  const selectedRecipe = useMemo(() => {
    // When selectedRecipeId is updated after deletion, recipes might not be updated yet.
    // Find from the latest state.
    const currentRecipes = recipes;
    return currentRecipes.find(r => r.id === selectedRecipeId) ?? null;
  }, [recipes, selectedRecipeId]);

  const filteredRecipes = useMemo(() => {
    const sortedRecipes = [...recipes].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    return showFavorites ? sortedRecipes.filter(r => r.isFavorite) : sortedRecipes;
  }, [recipes, showFavorites]);
  
  return (
    <div className="bg-orange-50/50 min-h-screen font-sans text-gray-800">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 sm:p-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 border border-gray-200/80">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Your AI Culinary Assistant</h2>
            <p className="text-lg text-gray-600">
              Paste a recipe, generate one from a title, or upload a photo to get started.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <RecipeInput onSubmit={handleClipRecipe} disabled={isLoading} />
            
            {error && (
              <div className="text-center text-red-600 bg-red-100 p-3 rounded-lg">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <aside className="lg:col-span-1 lg:sticky lg:top-24">
                 <RecipeList
                    recipes={filteredRecipes}
                    selectedRecipeId={selectedRecipeId}
                    onSelectRecipe={setSelectedRecipeId}
                    showFavorites={showFavorites}
                    onToggleFavoritesFilter={() => setShowFavorites(s => !s)}
                />
            </aside>
            <section className="lg:col-span-2">
                 <RecipeDisplay 
                    recipe={selectedRecipe} 
                    isLoading={isLoading} 
                    onUpdateRecipe={handleUpdateRecipe} 
                    onDeleteRecipe={handleDeleteRecipe} 
                />
            </section>
        </div>

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Gemini API</p>
        </footer>
      </main>
    </div>
  );
};

export default App;