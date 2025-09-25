import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, MealPlan } from '../App';

// Initialize the Gemini client as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define data structures returned by the Gemini API
export interface Instruction {
  text: string;
  timerInSeconds?: number;
}

export interface Substitute {
  name: string;
  notes: string;
}

export interface Micronutrient {
    amount: string;
    percentOfDV: number;
}

export interface PantryReadyRecipe {
    recipeId: string;
    recipeName: string;
}

export interface PantryNearlyRecipe {
    recipeId: string;
    recipeName: string;
    missingIngredients: string[];
}

export interface PantryAnalysisResult {
    readyToCook: PantryReadyRecipe[];
    nearlyThere: PantryNearlyRecipe[];
}

export interface AIGeneratedRecipeSuggestion {
    recipeName: string;
    description: string;
    requiredPantryIngredients: string[];
    optionalExtraIngredients: string[];
}

export interface ShoppingListCategory {
    category: string;
    items: string[];
}

export interface SkillChallenge {
    skillName: string;
    description: string;
    suggestedRecipeTitle: string;
}

export interface CuisineTour {
    cuisineName: string;
    description: string;
    suggestedFirstRecipeTitle: string;
}

export interface Journey {
    flavorProfile: string;
    skillChallenge: SkillChallenge;
    cuisineTour: CuisineTour;
}


export type PartialRecipe = Omit<Recipe, 'id' | 'isFavorite'>;


// Define the JSON schema for recipe parsing, to be used in Gemini API calls
const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING, description: "The name of the recipe." },
        description: { type: Type.STRING, description: "A short, enticing description of the dish." },
        prepTime: { type: Type.STRING, description: "e.g., '15 minutes'" },
        cookTime: { type: Type.STRING, description: "e.g., '25 minutes'" },
        servings: { type: Type.STRING, description: "e.g., '4 servings'" },
        source: { type: Type.STRING, description: "If a source URL or publication name (like a blog or cookbook) is present in the text, extract it here. Optional." },
        cuisine: { type: Type.STRING, description: "The primary cuisine of the recipe, e.g., 'Italian', 'Mexican', 'Japanese'." },
        dietaryRestrictions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of applicable dietary classifications, e.g., 'Vegetarian', 'Gluten-Free', 'Vegan', 'Dairy-Free'. Provide only if clearly applicable."
        },
        ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of all ingredients with quantities."
        },
        instructions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "A single step of the recipe instructions." },
                    timerInSeconds: { type: Type.INTEGER, description: "If this step involves a timer, specify the duration in seconds. Optional." }
                },
                required: ["text"]
            },
            description: "Step-by-step instructions."
        },
        notes: { type: Type.STRING, description: "Optional notes about the recipe, like tips or variations." },
        costAnalysis: {
            type: Type.OBJECT,
            properties: {
                rating: { type: Type.STRING, description: "A cost rating like 'Budget-friendly', 'Moderate', or 'Splurge'." },
                justification: { type: Type.STRING, description: "A brief justification for the cost rating." }
            }
        },
        sustainabilityScore: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.STRING, description: "A sustainability score, e.g., 'High', 'Medium', 'Low'." },
                justification: { type: Type.STRING, description: "A brief justification for the sustainability score." }
            }
        },
        micronutrients: {
            type: Type.OBJECT,
            description: "An estimated breakdown of key micronutrients per serving for calories, protein, carbohydrates, and fat.",
            properties: {
                calories: { type: Type.OBJECT, properties: { amount: { type: Type.STRING }, percentOfDV: { type: Type.NUMBER } } },
                protein: { type: Type.OBJECT, properties: { amount: { type: Type.STRING }, percentOfDV: { type: Type.NUMBER } } },
                carbohydrates: { type: Type.OBJECT, properties: { amount: { type: Type.STRING }, percentOfDV: { type: Type.NUMBER } } },
                fat: { type: Type.OBJECT, properties: { amount: { type: Type.STRING }, percentOfDV: { type: Type.NUMBER } } },
            },
        },
        healthNudge: { type: Type.STRING, description: "A short tip on how to make the dish even healthier." }
    },
    required: ["recipeName", "description", "prepTime", "cookTime", "servings", "ingredients", "instructions"],
};

async function parseRecipe(prompt: string, imagePart?: any): Promise<PartialRecipe> {
    const contents = imagePart ? { parts: [imagePart, { text: prompt }] } : prompt;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as PartialRecipe;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonText);
        throw new Error("The recipe format returned by the AI was invalid. Please try again.");
    }
}

