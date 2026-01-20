
import { GoogleGenAI } from "@google/genai";
import { AuditLog } from "../types";

export const analyzeAuditLogs = async (logs: AuditLog[]): Promise<string> => {
  // Correctly initialize GoogleGenAI with a named parameter for the API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const logSummary = logs.map(l => 
    `[${new Date(l.timestamp).toLocaleString('ar-EG')}] المستخدم: ${l.username} - الإجراء: ${l.action} - الحالة: ${l.status} - التفاصيل: ${l.details}`
  ).join('\n');

  try {
    // Upgrading to 'gemini-3-pro-preview' as security auditing involves complex reasoning
    // We call generateContent directly on ai.models as per the latest SDK standards
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `أنت خبير في الأمن السيبراني. قم بتحليل سجلات العمليات الإدارية التالية للبحث عن أي أنماط مشبوهة أو مخاطر أمنية أو محاولات وصول غير مصرح بها. قدم ملخصاً موجزاً وتوصيات باللغة العربية.
      
      السجلات:
      ${logSummary}`,
      config: {
        systemInstruction: "أنت محلل أمني محترف. كن موجزاً وركز على المخاطر القابلة للتنفيذ. أجب دائماً باللغة العربية."
      }
    });

    // Access the text property directly on the response object
    return response.text || "التحليل غير متاح حالياً.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "فشل تحليل السجلات بواسطة الذكاء الاصطناعي.";
  }
};
