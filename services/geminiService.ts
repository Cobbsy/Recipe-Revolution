import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface Instruction {
  text: string;
  timerInSeconds?: number;
}

export interface Recipe {
  id: string; // Added client-side
  isFavorite: boolean; // Added client-side
  recipeImage?: string; // Base64 encoded image data URL
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: Instruction[];
  notes?: string;
  costAnalysis?: {
    rating: string; // e.g., "$", "$$", "$$$"
    justification: string;
  };
  sustainabilityScore?: {
    score: string; // e.g., "Low Impact", "Medium Impact"
    justification: string;
  };
  micronutrients?: {
    iron: { amount: string; percentOfDV: number };
    calcium: { amount: string; percentOfDV: number };
    fiber: { amount: string; percentOfDV: number };
    vitaminD: { amount: string; percentOfDV: number };
    potassium: { amount: string; percentOfDV: number };
  };
  healthNudge?: string;
}

export interface Substitute {
    name: string;
    notes: string;
}

const imagePromptTemplates = [
    `A bright and airy food photograph of: {prompt}. Natural lighting from the side, minimalist styling with fresh garnishes, shot from a 45-degree angle. Clean, light-colored background.`,
    `A dark and moody food photograph of: {prompt}. Dramatic, low-key lighting, rustic textures like dark wood and linen. Shallow depth of field to create a cozy, intimate atmosphere.`,
    `A modern, minimalist food photograph of: {prompt}. Geometric plating on a solid, neutral-colored background. Emphasizing clean lines, negative space, and the vibrant colors of the dish. Top-down flat lay perspective.`,
    `A rustic, homestyle food photograph of: {prompt}. Presented in a cozy, lived-in setting on a wooden table. Gentle, warm light. Focus on comfort, authenticity, and delicious imperfections.`,
    `A vibrant and bold food photograph of: {prompt}. Dynamic composition with colorful ingredients artfully scattered. Strong, direct light to make the colors pop. Playful, energetic, and appetizing.`,
    `An extreme close-up macro food photograph of: {prompt}. Highlighting the delicious textures, glazes, and details of the dish. Appetizing and detailed shot that makes you want to take a bite.`
];

const generateImage = async (prompt: string): Promise<string | undefined> => {
    try {
        // Randomly select a prompt template to introduce variety
        const selectedTemplate = imagePromptTemplates[Math.floor(Math.random() * imagePromptTemplates.length)];
        const finalPrompt = selectedTemplate.replace('{prompt}', prompt);

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return undefined;
    } catch (error) {
        console.error("Image generation failed:", error);
        return undefined; // Fail gracefully, don't block the recipe.
    }
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING, description: 'The title of the recipe.' },
        description: { type: Type.STRING, description: 'A brief, engaging description of the dish.' },
        prepTime: { type: Type.STRING, description: 'Estimated preparation time, e.g., "15 minutes".' },
        cookTime: { type: Type.STRING, description: 'Estimated cooking time, e.g., "30 minutes".' },
        servings: { type: Type.STRING, description: 'How many people the recipe serves, e.g., "4 servings".' },
        ingredients: {
            type: Type.ARRAY,
            description: 'A list of all ingredients with their quantities.',
            items: { type: Type.STRING }
        },
        instructions: {
            type: Type.ARRAY,
            description: 'A step-by-step list of cooking instructions. For each step, detect if a duration is mentioned (e.g., "for 10 minutes", "for 1 hour"). If so, include a `timerInSeconds` field with the total duration in seconds. Otherwise, omit it.',
            items: { 
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'The text of the instruction step.'},
                    timerInSeconds: { type: Type.INTEGER, description: 'The duration mentioned in the step, converted to seconds. Omit if no duration is found.'}
                },
                required: ['text']
            }
        },
        notes: {
            type: Type.STRING,
            description: 'User-added personal notes or modifications for the recipe. This should be an empty string unless the user provides specific notes to include.'
        },
        costAnalysis: {
            type: Type.OBJECT,
            description: 'An analysis of the estimated cost of the meal.',
            properties: {
                rating: { type: Type.STRING, description: 'A simple cost rating: "$" for inexpensive, "$$" for moderate, or "$$$" for expensive.'},
                justification: { type: Type.STRING, description: 'A brief sentence explaining the cost rating.'}
            }
        },
        sustainabilityScore: {
            type: Type.OBJECT,
            description: 'An analysis of the environmental sustainability of the meal.',
            properties: {
                score: { type: Type.STRING, description: 'A score, e.g., "Low Impact", "Medium Impact", "High Impact".'},
                justification: { type: Type.STRING, description: 'A brief sentence explaining the sustainability score, considering ingredients like meat, dairy, and seasonality.'}
            }
        },
        micronutrients: {
            type: Type.OBJECT,
            description: 'An estimated snapshot of key micronutrients per serving for Iron, Calcium, Fiber, Vitamin D, and Potassium.',
            properties: {
                iron: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.STRING, description: 'Estimated amount, e.g., "5mg"' },
                        percentOfDV: { type: Type.INTEGER, description: 'Estimated percentage of Daily Value, e.g., 28 for 28%.' }
                    }
                },
                calcium: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.STRING, description: 'Estimated amount, e.g., "130mg"' },
                        percentOfDV: { type: Type.INTEGER, description: 'Estimated percentage of Daily Value, e.g., 10 for 10%.' }
                    }
                },
                fiber: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.STRING, description: 'Estimated amount, e.g., "7g"' },
                        percentOfDV: { type: Type.INTEGER, description: 'Estimated percentage of Daily Value, e.g., 25 for 25%.' }
                    }
                },
                vitaminD: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.STRING, description: 'Estimated amount, e.g., "2mcg"' },
                        percentOfDV: { type: Type.INTEGER, description: 'Estimated percentage of Daily Value, e.g., 10 for 10%.' }
                    }
                },
                potassium: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.STRING, description: 'Estimated amount, e.g., "470mg"' },
                        percentOfDV: { type: Type.INTEGER, description: 'Estimated percentage of Daily Value, e.g., 10 for 10%.' }
                    }
                }
            }
        },
        healthNudge: { type: Type.STRING, description: 'A friendly, actionable health tip related to the recipe\'s nutritional profile. For example, "This dish is high in fiber, great for digestion!" or "To boost iron absorption, add a squeeze of lemon juice."' }
    },
    required: ['recipeName', 'ingredients', 'instructions', 'description', 'prepTime', 'cookTime', 'servings']
};