export async function generateAndAttachRecipeImage(recipeData: PartialRecipe): Promise<PartialRecipe> {
    if (!recipeData.recipeName) {
        return recipeData; // Cannot generate image without a name
    }
    
    try {
        const imagePrompt = `A high-quality, delicious-looking photo of "${recipeData.recipeName}". Professional food photography, appetizing, vibrant colors.`;
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
            recipeData.recipeImage = `data:image/jpeg;base64,${base64ImageBytes}`;
        }
    } catch (e) {
        console.error("Failed to generate recipe image:", e);
        // Proceed without an image if generation fails. This is not a critical error.
    }
    
    return recipeData;
}


export const clipRecipeFromText = async (text: string): Promise<PartialRecipe> => {
    const prompt = `
        You are a master chef's assistant. Analyze the following recipe text and extract the details into a structured JSON format.
        Pay close attention to parsing ingredients and instructions accurately.
        If a source URL or publication name is mentioned, extract it for the 'source' field.
        Infer the cuisine and any applicable dietary restrictions (like Vegetarian, Gluten-Free, etc.).
        For instructions, if you see a specific time mentioned (e.g., "bake for 25 minutes"), include it in the 'timerInSeconds' field.
        Also provide a cost analysis, sustainability score, a brief micronutrient breakdown, and a health nudge.
        
        Recipe Text:
        ---
        ${text}
        ---
    `;
    const recipeData = await parseRecipe(prompt);
    return generateAndAttachRecipeImage(recipeData);
};

export const clipRecipeFromTitle = async (title: string): Promise<PartialRecipe> => {
    const prompt = `
        You are a master recipe creator. Generate a complete, high-quality recipe for the following dish title: "${title}".
        Provide the details in a structured JSON format. Include a description, prep/cook times, servings, ingredients, and step-by-step instructions.
        Determine the cuisine and any applicable dietary restrictions for the recipe you create.
        For instructions, if a step involves a timer, specify the duration in seconds.
        Also provide a cost analysis, sustainability score, a brief micronutrient breakdown, and a health nudge.
    `;
    const recipeData = await parseRecipe(prompt);
    return generateAndAttachRecipeImage(recipeData);
};

export const clipRecipeFromImage = async (image: { data: string; mimeType: string }): Promise<PartialRecipe> => {
    const imagePart = {
        inlineData: {
            mimeType: image.mimeType,
            data: image.data,
        },
    };

    const prompt = `
        You are a culinary expert who can identify dishes from images. Analyze the image of this dish and generate a plausible recipe for it.
        Provide the details in a structured JSON format. Infer a likely recipe name. Include a description, prep/cook times, servings, ingredients, and step-by-step instructions.
        From the generated recipe, determine the cuisine and any applicable dietary restrictions.
        For instructions, if a step involves a timer, specify the duration in seconds.
        Also provide a cost analysis, sustainability score, a brief micronutrient breakdown, and a health nudge.
    `;
    return parseRecipe(prompt, imagePart);
};


export const findSubstitutes = async (ingredient: string, recipe: Recipe): Promise<Substitute[]> => {
    const prompt = `
        Given the recipe for "${recipe.recipeName}", what are some good substitutes for the ingredient "${ingredient}"?
        Provide 2-3 creative and practical options. For each substitute, explain any adjustments needed for the recipe.
        Return the result as a JSON array of objects, where each object has "name" and "notes".
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        notes: { type: Type.STRING }
                    },
                    required: ["name", "notes"]
                }
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const remixRecipe = async (recipe: Recipe, remixPrompt: string): Promise<PartialRecipe> => {
    const originalRecipeJson = JSON.stringify({
        recipeName: recipe.recipeName,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions.map(i => i.text),
    });

    const prompt = `
        You are a creative chef. Take the following recipe and "remix" it based on my request.
        
        Original Recipe:
        ---
        ${originalRecipeJson}
        ---

        Remix Request: "${remixPrompt}"

        Generate a new, complete recipe based on this request. The output must be in the same structured JSON format as the original recipe parser.
        Update all relevant fields: name (e.g., "Vegetarian ${recipe.recipeName}"), description, ingredients, instructions, times, cuisine, dietary restrictions, etc.
        Also, generate a new cost analysis, sustainability score, micronutrient breakdown, and health nudge for the remixed version.
    `;
    
    return parseRecipe(prompt);
};


export const convertUnits = async (value: number, fromUnit: string, toUnit: string): Promise<number> => {
    const prompt = `Convert ${value} ${fromUnit} to ${toUnit}. Only return the numerical value.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    const resultText = response.text.trim();
    const numericResult = parseFloat(resultText);

    if (isNaN(numericResult)) {
        throw new Error("Could not convert units. AI returned a non-numeric response.");
    }

    return numericResult;
};

const pantryAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        readyToCook: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    recipeId: { type: Type.STRING },
                    recipeName: { type: Type.STRING },
                },
                required: ["recipeId", "recipeName"]
            }
        },
        nearlyThere: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    recipeId: { type: Type.STRING },
                    recipeName: { type: Type.STRING },
                    missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["recipeId", "recipeName", "missingIngredients"]
            }
        }
    },
    required: ["readyToCook", "nearlyThere"]
};

export const findRecipesFromPantry = async (pantryItems: string[], recipes: Recipe[]): Promise<PantryAnalysisResult> => {
    if (pantryItems.length === 0) {
        throw new Error("Your pantry is empty. Add some ingredients first!");
    }
    if (recipes.length === 0) {
        throw new Error("You don't have any saved recipes to analyze.");
    }

    const simplifiedRecipes = recipes.map(r => ({
        id: r.id,
        name: r.recipeName,
        ingredients: r.ingredients
    }));

    const prompt = `
        You are a smart kitchen assistant. I will provide you with a list of ingredients in my pantry and a list of my saved recipes.
        Your task is to analyze them and tell me what I can make.

        My Pantry Ingredients:
        ---
        ${pantryItems.join(', ')}
        ---

        My Saved Recipes:
        ---
        ${JSON.stringify(simplifiedRecipes)}
        ---

        Analyze the recipes against my pantry and categorize them into two lists:
        1.  "readyToCook": Recipes for which I have ALL the necessary ingredients.
        2.  "nearlyThere": Recipes for which I am missing only a few (e.g., 1-3) ingredients. For these, list exactly what I'm missing.

        Be smart about matching ingredients. For example, 'flour' in my pantry should match 'all-purpose flour' in a recipe. Consider basic staples like salt, pepper, and water to be always available and do not list them as missing.
        
        Return your analysis in the specified JSON format. Ensure every recipe you return includes its original 'recipeId'. Do not include recipes that I am missing many ingredients for.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: pantryAnalysisSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as PantryAnalysisResult;
    } catch (e) {
        console.error("Failed to parse pantry analysis JSON:", jsonText);
        throw new Error("The analysis from the AI was in an invalid format. Please try again.");
    }
};

const aiSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            recipeName: { type: Type.STRING },
            description: { type: Type.STRING },
            requiredPantryIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            optionalExtraIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        required: ["recipeName", "description", "requiredPantryIngredients", "optionalExtraIngredients"]
    }
};

export const getSuggestionsFromPantry = async (pantryItems: string[]): Promise<AIGeneratedRecipeSuggestion[]> => {
    if (pantryItems.length === 0) {
        throw new Error("Your pantry is empty. Add some ingredients first!");
    }

    const prompt = `
        You are a creative chef, known as "The Chef". Given the following list of ingredients in a user's pantry, generate 2-3 simple and delicious recipe ideas.
        Be creative and don't be afraid to suggest recipes that might require one or two common extra ingredients, but the core of the recipe should be based on what's available.
        For each recipe suggestion, provide a name, a short enticing description, a list of the pantry ingredients required, and a list of optional extra ingredients to enhance the dish.
        
        Pantry Ingredients:
        ---
        ${pantryItems.join(', ')}
        ---

        Respond in the specified JSON format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: aiSuggestionSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as AIGeneratedRecipeSuggestion[];
    } catch (e) {
        console.error("Failed to parse AI suggestion JSON:", jsonText);
        throw new Error("The suggestions from The Chef were in an invalid format. Please try again.");
    }
};


const shoppingListSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            category: { type: Type.STRING, description: "The grocery store category, e.g., 'Produce'." },
            items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The list of consolidated ingredients for this category."
            }
        },
        required: ['category', 'items']
    }
};

