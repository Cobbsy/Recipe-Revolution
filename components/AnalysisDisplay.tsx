// Note: This file has been re-purposed to serve as the RecipeDisplay component.
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
// FIX: The 'Instruction' type is defined in the geminiService, not the App component.
import type { Recipe as AppRecipeType } from '../App';
// FIX: Added Micronutrient to the import to resolve typing errors.
import type { Instruction, Substitute, Micronutrient } from '../services/geminiService';
import { findSubstitutes, remixRecipe } from '../services/geminiService';
import { WandIcon } from './icons/WandIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { LightningIcon } from './icons/LightningIcon';
import { HappyIcon } from './icons/HappyIcon';
import { SleepyIcon } from './icons/SleepyIcon';
import { StomachIcon } from './icons/StomachIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { LeafIcon } from './icons/LeafIcon';
import { HeartPulseIcon } from './icons/HeartPulseIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlayIcon } from './icons/PlayIcon';
import { ShareIcon } from './icons/ShareIcon';
import { CopyIcon } from './icons/CopyIcon';
import { LinkIcon } from './icons/LinkIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { PlusIcon } from './icons/PlusIcon';
import { NotebookIcon } from './icons/NotebookIcon';
import { StarIcon } from './icons/StarIcon';
// FIX: 'ChefHatIcon' was used but not imported.
import { ChefHatIcon } from './icons/ChefHatIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import CookMode from './CookMode';
import UnitConverter from './UnitConverter';

type Recipe = AppRecipeType;

interface RecipeDisplayProps {
  recipe: Recipe | null;
  isLoading: boolean;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  promptForSourceRecipeId: string | null;
  onDismissSourcePrompt: () => void;
}

const loadingMessages = [
    "Warming up the oven...",
    "Chopping the vegetables...",
    "Consulting our master chefs...",
    "Perfecting the plating...",
    "Simmering the sauce...",
    "Adding a pinch of magic...",
];

const LoadingIndicator: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);
    
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative mb-4">
                <ChefHatIcon className="w-20 h-20 text-orange-400 animate-bounce" style={{ animationDuration: '1.5s' }} />
                <SparklesIcon className="w-8 h-8 text-yellow-400 absolute top-0 -right-2 animate-ping" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mt-4 dark:text-gray-200">Clipping Your Recipe</h3>
            <p className="text-gray-600 mt-2 transition-opacity duration-500 ease-in-out dark:text-gray-400">{message}</p>

            {/* Skeleton Loader */}
            <div className="w-full max-w-2xl mt-10 space-y-8 animate-pulse text-left">
                <div className="h-64 bg-gray-200 rounded-xl w-full dark:bg-gray-700"></div>
                <div className="space-y-3">
                    <div className="h-8 bg-gray-200 rounded-md w-3/4 mx-auto dark:bg-gray-700"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full dark:bg-gray-700"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6 mx-auto dark:bg-gray-700"></div>
                </div>
                <div className="grid grid-cols-5 gap-4 text-center p-4 bg-gray-100 rounded-lg dark:bg-gray-700/50">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i}>
                            <div className="h-5 bg-gray-200 rounded-md w-1/2 mx-auto mb-2 dark:bg-gray-600"></div>
                            <div className="h-4 bg-gray-200 rounded-md w-3/4 mx-auto dark:bg-gray-600"></div>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded-md w-1/3 dark:bg-gray-700"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full mb-2 dark:bg-gray-700"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full mb-2 dark:bg-gray-700"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6 dark:bg-gray-700"></div>
                </div>
            </div>
        </div>
    );
};