const substitutesSchema = {
    type: Type.OBJECT,
    properties: {
        substitutes: {
            type: Type.ARRAY,
            description: 'A list of 3-4 suitable ingredient substitutes.',
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the substitute ingredient." },
                    notes: { type: Type.STRING, description: "How to use this substitute, including quantity and flavor profile changes." }
                },
                required: ['name', 'notes']
            }
        }
    },
    required: ['substitutes']
};


export const extractRecipe = async (recipeText: string): Promise<Omit<Recipe, 'id' | 'isFavorite'>> => {
  if (!recipeText.trim()) {
    throw new Error("Recipe text cannot be empty.");
  }
  
  const prompt = `You are an expert recipe parsing AI. A user has provided the text of a recipe. Your task is to extract the key information and return it as a structured JSON object. 
  
For each instruction step, if a duration is mentioned (e.g., 'simmer for 10 minutes', 'bake for 1 hour'), extract that time and provide it in a 'timerInSeconds' field, converted to the total number of seconds.

In addition to the basic recipe details, provide:
1. 'costAnalysis': A rating ('$', '$$', or '$$$') and justification.
2. 'sustainabilityScore': A score ('Low Impact', 'Medium Impact', 'High Impact') and justification.
3. 'micronutrients': An estimated snapshot per serving for Iron, Calcium, Fiber, Vitamin D, and Potassium. Provide the amount (e.g., "5mg") and the percentage of Daily Value as an integer (e.g., 28 for 28%).
4. 'healthNudge': A friendly, actionable health tip related to the nutritional profile.

If some information like prepTime, cookTime or servings is not available, provide a sensible default like "N/A".

Here is the recipe text:
---
${recipeText}`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        }
    });
    
    const jsonText = response.text;
    const recipeData: Omit<Recipe, 'id' | 'isFavorite' | 'recipeImage'> = JSON.parse(jsonText);

    let finalRecipeData: Omit<Recipe, 'id' | 'isFavorite'>;

    if (recipeData.recipeName) {
        const recipeImage = await generateImage(recipeData.recipeName);
        finalRecipeData = { ...recipeData, recipeImage };
    } else {
        finalRecipeData = recipeData;
    }
    
    return finalRecipeData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to extract recipe from AI. Please check the console for more details.");
  }
};

export const generateRecipeFromTitle = async (title: string): Promise<Omit<Recipe, 'id' | 'isFavorite'>> => {
    if (!title.trim()) {
      throw new Error("Recipe title cannot be empty.");
    }
    
    const prompt = `You are an expert chef and recipe writer AI. A user has provided the title of a dish: "${title}".
    
  Your task is to generate a complete and delicious recipe for it. The recipe should be easy to follow. Return it as a structured JSON object. 
  
  In addition to the basic recipe details, provide:
  1. 'costAnalysis': A rating ('$', '$$', or '$$$') and justification.
  2. 'sustainabilityScore': A score ('Low Impact', 'Medium Impact', 'High Impact') and justification.
  3. 'micronutrients': An estimated snapshot per serving for Iron, Calcium, Fiber, Vitamin D, and Potassium.
  4. 'healthNudge': A friendly, actionable health tip.
  
  Make the recipeName field the same as the provided title.`;
  
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: recipeSchema,
          }
      });
      
      const jsonText = response.text;
      const recipeData: Omit<Recipe, 'id' | 'isFavorite' | 'recipeImage'> = JSON.parse(jsonText);
  
      const recipeImage = await generateImage(recipeData.recipeName);
      
      return { ...recipeData, recipeImage };
  
    } catch (error) {
      console.error("Error calling Gemini API for generation:", error);
      throw new Error("Failed to generate recipe from AI. Please try a different title.");
    }
  };

