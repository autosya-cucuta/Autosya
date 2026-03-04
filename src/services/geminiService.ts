import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    // Try Vite environment variable first
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey) return viteKey;
    
    // Fallback to process.env (for server-side or specific build setups)
    return process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return process.env.GEMINI_API_KEY || "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function getCarAdvice(prompt: string, inventory: any[]) {
  const inventoryContext = inventory.map(c => `${c.make} ${c.model} (${c.year}) - $${c.price}`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Eres un experto asesor de carros en Autosya, ubicado en Cúcuta, Colombia. 
    Nuestro inventario actual incluye: ${inventoryContext}.
    
    El usuario pregunta: ${prompt}
    
    Proporciona una respuesta concisa, profesional y útil en español. Si recomiendas un carro de nuestro inventario, resalta por qué se ajusta a sus necesidades.`,
  });

  return response.text;
}

export async function estimateCarValue(carDetails: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Eres un experto en valoración de carros. Basado en estos detalles: ${carDetails}, 
    proporciona una estimación del valor justo de mercado (rango) en pesos colombianos o dólares según sea apropiado para el mercado de Cúcuta, y 3 consejos para aumentar el valor de reventa. 
    Sé profesional, realista y responde en español.`,
  });

  return response.text;
}
