import { GoogleGenAI, Type, Chat, Modality, GenerateContentResponse } from "@google/genai";
import { Creator, PaymentTrack, ReliabilityBreakdown } from "../types";

// Manual implementation of decode as per guidelines for raw PCM streaming/decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual implementation of audio decoding as per guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiService {
  constructor() {
    // ai instance is now created locally within each method to ensure fresh API key access
  }

  /**
   * RECALCULATE RELIABILITY SCORE (DAILY TASK)
   * Analyzes: On-time rate, Avg Delay, Recovery vs Missed, Consistency, Resolution Speed.
   */
  async recalculateReliabilityScore(creator: Creator, history: PaymentTrack[]) {
    try {
      // Create fresh instance right before making the API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following creator's financial reliability metrics for our talent agency. 
        Creator Profile: ${JSON.stringify({ stageName: creator.stageName, totalPaid: creator.totalPaid, totalMissed: creator.totalMissed })}
        Payment History: ${JSON.stringify(history)}
        
        Evaluate based on these strictly weighted factors:
        1. On-time payment rate
        2. Average delay days
        3. Total amount recovered vs missed
        4. Payment pattern consistency
        5. Issue resolution speed
        
        Return a comprehensive reliability score (0-100) and a percentage breakdown (0-100) for each metric.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  onTimeRate: { type: Type.NUMBER },
                  avgDelayDays: { type: Type.NUMBER },
                  recoveryRatio: { type: Type.NUMBER },
                  consistencyScore: { type: Type.NUMBER },
                  resolutionSpeed: { type: Type.NUMBER }
                },
                required: ["onTimeRate", "avgDelayDays", "recoveryRatio", "consistencyScore", "resolutionSpeed"]
              },
              analysis: { type: Type.STRING }
            },
            required: ["overallScore", "breakdown", "analysis"]
          },
          systemInstruction: "You are an elite financial auditor for high-net-worth talent agencies. Your scoring is objective, rigorous, and data-driven."
        }
      });
      // Correct usage of .text property
      const text = response.text;
      return JSON.parse(text || "{}");
    } catch (error) {
      console.error("Gemini Reliability Audit Error:", error);
      return { 
        overallScore: creator.reliabilityScore, 
        breakdown: creator.reliabilityBreakdown || { onTimeRate: 80, avgDelayDays: 2, recoveryRatio: 90, consistencyScore: 85, resolutionSpeed: 70 },
        analysis: "Audit unavailable."
      };
    }
  }

  async analyzeReliability(creator: Creator, history: PaymentTrack[]) {
    return this.recalculateReliabilityScore(creator, history);
  }

  async generateDeescalationAudio(stage: string, amount: number, creatorName: string) {
    try {
      const prompt = `Say in a professional, slightly urgent, but polite concierge tone: "Hello ${creatorName}, this is the Promura account concierge. We noticed an outstanding recovery of $${amount}. Please update your payment method to avoid current service limitations during this ${stage} phase. Thank you."`;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned");

      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        outputAudioContext,
        24000,
        1,
      );

      return { buffer: audioBuffer, context: outputAudioContext };
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      return null;
    }
  }

  async getCategoryInsights(issueDistribution: { category: string, percentage: number }[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these payment recovery issue categories and provide a single brief, actionable recommendation for each category based on its severity/percentage.
        Issues: ${JSON.stringify(issueDistribution)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                recommendation: { type: Type.STRING, description: "One concise actionable sentence (max 12 words)." }
              },
              required: ["category", "recommendation"]
            }
          },
          systemInstruction: "You are an elite fintech operations consultant for Promura. Your advice is surgical, professional, and high-impact."
        }
      });
      // Correct usage of .text property
      const text = response.text;
      return JSON.parse(text || "[]");
    } catch (error) {
      console.error("Gemini Category Insights Error:", error);
      return [];
    }
  }

  async generateDeescalationMessage(stage: string, amount: number, method: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a polite but firm de-escalation message for a creator in the ${stage} stage. They owe $${amount}. Direct them to pay via ${method}.`,
        config: {
          systemInstruction: "You are a professional payment recovery assistant for a top talent agency."
        }
      });
      // Correct usage of .text property
      return response.text;
    } catch (error) {
      return `Final notice: Your payment of $${amount} is overdue. Please settle via ${method} immediately to avoid further service disruption.`;
    }
  }

  async getQuickSummary(appContext: { creators: Creator[], tracks: PaymentTrack[] }) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Conduct a rapid executive review of the current recovery pipeline. 
        Active Issues: ${appContext.tracks.length}
        Creators: ${appContext.creators.length}
        Portfolio Data: ${JSON.stringify(appContext.tracks)}
        Provide a structured executive briefing.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              briefing: { type: Type.STRING, description: "A high-level 2-sentence summary of overall health." },
              quickWin: { type: Type.STRING, description: "The single most impactful action for today." },
              priorityLevel: { type: Type.STRING, description: "CRITICAL, ELEVATED, or NOMINAL" }
            },
            required: ["briefing", "quickWin", "priorityLevel"]
          },
          systemInstruction: "You are a world-class strategic advisor for a high-net-worth talent agency. Your tone is ultra-professional, concise, and decisive."
        }
      });
      // Correct usage of .text property
      const text = response.text;
      return JSON.parse(text || "{}");
    } catch (error) {
      return {
        briefing: "Recovery pipeline is stable but requires active monitoring.",
        quickWin: "Initiate Level 1 follow-ups for all grace period accounts.",
        priorityLevel: "ELEVATED"
      };
    }
  }

  createChat(appContext: { creators: Creator[], tracks: PaymentTrack[] }): Chat {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: `You are the Promura Missed Payment Assistant. You help agency owners recover missed payments from creators.
        Current Context:
        - Managed Creators: ${JSON.stringify(appContext.creators.map(c => ({ name: c.stageName, score: c.reliabilityScore })))}
        - Active Recovery Tracks: ${JSON.stringify(appContext.tracks)}
        
        Your Goal: Provide strategic recovery advice and suggest de-escalation steps. 
        Style: Professional, analytical, and elite.`,
      },
    });
  }
}

export const geminiService = new GeminiService();