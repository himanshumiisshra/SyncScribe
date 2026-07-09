// src/app/components/EditorHeader.tsx
import { Save, History, Loader2, Sparkles, LogOut } from 'lucide-react';

interface Props {
  status: 'connecting' | 'connected' | 'disconnected';
  title: string;
  onTitleChange: (newTitle: string) => void;
  onTitleSave: () => void;
  onSave: () => void;
  onToggleHistory: () => void;
  onSummarize: () => void;
  onLogout: () => void;
  isAiLoading: boolean;
}

export default function EditorHeader({ status, title, onTitleChange, onTitleSave, onSave, onToggleHistory, onSummarize, onLogout, isAiLoading }: Props) {
  return (
    <div className="flex items-center justify-between bg-gray-900 text-white px-6 py-4">
      {/* Editable Title Input */}
      <input 
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onTitleSave} // Saves when the user clicks outside the input
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} // Saves on Enter
        className="font-bold text-lg tracking-wide bg-transparent border border-transparent hover:border-gray-700 focus:border-blue-500 focus:bg-gray-800 rounded px-2 py-1 outline-none transition-all w-64 placeholder-gray-500"
        placeholder="Untitled Document"
      />
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm w-28 justify-end border-r border-gray-700 pr-4">
          <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-gray-300 capitalize">{status}</span>
        </div>

        <button onClick={onSummarize} disabled={isAiLoading} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50">
          {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Auto-Complete
        </button>

        <button onClick={onSave} className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded text-sm font-medium transition-colors text-gray-300 hover:text-white">
          <Save className="w-4 h-4" /> Save
        </button>

        <button onClick={onToggleHistory} className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded text-sm font-medium transition-colors text-gray-300 hover:text-white border-r border-gray-700 pr-4">
          <History className="w-4 h-4" /> History
        </button>

        <button onClick={onLogout} className="flex items-center gap-2 hover:bg-red-900/50 px-3 py-1.5 rounded text-sm font-medium transition-colors text-red-400 hover:text-red-300">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}