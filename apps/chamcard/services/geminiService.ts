
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTransportAdvice = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `أنت "شام"، المساعد الذكي لتطبيق "بطاقة الشام".
        قواعدك:
        1. الإجابة باللهجة الشامية البيضاء المحببة.
        2. كن مختصراً جداً (أقل من سطرين).
        3. أنت خبير في كل شوارع وأحياء سوريا (دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، إلخ).`,
      },
    });
    return response.text || "عيوني، ما فهمت عليك. ممكن تعيد؟";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "في مشكلة بالاتصال، جرب كمان شوي.";
  }
};

export const getPlaceSuggestions = async (query: string) => {
  if (!query || query.length < 2) return [];
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `المستخدم يبحث عن مكان في سوريا: "${query}". اقترح 5 أماكن حقيقية دقيقة (أحياء، شوارع، أو معالم).
      مثال للبحث عن 'برامكة': ساحة البرامكة، جامعة دمشق - البرامكة، شارع الحلبوني، إلخ.
      التنسيق: اسم المكان فقط، مفصول بفاصلة.`,
      config: {
        systemInstruction: "أنت محرك بحث جغرافي سوري ذكي. تعرف كل زقاق وحارة في سوريا.",
      },
    });
    const text = response.text || "";
    return text.split(/[،,]/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 5);
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
