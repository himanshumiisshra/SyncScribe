// src/app/components/AiChatSidebar.tsx
import { X, Send, Bot, User } from 'lucide-react';
import { useEffect, useRef, useState, FormEvent } from 'react';

interface AiChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatSidebar({ isOpen, onClose }: AiChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    
    const chatHistory = [...messages]; 
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://0.0.0.0:1234/genie', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'your_fallback_secret_here' 
        },
        body: JSON.stringify({ 
          query: userMessage.content,
          chat_history: chatHistory 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      if (!response.body) throw new Error('No response body stream available');

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const updatedMessages = [...prev];
          const lastIndex = updatedMessages.length - 1;
          const lastMessage = updatedMessages[lastIndex];
          
          if (lastMessage.role === 'assistant') {
            updatedMessages[lastIndex] = {
              ...lastMessage,
              content: lastMessage.content + chunk,
            };
          }
          return updatedMessages;
        });
      }
    } catch (err: any) {
      console.error("Chat Stream Error:", err);
      setError(err.message || 'Failed to connect to AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      // Changed bottom position to sit exactly above the footer
      className={`fixed bottom-[45px] right-8 w-[360px] h-[500px] max-h-[75vh] bg-white shadow-2xl rounded-2xl flex flex-col z-50 border border-gray-200 transform transition-all duration-300 origin-bottom-right ${
        isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400"/>
          <h2 className="text-sm font-semibold">Your Intelligent Assistant</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-md transition-colors">
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-2">
            <p className="text-sm text-gray-700">Hi there! 👋<br/>I am your intelligent assistant. How can I help you today?</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role !== 'user' && <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>}
              <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-2 justify-start">
             <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>
             <div className="p-3 bg-white border border-gray-200 rounded-2xl rounded-bl-none shadow-sm text-sm text-gray-500 flex gap-1 items-center">
               <span className="animate-bounce">•</span><span className="animate-bounce delay-100">•</span><span className="animate-bounce delay-200">•</span>
             </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center break-words">
            <strong>Connection Error:</strong> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200 rounded-b-2xl flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading} 
          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}