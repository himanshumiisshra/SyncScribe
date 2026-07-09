// src/components/EditorToolbar.tsx
import { Editor } from '@tiptap/react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 p-2 bg-gray-50/80">
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()} 
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button 
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button 
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      
      <button 
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
        title="Numeric List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
}