import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getCarAdvice(prompt: string, inventory: any[]) {
  const inventoryContext = inventory.map(c => `${c.make} ${c.model} (${c.year}) - $${c.price}`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a helpful car expert at AutoMarket Pro. 
    Our current inventory includes: ${inventoryContext}.
    
    User asks: ${prompt}
    
    Provide a concise, professional, and helpful response. If recommending a car from our inventory, highlight why it fits their needs.`,
  });

  return response.text;
}

export async function estimateCarValue(carDetails: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a car valuation expert. Based on these details: ${carDetails}, 
    provide a fair market value estimate (range) and 3 tips to increase the resale value. 
    Be professional and realistic.`,
  });

  return response.text;
}