const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    recipeName: string;
}> = ({ isOpen, onClose, onConfirm, recipeName }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full dark:bg-gray-800">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirm Deletion</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete the recipe for "{recipeName}"? This action cannot be undone.
                    </p>
                </div>
                <div className="p-4 bg-gray-50/80 border-t flex gap-3 justify-end rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};


const ShareModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
}> = ({ isOpen, onClose, recipe }) => {
    const [copyTextLabel, setCopyTextLabel] = useState('Copy Text');
    const [copyLinkLabel, setCopyLinkLabel] = useState('Copy Link');

    const formatRecipeForSharing = (recipeToFormat: Recipe): string => {
        let text = `** ${recipeToFormat.recipeName} **\n\n`;
        text += `${recipeToFormat.description}\n\n`;
        text += `—------------------\n`;
        text += `Prep Time: ${recipeToFormat.prepTime}\n`;
        text += `Cook Time: ${recipeToFormat.cookTime}\n`;
        text += `Servings: ${recipeToFormat.servings}\n`;
        text += `—------------------\n\n`;
        text += `** Ingredients **\n`;
        text += recipeToFormat.ingredients.map(ing => `- ${ing}`).join('\n');
        text += `\n\n** Instructions **\n`;
        text += recipeToFormat.instructions.map((inst, i) => `${i + 1}. ${inst.text}`).join('\n');
        return text;
    };

    const formattedRecipe = useMemo(() => formatRecipeForSharing(recipe), [recipe]);

    const handleCopyText = () => {
        navigator.clipboard.writeText(formattedRecipe).then(() => {
            setCopyTextLabel('Copied!');
            setTimeout(() => setCopyTextLabel('Copy Text'), 2000);
        });
    };
    
    const handleCopyLink = () => {
        // In a real app, this would be a unique shareable URL.
        // For this demo, we'll just copy the current window's URL.
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyLinkLabel('Copied!');
            setTimeout(() => setCopyLinkLabel('Copy Link'), 2000);
        });
    };

    useEffect(() => {
      // Reset button text when modal is reopened
      if (isOpen) {
        setCopyTextLabel('Copy Text');
        setCopyLinkLabel('Copy Link');
      }
    }, [isOpen]);

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Share Recipe</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 dark:hover:text-gray-200">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <textarea 
                        readOnly
                        className="w-full h-64 p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 font-mono resize-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300"
                        value={formattedRecipe}
                    />
                </div>
                <div className="p-4 bg-gray-50/80 border-t flex flex-col sm:flex-row gap-3 justify-end rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                    <button onClick={handleCopyText} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto">
                        <CopyIcon className="w-4 h-4" />
                        <span>{copyTextLabel}</span>
                    </button>
                     <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto">
                        <LinkIcon className="w-4 h-4" />
                        <span>{copyLinkLabel}</span>
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 w-full sm:w-auto dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Close</button>
                </div>
            </div>
        </div>
    );
};


const SubstituteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    ingredient: string;
    substitutes: Substitute[] | null;
    isLoading: boolean;
    error: string | null;
}> = ({ isOpen, onClose, ingredient, substitutes, isLoading, error }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Substitutes for <span className="text-orange-600 dark:text-orange-400">{ingredient}</span></h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 dark:hover:text-gray-200">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <SpinnerIcon className="w-8 h-8 text-orange-500" />
                            <p className="text-gray-600 dark:text-gray-300">Finding smart substitutes...</p>
                        </div>
                    )}
                    {error && <p className="text-red-600 text-center dark:text-red-400">{error}</p>}
                    {substitutes && (
                        <ul className="space-y-4">
                            {substitutes.map((sub, index) => (
                                <li key={index} className="p-3 bg-orange-50/70 rounded-lg dark:bg-gray-700/50">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{sub.name}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{sub.notes}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="p-4 bg-gray-50/80 border-t text-right rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Close</button>
                </div>
            </div>
        </div>
    );
};

const RemixModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onRemix: (prompt: string) => void;
    isLoading: boolean;
    error: string | null;
}> = ({ isOpen, onClose, onRemix, isLoading, error }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    
    const quickRemixes = [
        { label: '🥦', text: 'Make it vegetarian' },
        { label: '🍞', text: 'Make it gluten-free' },
        { label: '❤️', text: 'Make it healthier' },
        { label: '⏱️', text: 'Make it quicker' },
        { label: '🧒', text: 'Make it for kids' },
        { label: '🌶️', text: 'Make it spicier' },
    ];

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customPrompt.trim()) {
            onRemix(customPrompt.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100"><MagicWandIcon className="w-5 h-5 text-purple-600 dark:text-purple-400"/>Remix This Recipe</h3>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-700 p-1 disabled:opacity-50 dark:hover:text-gray-200">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-3 dark:text-gray-300">Quick Remixes</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {quickRemixes.map((remix) => (
                                <button key={remix.text} onClick={() => onRemix(remix.text)} disabled={isLoading} className="text-left p-3 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-orange-900/40 dark:disabled:hover:bg-gray-700">
                                    <span className="text-xl">{remix.label}</span>
                                    <p className="font-semibold text-sm mt-1 text-gray-800 dark:text-gray-200">{remix.text}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-700 mb-2 dark:text-gray-300">Custom Remix</h4>
                        <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-2">
                           <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                disabled={isLoading}
                                className="w-full flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                placeholder="e.g., How can I make this on a grill?"
                                rows={2}
                            />
                            <button type="submit" disabled={isLoading || !customPrompt.trim()} className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-orange-300">Remix</button>
                        </form>
                    </div>
                </div>
                 {(isLoading || error) && (
                    <div className="p-4 bg-gray-50/80 border-t rounded-b-2xl dark:bg-gray-900/80 dark:border-gray-700">
                        {isLoading && (
                            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
                                <SpinnerIcon className="w-5 h-5 text-orange-500" />
                                <span>Remixing your recipe... this might take a moment.</span>
                            </div>
                        )}
                        {error && <p className="text-red-600 text-center dark:text-red-400">{error}</p>}
                    </div>
                 )}
            </div>
        </div>
    );
};

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, isLoading, onUpdateRecipe, onDeleteRecipe, promptForSourceRecipeId, onDismissSourcePrompt }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [preRemixRecipe, setPreRemixRecipe] = useState<Recipe | null>(null);
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixError, setRemixError] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
      isOpen: boolean;
      ingredient: string | null;
      substitutes: Substitute[] | null;
      isLoading: boolean;
      error: string | null;
  }>({
      isOpen: false,
      ingredient: null,
      substitutes: null,
      isLoading: false,
      error: null
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  
  // New state for name refinement
  const [showNameRefinement, setShowNameRefinement] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const prevRecipeId = useRef<string | null>(null);

  // Refs for auto-focusing new list items
  const ingredientsListRef = useRef<HTMLUListElement>(null);
  const instructionsListRef = useRef<HTMLOListElement>(null);
  const [lastAdded, setLastAdded] = useState<'ingredients' | 'instructions' | null>(null);

  useEffect(() => {
    setEditedRecipe(recipe);
    if (recipe) {
      setFeedbackSubmitted(false);
      setIsEditing(false); // Exit edit mode when a new recipe is loaded
      setPreRemixRecipe(null); // Reset remix state when a new recipe is clipped
    }
    
    // Logic for name refinement banner
    if (recipe && recipe.id !== prevRecipeId.current) {
        // It's a newly selected or clipped recipe.
        setShowNameRefinement(true);
        setIsEditingName(false);
        setEditedName(recipe.recipeName);
    } else if (!recipe) {
        setShowNameRefinement(false);
        setIsEditingName(false);
    }
    prevRecipeId.current = recipe ? recipe.id : null;

  }, [recipe]);

  // Effect to handle dismissing the source prompt if the user selects a different recipe
  useEffect(() => {
    if (recipe && recipe.id !== promptForSourceRecipeId) {
        onDismissSourcePrompt();
    }
  }, [recipe, promptForSourceRecipeId, onDismissSourcePrompt]);


  // Effect to auto-focus the last added item
  useEffect(() => {
    if (!lastAdded) return;

    if (lastAdded === 'ingredients' && ingredientsListRef.current) {
        const inputs = ingredientsListRef.current.querySelectorAll('input[type="text"]');
        const lastInput = inputs[inputs.length - 1] as HTMLInputElement | null;
        if (lastInput) lastInput.focus();
    } else if (lastAdded === 'instructions' && instructionsListRef.current) {
        const textareas = instructionsListRef.current.querySelectorAll('textarea');
        const lastTextarea = textareas[textareas.length - 1] as HTMLTextAreaElement | null;
        if (lastTextarea) lastTextarea.focus();
    }
    
    setLastAdded(null); // Reset after focusing
  }, [editedRecipe, lastAdded]);
  
  const handleFindSubstitutes = useCallback(async (ingredient: string) => {
      if (!recipe) return;
      
      setModalState({
          isOpen: true,
          ingredient,
          substitutes: null,
          isLoading: true,
          error: null
      });

      try {
          const result = await findSubstitutes(ingredient, recipe);
          setModalState(s => ({ ...s, substitutes: result, isLoading: false }));
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setModalState(s => ({ ...s, error: errorMessage, isLoading: false }));
      }
  }, [recipe]);

  const closeModal = () => setModalState({ isOpen: false, ingredient: null, substitutes: null, isLoading: false, error: null });

  const handleFeedback = () => {
    setFeedbackSubmitted(true);
  };
  
  const handleRemix = async (prompt: string) => {
    if (!recipe) return;
    
    setIsRemixing(true);
    setRemixError(null);
    if (!preRemixRecipe) {
        setPreRemixRecipe(recipe); // Save the original recipe if it's the first remix
    }

    try {
        const remixedResult = await remixRecipe(recipe, prompt);
        const remixed: Recipe = {
            ...remixedResult,
            id: recipe.id, // Keep the same ID
            isFavorite: recipe.isFavorite, // Keep the same favorite status
        }
        onUpdateRecipe(remixed);
        setIsRemixModalOpen(false);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setRemixError(errorMessage);
    } finally {
        setIsRemixing(false);
    }
  };

  const handleReturnToOriginal = () => {
    if (preRemixRecipe) {
        onUpdateRecipe(preRemixRecipe);
        setPreRemixRecipe(null);
    }
  };
  
  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (recipe && editedName.trim()) {
        onUpdateRecipe({ ...recipe, recipeName: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleEditChange = (field: keyof Recipe, value: any) => {
    if (editedRecipe) {
      setEditedRecipe({ ...editedRecipe, [field]: value });
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    if (editedRecipe) {
      const newList = [...editedRecipe.ingredients];
      newList[index] = value;
      setEditedRecipe({ ...editedRecipe, ingredients: newList });
    }
  };

  const handleInstructionTextChange = (index: number, value: string) => {
    if (editedRecipe) {
      const newList = [...editedRecipe.instructions];
      newList[index] = { ...newList[index], text: value };
      setEditedRecipe({ ...editedRecipe, instructions: newList });
    }
  };

  const handleAddListItem = (list: 'ingredients' | 'instructions') => {
    if (editedRecipe) {
        if (list === 'ingredients') {
            const newList = [...editedRecipe.ingredients, ''];
            setEditedRecipe({ ...editedRecipe, ingredients: newList });
        } else {
            const newList = [...editedRecipe.instructions, { text: '' }];
            setEditedRecipe({ ...editedRecipe, instructions: newList });
        }
        setLastAdded(list);
    }
  };

  const handleDeleteListItem = (list: 'ingredients' | 'instructions', index: number) => {
    if (editedRecipe) {
      const newList = editedRecipe[list].filter((_, i) => i !== index);
      setEditedRecipe({ ...editedRecipe, [list]: newList as any }); // Cast to any to satisfy TS
    }
  };

  const handleSaveChanges = () => {
    if (editedRecipe) {
      onUpdateRecipe(editedRecipe);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedRecipe(recipe);
    setIsEditing(false);
  };

  const handleToggleFavorite = () => {
    if (recipe) {
      onUpdateRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
    }
  };


  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 border border-gray-200/80 dark:bg-gray-800 dark:border-gray-700/80">
        <LoadingIndicator />
      </div>
    );
  }

  if (!recipe) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-200/80 text-center min-h-[400px] flex flex-col justify-center items-center dark:bg-gray-800 dark:border-gray-700/80">
            <ChefHatIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Welcome to your Recipe Book</h3>
            <p className="text-gray-500 mt-2 max-w-sm dark:text-gray-400">Clip a new recipe using the form above, or select one from your list to get started.</p>
        </div>
    );
  }

  const recipeToShow = isEditing ? editedRecipe : recipe;
  if (!recipeToShow) return null;
  
  const confirmDelete = () => {
    onDeleteRecipe(recipe.id);
    setIsDeleteModalOpen(false);
  };

  const isPromptingForSource = recipe?.id === promptForSourceRecipeId;


  return (
    <>
    {isCookingMode && (
      <CookMode 
        recipeName={recipe.recipeName}
        instructions={recipe.instructions}
        onExit={() => setIsCookingMode(false)}
      />
    )}
    <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        recipe={recipe}
    />
     <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recipeName={recipe.recipeName}
    />
    <SubstituteModal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        ingredient={modalState.ingredient || ''}
        substitutes={modalState.substitutes}
        isLoading={modalState.isLoading}
        error={modalState.error}
    />
    <RemixModal
        isOpen={isRemixModalOpen}
        onClose={() => setIsRemixModalOpen(false)}
        onRemix={handleRemix}
        isLoading={isRemixing}
        error={remixError}
    />
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200/80 prose max-w-none relative dark:bg-gray-800 dark:border-gray-700/80 dark:prose-invert">
      
      {recipe.recipeImage && !isEditing && (
        <img
            src={recipe.recipeImage}
            alt={recipe.recipeName}
            className="w-full h-auto max-h-80 object-cover rounded-xl mb-6 shadow-md border border-gray-200 dark:border-gray-700"
        />
      )}

      {preRemixRecipe && !isEditing && (
            <div className="absolute top-4 left-4 z-10">
                <button onClick={handleReturnToOriginal} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                &larr; Return to Original
                </button>
            </div>
      )}
      
      {isEditing ? (
        <div className="text-center mb-6">
          <input type="text" value={recipeToShow.recipeName} onChange={e => handleEditChange('recipeName', e.target.value)} className="text-3xl font-bold text-gray-900 text-center w-full border-b-2 border-gray-200 focus:border-orange-500 outline-none !mb-2 bg-transparent dark:text-gray-100 dark:border-gray-600 dark:focus:border-orange-500"/>
          <textarea value={recipeToShow.description} onChange={e => handleEditChange('description', e.target.value)} className="text-gray-600 italic w-full border-b-2 border-gray-200 focus:border-orange-500 outline-none resize-none bg-transparent dark:text-gray-400 dark:border-gray-600 dark:focus:border-orange-500"/>
          <div className="mt-4 text-left">
              <label htmlFor="source-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source (URL or Name)</label>
              <input 
                  id="source-input"
                  type="text" 
                  value={recipeToShow.source || ''} 
                  onChange={e => handleEditChange('source', e.target.value)} 
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  placeholder="e.g., https://example.com/recipe or 'Grandma's Cookbook'"
              />
          </div>
        </div>
      ) : (
        <div className="text-center mb-6">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold text-gray-900 text-center w-full max-w-lg border-b-2 border-orange-300 focus:border-orange-500 outline-none transition bg-transparent dark:text-gray-100 dark:border-orange-600"
                    autoFocus
                    onBlur={() => handleSaveName()}
                />
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
                    Save
                </button>
              </form>
            ) : (
              <h2 className="text-3xl font-bold text-gray-900 !mb-2 dark:text-gray-100">
                {preRemixRecipe && <span className="text-purple-600 dark:text-purple-400">Remix: </span>}
                {recipe.recipeName}
              </h2>
            )}
            <p className="text-gray-600 italic dark:text-gray-400">{recipe.description}</p>
            {recipe.source && !isEditing && (
              <div className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2 dark:text-gray-400">
                <LinkIcon className="w-4 h-4" />
                <span>
                  Source:{' '}
                  <a
                    href={recipe.source.startsWith('http') ? recipe.source : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline dark:text-orange-400 break-all"
                  >
                    {recipe.source}
                  </a>
                </span>
              </div>
            )}
        </div>
      )}

      {showNameRefinement && !isEditingName && !isEditing && (
          <div className="my-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center transition-all duration-300 ease-in-out dark:bg-orange-900/30 dark:border-orange-800/50">
              <p className="font-semibold text-gray-800 dark:text-gray-200">Does this recipe title look right?</p>
              <p className="text-sm text-gray-600 mb-3 dark:text-gray-400">The AI generated this title. You can edit it for clarity.</p>
              <div className="flex justify-center gap-3">
                  <button
                      onClick={() => setShowNameRefinement(false)}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600"
                  >
                      Looks Good
                  </button>
                  <button
                      onClick={() => {
                          setShowNameRefinement(false);
                          setIsEditingName(true);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                      Edit Title
                  </button>
              </div>
          </div>
      )}
      
      {isPromptingForSource && !isEditing && (
            <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center transition-all duration-300 ease-in-out dark:bg-blue-900/30 dark:border-blue-800/50">
                <p className="font-semibold text-gray-800 dark:text-gray-200">Want to save the source?</p>
                <p className="text-sm text-gray-600 mb-3 dark:text-gray-400">Add a URL or cookbook name to find this recipe again later.</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => {
                            onDismissSourcePrompt();
                            setIsEditing(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600"
                    >
                        Add Source
                    </button>
                    <button
                        onClick={onDismissSourcePrompt}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
      )}


      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 text-center my-8 p-4 bg-orange-50/60 rounded-lg divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-orange-200/80 gap-y-4 dark:bg-gray-700/60 dark:divide-gray-600/80">
        {isEditing ? (
            <>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold dark:text-gray-400">Prep Time</p>
                    <input type="text" value={recipeToShow.prepTime} onChange={e => handleEditChange('prepTime', e.target.value)} className="text-lg font-medium text-orange-600 bg-transparent text-center w-full outline-none dark:text-orange-400"/>
                </div>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold dark:text-gray-400">Cook Time</p>
                    <input type="text" value={recipeToShow.cookTime} onChange={e => handleEditChange('cookTime', e.target.value)} className="text-lg font-medium text-orange-600 bg-transparent text-center w-full outline-none dark:text-orange-400"/>
                </div>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold dark:text-gray-400">Servings</p>
                    <input type="text" value={recipeToShow.servings} onChange={e => handleEditChange('servings', e.target.value)} className="text-lg font-medium text-orange-600 bg-transparent text-center w-full outline-none dark:text-orange-400"/>
                </div>
            </>
        ) : (
            <>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold dark:text-gray-400">Prep Time</p>
                    <p className="text-lg font-medium text-orange-600 dark:text-orange-400">{recipe.prepTime}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold dark:text-gray-400">Cook Time</p>
                    <p className="text-lg font-medium text-orange-600 dark:text-orange-400">{recipe.cookTime}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold dark:text-gray-400">Servings</p>
                    <p className="text-lg font-medium text-orange-600 dark:text-orange-400">{recipe.servings}</p>
                </div>
            </>
        )}
        {recipe.costAnalysis && (
            <div className="pt-4 sm:pt-0" title={recipe.costAnalysis.justification}>
                <p className="text-sm text-gray-500 uppercase font-semibold flex items-center justify-center gap-1 dark:text-gray-400"><DollarSignIcon className="w-4 h-4" /> Cost</p>
                <p className="text-lg font-medium text-orange-600 dark:text-orange-400">{recipe.costAnalysis.rating}</p>
            </div>
        )}
        {recipe.sustainabilityScore && (
             <div className="pt-4 sm:pt-0" title={recipe.sustainabilityScore.justification}>
                <p className="text-sm text-gray-500 uppercase font-semibold flex items-center justify-center gap-1 dark:text-gray-400"><LeafIcon className="w-4 h-4" /> Sustainability</p>
                <p className="text-lg font-medium text-orange-600 dark:text-orange-400">{recipe.sustainabilityScore.score}</p>
            </div>
        )}
      </div>

      {!isEditing && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-8 p-4 border-y border-gray-200/80 dark:border-gray-700/80">
            {/* Primary Action */}
            <button
                onClick={() => setIsCookingMode(true)}
                className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out"
            >
                <PlayIcon className="w-6 h-6" />
                <span className="text-lg">Start Cooking</span>
            </button>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2">
                 <button onClick={() => setIsRemixModalOpen(true)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-purple-600 hover:text-purple-800 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-purple-400 dark:hover:text-purple-300" title="Remix Recipe">
                    <MagicWandIcon className="w-5 h-5" />
                </button>
                <button onClick={handleToggleFavorite} className={`p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 ${recipe.isFavorite ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}`} title="Toggle Favorite">
                    <StarIcon isFilled={recipe.isFavorite} className="w-5 h-5" />
                </button>
                <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-800 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-gray-100" title="Share Recipe">
                    <ShareIcon className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditing(true)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-800 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-gray-100" title="Edit Recipe">
                  <PencilIcon className="w-5 h-5" />
                </button>
                 <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 bg-gray-100 hover:bg-red-100 rounded-full text-gray-600 hover:text-red-600 transition-colors dark:bg-gray-700 dark:hover:bg-red-900/40 dark:text-gray-300 dark:hover:text-red-400" title="Delete Recipe">
                  <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ingredients</h3>
          {isEditing && (
              <button 
                  onClick={() => handleAddListItem('ingredients')} 
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full hover:bg-orange-200 transition-colors dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900"
                  aria-label="Add new ingredient"
              >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
              </button>
          )}
        </div>
        <ul ref={ingredientsListRef} className="space-y-2 list-none p-0">
          {recipeToShow.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-center justify-between p-2 bg-orange-50/70 rounded-md group dark:bg-gray-700/50">
                {isEditing ? (
                  <div className="flex items-center w-full gap-2">
                    <input type="text" value={ingredient} onChange={e => handleIngredientChange(index, e.target.value)} className="flex-grow bg-transparent outline-none focus:ring-1 focus:ring-orange-300 rounded px-1 dark:text-gray-200" />
                    <button onClick={() => handleDeleteListItem('ingredients', index)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                        <input id={`ing-${index}`} type="checkbox" className="peer h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-3 dark:bg-gray-600 dark:border-gray-500" />
                        <label htmlFor={`ing-${index}`} className="transition-colors peer-checked:line-through peer-checked:text-gray-400 dark:text-gray-300 dark:peer-checked:text-gray-500">{ingredient}</label>
                    </div>
                    <button onClick={() => handleFindSubstitutes(ingredient)} title="Find substitutes for this ingredient" className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500 hover:text-orange-700 p-1 dark:text-orange-400 dark:hover:text-orange-300">
                        <WandIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Instructions</h3>
        </div>
        <ol ref={instructionsListRef} className="list-decimal list-inside space-y-3">
          {recipeToShow.instructions.map((instruction, index) => (
            <li key={index} className="pl-2 group dark:text-gray-300">
              {isEditing ? (
                <div className="flex items-start gap-2">
                  <textarea value={instruction.text} onChange={e => handleInstructionTextChange(index, e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 focus:ring-orange-300 rounded px-1 resize-y dark:text-gray-200" rows={2}/>
                  <button onClick={() => handleDeleteListItem('instructions', index)} className="text-red-500 hover:text-red-700 p-1 mt-1 flex-shrink-0" aria-label={`Delete instruction ${index + 1}`}>
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                instruction.text
              )}
            </li>
          ))}
        </ol>
        {isEditing && (
            <div className="mt-4">
                <button 
                    onClick={() => handleAddListItem('instructions')} 
                    className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-colors dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900"
                    aria-label="Add new instruction"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Instruction</span>
                </button>
            </div>
        )}
      </div>

      {/* MY NOTES SECTION */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <NotebookIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Notes</h3>
        </div>
        {isEditing ? (
          <textarea
            value={editedRecipe?.notes || ''}
            onChange={e => handleEditChange('notes', e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200 resize-y dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            placeholder="Add personal notes, tweaks, or results here..."
            aria-label="My Notes"
          />
        ) : (
          recipe.notes && recipe.notes.trim() ? (
            <div className="prose max-w-none prose-p:my-2 dark:prose-invert">
              <p className="text-gray-700 whitespace-pre-wrap bg-orange-50/70 p-4 rounded-lg dark:bg-gray-700/50 dark:text-gray-300">{recipe.notes}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic dark:text-gray-400">No notes yet. Click the 'Edit Recipe' button above to add some.</p>
          )
        )}
      </div>

      {isEditing ? (
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t dark:border-gray-700">
          <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleSaveChanges} className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">Save Changes</button>
        </div>
      ) : (
        <>
            {/* Nutrition Snapshot */}
            {recipe.micronutrients && (
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="flex items-center justify-center gap-2 text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
                      <HeartPulseIcon className="w-6 h-6 text-red-500" />
                      Nutrition Snapshot
                  </h3>
                  <p className="text-center text-sm text-gray-500 mb-6 -mt-2 dark:text-gray-400">Estimates per serving.</p>
                  
                  <div className="space-y-4 max-w-lg mx-auto">
                      {Object.entries(recipe.micronutrients).map(([key, value]) => (
                          <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold text-gray-700 capitalize dark:text-gray-300">{key}</span>
                                  {/* FIX: Cast `value` to `Micronutrient` to fix TypeScript error on `unknown` type. */}
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{(value as Micronutrient).amount} ({(value as Micronutrient).percentOfDV}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                                  {/* FIX: Cast `value` to `Micronutrient` to fix TypeScript error on `unknown` type. */}
                                  <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min((value as Micronutrient).percentOfDV, 100)}%` }}></div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {recipe.healthNudge && (
                      <blockquote className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-300">
                          <p className="font-semibold">Healthy Tip:</p>
                          <p className="italic">{recipe.healthNudge}</p>
                      </blockquote>
                  )}
              </div>
            )}

            {/* Mood & Energy Journal */}
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">How did this meal make you feel?</h3>
              {feedbackSubmitted ? (
                  <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg dark:bg-green-900/40 dark:text-green-300">
                      <p>Thanks for the feedback! We'll use this to make better suggestions for you.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button onClick={handleFeedback} className="flex flex-col items-center gap-2 p-3 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
                          <LightningIcon className="w-6 h-6 text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Energized</span>
                      </button>
                       <button onClick={handleFeedback} className="flex flex-col items-center gap-2 p-3 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
                          <HappyIcon className="w-6 h-6 text-green-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Satisfied</span>
                      </button>
                       <button onClick={handleFeedback} className="flex flex-col items-center gap-2 p-3 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
                          <SleepyIcon className="w-6 h-6 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sleepy</span>
                      </button>
                       <button onClick={handleFeedback} className="flex flex-col items-center gap-2 p-3 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
                          <StomachIcon className="w-6 h-6 text-purple-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Heavy</span>
                      </button>
                  </div>
              )}
            </div>
            
            <UnitConverter />
        </>
      )}
    </div>
    </>
  );
};

export default RecipeDisplay;