// src/app/api/completion/route.ts
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Use generateText for guaranteed compatibility
    const result = await generateText({
      model: google('gemini-3.5-flash'),
      system: 'You are an AI writing assistant. Auto-complete the text provided by the user seamlessly. ONLY output the continuation, do not repeat the existing text.',
      prompt: prompt,
    });

    // Return standard JSON
    return Response.json({ text: result.text });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return new Response('Failed to generate AI response', { status: 500 });
  }
}