export const generateShoppingList = async (recipes: Recipe[]): Promise<ShoppingListCategory[]> => {
    if (recipes.length === 0) {
        throw new Error("Your meal plan is empty. Add some recipes to your week first!");
    }
    
    const allIngredients = recipes.flatMap(r => r.ingredients);

    const prompt = `
        You are an expert grocery list creator. I will provide a list of ingredients from several recipes.
        Your task is to consolidate this list, combine quantities for the same ingredient, and categorize them by grocery store aisle.

        For example, if the list contains '1 cup flour', '2 cups all-purpose flour', and '1 tsp salt', you should combine the flours into '3 cups flour' and likely exclude the salt.

        Important Rules:
        1. Consolidate intelligently: '1 onion' and '1/2 onion' should become '2 onions' (rounding up). '2 cloves garlic' and '3 cloves garlic' becomes '5 cloves garlic'.
        2. Exclude basic staples: Do not include common household items like salt, black pepper, water, and common cooking oils (like olive or vegetable oil) unless specified in very large quantities.
        3. Categorize clearly: Group the final list into these specific categories: 'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Pantry Staples', 'Frozen Foods', 'Spices & Seasonings', 'Beverages', and 'Miscellaneous'.

        Here is the raw list of ingredients to process:
        ---
        ${allIngredients.join('\n')}
        ---

        Return the result as a JSON array of objects, where each object has a "category" and an array of "items".
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: shoppingListSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText) as ShoppingListCategory[];
        // Filter out any empty categories that the AI might return
        return result.filter(category => category.items && category.items.length > 0);
    } catch (e) {
        console.error("Failed to parse shopping list JSON:", jsonText);
        throw new Error("The shopping list from the AI was in an invalid format. Please try again.");
    }
};

const journeySchema = {
    type: Type.OBJECT,
    properties: {
        flavorProfile: {
            type: Type.STRING,
            description: "A 2-3 sentence summary of the user's cooking style, taste preferences, and common cuisines, based on their saved recipes."
        },
        skillChallenge: {
            type: Type.OBJECT,
            properties: {
                skillName: { type: Type.STRING, description: "The name of a new cooking skill or technique to learn (e.g., 'Braising')." },
                description: { type: Type.STRING, description: "A brief, encouraging description of the skill and why the user might like it." },
                suggestedRecipeTitle: { type: Type.STRING, description: "The title of a specific, approachable recipe that teaches this skill." }
            },
            required: ["skillName", "description", "suggestedRecipeTitle"]
        },
        cuisineTour: {
            type: Type.OBJECT,
            properties: {
                cuisineName: { type: Type.STRING, description: "The name of a cuisine the user might enjoy exploring (e.g., 'Thai Cuisine')." },
                description: { type: Type.STRING, description: "A brief, exciting description of the cuisine and its key flavors." },
                suggestedFirstRecipeTitle: { type: Type.STRING, description: "The title of a good introductory recipe for this cuisine." }
            },
            required: ["cuisineName", "description", "suggestedFirstRecipeTitle"]
        }
    },
    required: ["flavorProfile", "skillChallenge", "cuisineTour"]
};

export const generateCulinaryJourney = async (recipes: Recipe[]): Promise<Journey> => {
    if (recipes.length < 3) {
        throw new Error("You need at least 3 saved recipes to generate a Culinary Journey. Clip a few more and try again!");
    }

    const simplifiedRecipes = recipes.map(r => ({
        name: r.recipeName,
        description: r.description,
        // ingredients: r.ingredients - maybe too much token usage
    }));

    const prompt = `
        You are an AI-powered cooking coach. I will provide you with a list of recipes a user has saved.
        Your task is to analyze these recipes and create a personalized "Culinary Journey" to help them grow as a cook.

        My Saved Recipes:
        ---
        ${JSON.stringify(simplifiedRecipes)}
        ---

        Based on this list, please perform the following analysis and return it in the specified JSON format:

        1.  **Flavor Profile**: Write a short, insightful summary of the user's apparent cooking style. What cuisines do they favor (e.g., Italian, Mexican)? What flavor profiles (e.g., spicy, savory, comfort food)?
        
        2.  **Skill Challenge**: Based on the complexity of their saved recipes, identify a new cooking technique they could learn next. This should be a logical next step. For example, if they make a lot of pan-fried dishes, suggest 'braising'. If they make simple cakes, suggest 'making macarons'. Provide an encouraging description and suggest a specific, classic recipe title that would be a great way to practice this new skill.

        3.  **Cuisine Tour**: Suggest a new cuisine for them to explore that might align with their existing tastes but still be a new adventure. For example, if they like Mexican food, you might suggest Peruvian cuisine. Give an exciting description of the cuisine and suggest a classic, approachable first recipe for them to try.

        Ensure the output is creative, encouraging, and actionable.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: journeySchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as Journey;
    } catch (e) {
        console.error("Failed to parse journey JSON:", jsonText);
        throw new Error("The culinary journey from the AI was in an invalid format. Please try again.");
    }
};

