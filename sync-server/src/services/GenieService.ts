// src/services/GenieService.ts
import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Using the most stable 2026 production models
const FALLBACK_MODELS = [
  "gemini-3.5-flash", 
  "gemini-3.1-flash-lite", 
  "gemini-2.5-flash"
];

const SYSTEM_PROMPT = `You are the SyncScribe Assistant, an AI-powered writing companion and guide for the SyncScribe collaborative editor platform. Your primary role is to: 
1. Provide precise and contextual guidance related to the SyncScribe platform's features, UI, and functionality.
2. Offer expert-level writing assistance, including brainstorming, drafting, editing, formatting, and summarizing text.
3. Analyze user inputs to ensure relevance and focus. Politely redirect or ignore irrelevant queries while maintaining a professional and conversational tone.

Scope and Features of SyncScribe Assistant:
1. **SyncScribe Platform Guidance**
- Help users understand and utilize SyncScribe's core capabilities: Local-first real-time collaboration, Version History, and AI Auto-Complete.
- Explain how the real-time syncing works (powered by WebSockets and Yjs) ensuring no data is ever lost.
- Guide users on how to save document snapshots and restore previous versions using the "History" sidebar.
- Explain how to use the "Auto-Complete" (Magic Wand) button in the header to seamlessly generate text and overcome writer's block.

2. **Writing and Editing Expertise**
- Act as a collaborative writing partner. Help users expand on ideas, rewrite paragraphs for specific tones, or summarize long texts.
- If a user asks you to write something, provide the text clearly so they can easily copy and paste it into their SyncScribe document.

3. **Handling Irrelevant Queries**
- Gently decline to answer irrelevant or off-topic questions. Redirect the user back to writing-related tasks or platform guidance.`;

// --- 1. CHAT STREAMING WITH MOCK FAIL-SAFE ---
export const handleGenieChat = async (req: Request, res: Response) => {
  try {
    if (!apiKey) return res.status(500).json({ error: 'Missing AI API Key.' });

    const requestData = req.body || {};
    const chatHistory = requestData.chat_history;
    const userQuery = requestData.query;

    if (!userQuery) return res.status(400).json({ error: 'Query parameter is required.' });
    if (!Array.isArray(chatHistory)) return res.status(400).json({ error: 'chat_history must be a list of JSON objects.' });

    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    let result;
    let usedModel = '';

    // 1. Try the real AI models
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1500, topP: 0.9 }
        });
        const chat = model.startChat({ history: formattedHistory });
        
        result = await chat.sendMessageStream(userQuery);
        usedModel = modelName;
        console.log(`[AI Chat] Success using: ${modelName}`);
        break; 
      } catch (err: any) {
        console.warn(`[AI Chat] ${modelName} failed (${err.message}). Trying fallback...`);
      }
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked'
    });

    // 2. If ALL models 503'd, send a graceful mock response instead of crashing
    if (!result) {
      console.warn("[AI Chat] All models failed. Serving mock response so UI doesn't block.");
      const mockMessage = "I'm currently operating in offline/mock mode because the Google AI servers are experiencing a 503 outage. However, your UI and WebSockets are working perfectly! Try saving a snapshot or testing the real-time syncing.";
      
      // Simulate streaming delay
      for (const char of mockMessage) {
        res.write(char);
        await new Promise(resolve => setTimeout(resolve, 20)); 
      }
      return res.end();
    }

    // 3. Otherwise, stream the real response
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end(); 

  } catch (error: any) {
    console.error(`Error processing query: ${error.message}`);
    if (!res.headersSent) {
      res.status(503).json({ error: 'AI services are currently overloaded.', details: error.message });
    } else {
      res.end();
    }
  }
};

// --- 2. AUTO-COMPLETE WITH MOCK FAIL-SAFE ---
export const handleCompletion = async (req: Request, res: Response) => {
  try {
    if (!apiKey) return res.status(500).json({ error: 'Missing AI API Key.' });
    
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    const aiPrompt = `You are an expert writing assistant. Continue the following text naturally, adding 2-3 sentences. Only output the continuation, no pleasantries or quotes.\n\nText: ${prompt}`;
    
    let result;
    
    // 1. Try the real AI models
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(aiPrompt);
        console.log(`[AI Auto-Complete] Success using: ${modelName}`);
        break; 
      } catch (e: any) {
        console.warn(`[AI Auto-Complete] ${modelName} failed. Trying fallback...`);
      }
    }

    // 2. If ALL models 503'd, return a mock continuation
    if (!result) {
      console.warn("[AI Auto-Complete] All models failed. Serving mock response.");
      return res.status(200).json({ 
        text: " [Mock AI Continuation]: Furthermore, the underlying architecture ensures that no data is ever lost during transit. This allows teams to collaborate globally with absolute confidence." 
      });
    }

    const text = result.response.text();
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error(`AI Completion Error:`, error.message);
    return res.status(500).json({ error: 'Failed to generate completion.' });
  }
};