export const extractRecipeFromImage = async (imageData: { data: string; mimeType: string }): Promise<Omit<Recipe, 'id' | 'isFavorite'>> => {
  const imagePart = {
    inlineData: {
      mimeType: imageData.mimeType,
      data: imageData.data,
    },
  };

  const textPart = {
    text: `You are an expert recipe parsing AI. A user has provided an image of a recipe. Your task is to extract the key information and return it as a structured JSON object.

For each instruction step, if a duration is mentioned (e.g., 'simmer for 10 minutes', 'bake for 1 hour'), extract that time and provide it in a 'timerInSeconds' field, converted to the total number of seconds.
    
In addition to the basic recipe details, provide:
1. 'costAnalysis': A rating ('$', '$$', or '$$$') and justification.
2. 'sustainabilityScore': A score ('Low Impact', 'Medium Impact', 'High Impact') and justification.
3. 'micronutrients': An estimated snapshot per serving for Iron, Calcium, Fiber, Vitamin D, and Potassium. Provide the amount (e.g., "5mg") and the percentage of Daily Value as an integer (e.g., 28 for 28%).
4. 'healthNudge': A friendly, actionable health tip related to the nutritional profile.

If some information like prepTime, cookTime or servings is not available, provide a sensible default like "N/A".`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });

    const jsonText = response.text;
    const recipeData: Omit<Recipe, 'id' | 'isFavorite' | 'recipeImage'> = JSON.parse(jsonText);
    const recipeImage = `data:${imageData.mimeType};base64,${imageData.data}`;
    return { ...recipeData, recipeImage };
  } catch (error) {
    console.error("Error calling Gemini API with image:", error);
    throw new Error("Failed to extract recipe from image. The AI may not have been able to read the text.");
  }
};

export const findSubstitutes = async (ingredient: string, recipeContext: Recipe): Promise<Substitute[]> => {
    const prompt = `You are a culinary assistant AI. A user needs substitutes for an ingredient in their recipe. Provide 3-4 creative and practical alternatives. For each substitute, briefly explain how to use it (e.g., quantity, preparation, flavor impact).

Recipe: "${recipeContext.recipeName}"
Ingredient to Substitute: "${ingredient}"
Other ingredients in the recipe: ${recipeContext.ingredients.join(', ')}

Return the response as a JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: substitutesSchema,
            }
        });
        
        const jsonText = response.text;
        const result: { substitutes: Substitute[] } = JSON.parse(jsonText);
        return result.substitutes;

    } catch (error) {
        console.error("Error finding substitutes with Gemini API:", error);
        throw new Error("The AI could not find substitutes for this ingredient.");
    }
};

export const remixRecipe = async (originalRecipe: Recipe, remixPrompt: string): Promise<Omit<Recipe, 'id' | 'isFavorite'>> => {
  const prompt = `You are an expert culinary AI that modifies recipes. A user wants to change an existing recipe based on their request.
Your task is to apply the user's requested change and return the *entire modified recipe* as a single, valid JSON object that conforms to the provided schema.

It is crucial that you return the full recipe object, not just the changes or a summary.
- If a field is not affected by the change (like 'prepTime' for a simple ingredient swap), return its original value.
- If a field is affected (like 'recipeName', 'description', 'ingredients', or 'instructions' for a vegetarian conversion), update it accordingly.
- The 'recipeName' should reflect the change, for example "Vegetarian Chili" instead of "Beef Chili".

User's Request: "${remixPrompt}"

Original Recipe JSON to modify:
---
${JSON.stringify({ ...originalRecipe, id: undefined, isFavorite: undefined }, null, 2)}
---
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        }
    });
    
    const jsonText = response.text;
    const recipeData: Omit<Recipe, 'id' | 'isFavorite' | 'recipeImage'> = JSON.parse(jsonText);
    const recipeImage = await generateImage(recipeData.recipeName);
    return { ...recipeData, recipeImage };

  } catch (error) {
    console.error("Error calling Gemini API for remix:", error);
    throw new Error("The AI failed to remix the recipe. Please try a different request.");
  }
};

const conversionSchema = {
    type: Type.OBJECT,
    properties: {
        convertedValue: { 
            type: Type.NUMBER, 
            description: 'The numerical result of the unit conversion. For example, if converting 1 cup to grams, this would be a number like 128.' 
        }
    },
    required: ['convertedValue']
};

export const convertUnits = async (value: number, fromUnit: string, toUnit: string): Promise<number> => {
    const prompt = `You are a precise unit conversion tool for cooking. Convert ${value} ${fromUnit} to ${toUnit}. 
    
Return only the numerical value of the result. Do not include units or any other text in the response. For example, if the result is "250 grams", return only the number 250.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: conversionSchema,
                temperature: 0 // We need a deterministic result
            }
        });

        const jsonText = response.text;
        const result: { convertedValue: number } = JSON.parse(jsonText);
        
        if (typeof result.convertedValue !== 'number') {
            throw new Error('AI returned an invalid numerical format.');
        }

        return result.convertedValue;
    } catch (error) {
        console.error("Error converting units with Gemini API:", error);
        throw new Error(`The AI could not perform the conversion from ${fromUnit} to ${toUnit}.`);
    }
};