const mealPlanSchema = {
    type: Type.OBJECT,
    properties: {
        Sunday: { type: Type.ARRAY, items: { type: Type.STRING } },
        Monday: { type: Type.ARRAY, items: { type: Type.STRING } },
        Tuesday: { type: Type.ARRAY, items: { type: Type.STRING } },
        Wednesday: { type: Type.ARRAY, items: { type: Type.STRING } },
        Thursday: { type: Type.ARRAY, items: { type: Type.STRING } },
        Friday: { type: Type.ARRAY, items: { type: Type.STRING } },
        Saturday: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    description: "An object where keys are days of the week and values are arrays of recipe IDs."
};


export const generateMealPlanFromSavedRecipes = async (goal: string, usePantry: boolean, numDays: number, pantryItems: string[], recipes: Recipe[]): Promise<MealPlan> => {
    if (recipes.length < numDays) {
        throw new Error(`You need at least ${numDays} saved recipes to generate a plan. Clip a few more and try again!`);
    }

    const simplifiedRecipes = recipes.map(r => ({
        id: r.id,
        name: r.recipeName,
        description: r.description,
        ingredients: r.ingredients,
        cuisine: r.cuisine,
        dietaryRestrictions: r.dietaryRestrictions
    }));

    const pantryPrompt = usePantry ? `Prioritize using recipes that incorporate these pantry items: ${pantryItems.join(', ')}.` : '';

    const prompt = `
        You are an expert meal planner. Your task is to create a diverse and delicious meal plan for a user based on their goals and their saved recipes.

        User's Goal: "${goal}"
        Number of Days to Plan: ${numDays}
        
        Available Recipes:
        ---
        ${JSON.stringify(simplifiedRecipes)}
        ---
        
        Pantry Items:
        ---
        ${usePantry ? pantryItems.join(', ') : 'Not provided'}
        ---

        Instructions:
        1. Select exactly ${numDays} unique recipes from the available list that best fit the user's goal.
        2. Create a varied plan. Do not use the same recipe twice. Try to vary the cuisines if possible.
        3. ${pantryPrompt}
        4. Assign one recipe per day, starting with Monday and proceeding for ${numDays} days.
        5. Return the result as a JSON object where the keys are the days of the week (e.g., "Monday", "Tuesday") and the value for each day is an array containing a single recipe ID string. Only include keys for the number of days requested.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mealPlanSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        const plan = JSON.parse(jsonText) as MealPlan;
        // Ensure the plan is not empty and contains valid recipe IDs
        const validIds = new Set(recipes.map(r => r.id));
        for (const day in plan) {
            plan[day] = plan[day].filter(id => validIds.has(id));
            if (plan[day].length === 0) {
                delete plan[day];
            }
        }
        if (Object.keys(plan).length === 0) {
            throw new Error("The AI couldn't create a valid plan with the available recipes.");
        }
        return plan;
    } catch (e) {
        console.error("Failed to parse meal plan JSON:", jsonText, e);
        throw new Error("The meal plan from the AI was in an invalid format. Please try again.");
    }
};

export const generateMealPlanWithNewRecipes = async (goal: string, numDays: number): Promise<PartialRecipe[]> => {
    const prompt = `
        You are a creative recipe developer. A user wants a meal plan with brand new recipe ideas.
        
        User's Goal: "${goal}"
        Number of Recipes to Generate: ${numDays}

        Instructions:
        1.  Create ${numDays} unique and delicious recipes that fit the user's goal.
        2.  For each recipe, generate all the necessary details: name, description, prep time, cook time, servings, ingredients, step-by-step instructions, cuisine, dietary info, cost/sustainability analysis, nutrition estimates, and a health nudge.
        3.  Ensure the recipes are diverse and interesting.
        4.  The output must be a JSON array, where each element is a complete recipe object conforming to the provided schema.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: recipeSchema,
            },
        },
    });

    const jsonText = response.text.trim();
    try {
        const recipes = JSON.parse(jsonText) as PartialRecipe[];
        if (!Array.isArray(recipes) || recipes.length === 0) {
            throw new Error("AI did not return a valid array of recipes.");
        }
        return recipes;
    } catch (e) {
        console.error("Failed to parse new recipes JSON:", jsonText, e);
        throw new Error("The new recipes from the AI were in an invalid format. Please try again.");
    }
};