// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Extract the messages array automatically sent by the useChat hook
    const { messages } = await req.json();

    // 2. Format it to match your custom Hocuspocus backend's expected payload
    const latestMessage = messages[messages.length - 1];
    const query = latestMessage.content;
    const chatHistory = messages.slice(0, -1);

    // 3. Make the secure request to your sync-server (running on port 1234)
    const backendResponse = await fetch('https://sync-scribe-f6z2.vercel.app/genie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Injects the secret securely on the server-side
        'Authorization': process.env.AUTH_SECRET || 'your_fallback_secret_here',
      },
      body: JSON.stringify({
        query: query,
        chat_history: chatHistory,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend AI Error:", errorText);
      return NextResponse.json({ error: errorText }, { status: backendResponse.status });
    }

    // 4. Pipe the Gemini text stream directly back to the React frontend
    return new Response(backendResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: 'Failed to connect to AI backend' }, { status: 500 });
  }
}