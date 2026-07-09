// src/app/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import EditorHeader from './components/EditorHeader';
import VersionHistorySidebar from './components/VersionHistorySidebar';
import AiChatSidebar from './components/AiChatSidebar'; 
import EditorToolbar from './components/EditorToolbar';
import Toast from './components/Toast';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';

const DOCUMENT_ID = '123e4567-e89b-12d3-a456-426614174000';

export interface DocumentVersion {
  id: string;
  name: string;      
  createdAt: string; 
  stateVector: string; 
}

function AuthenticatedEditor({ token, logout }: { token: string, logout: () => void }) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [ydoc] = useState(() => new Y.Doc());
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [title, setTitle] = useState('Loading...');
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none text-gray-900 mx-auto focus:outline-none min-h-[600px] p-8 transition-colors',
      },
    },
  });

  // --- GSAP ANIMATIONS ---
  const { contextSafe } = useGSAP(() => {
    // 1. Slingshot Entrance Animation for Editor
    gsap.from('.workspace-card', {
      y: 60,
      scale: 0.95,
      opacity: 0,
      duration: 1.2,
      ease: 'elastic.out(1, 0.4)' // The "Slingshot" ease
    });

    // 2. Ambient Background Blobs (subtle floating)
    gsap.utils.toArray('.bg-blob').forEach((blob: any, i) => {
      gsap.to(blob, {
        x: `random(-80, 80)`,
        y: `random(-80, 80)`,
        duration: `random(6, 10)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.5
      });
    });
  }, { scope: mainRef });

  // 3. Diff Highlight Effect (Flashes color when content updates)
  const triggerDiffEffect = contextSafe((color: string) => {
    gsap.fromTo('.editor-inner-content', 
      { backgroundColor: color },
      { backgroundColor: 'rgba(255, 255, 255, 0)', duration: 1.5, ease: 'power2.out' }
    );
  });
  // ----------------------

  useEffect(() => {
    if (!editor) return;

    const providerDb = new IndexeddbPersistence(DOCUMENT_ID, ydoc);
    const providerWs = new WebsocketProvider('ws://127.0.0.1:1234', DOCUMENT_ID, ydoc, {
      params: { token }
    });

    providerWs.on('status', (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setStatus(event.status);
    });

    editor.extensionManager.extensions.push(
      CollaborationCursor.configure({
        provider: providerWs,
        user: { name: 'SyncScribe User', color: '#f783ac' },
      })
    );

    async function fetchInitialData() {
      try {
        const resVersions = await fetch(`https://sync-scribe-f6z2.vercel.app/api/versions?documentId=${DOCUMENT_ID}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resVersions.ok) {
          const versionData = await resVersions.json();
          if (Array.isArray(versionData)) {
            setVersions(versionData.map(v => ({
              id: v.id,
              name: v.snapshot_name || v.name,
              createdAt: v.created_at || v.createdAt,
              stateVector: v.state_vector || v.stateVector
            })));
          }
        }

        const resTitle = await fetch(`https://sync-scribe-f6z2.vercel.app/api/documents/${DOCUMENT_ID}/title`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resTitle.ok) {
          const titleData = await resTitle.json();
          if (titleData.title) setTitle(titleData.title);
        }
      } catch (err) { 
        console.error("Failed to load initial data", err); 
      }
    }
    fetchInitialData();

    return () => {
      providerDb.destroy();
      providerWs.destroy();
    };
  }, [editor, ydoc, token]);

  const saveTitle = async () => {
    if (!title.trim()) return;
    try {
      const response = await fetch(`https://sync-scribe-f6z2.vercel.app/api/documents/${DOCUMENT_ID}/title`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title })
      });
      if (response.ok) {
        setToast({ message: 'Title saved!', type: 'success' });
      } else {
        setToast({ message: 'Failed to save title', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to save title', type: 'error' });
    }
  };

  const saveSnapshot = async () => {
    const stateVector = Y.encodeStateAsUpdate(ydoc);
    const base64Vector = Buffer.from(stateVector).toString('base64');
    const response = await fetch('https://sync-scribe-f6z2.vercel.app/api/versions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        documentId: DOCUMENT_ID,
        snapshotName: `Snapshot - ${new Date().toLocaleTimeString()}`,
        stateVector: base64Vector
      })
    });
    
    if (response.ok) {
      setToast({ message: 'Snapshot Saved Successfully!', type: 'success' });
      const res = await fetch(`https://sync-scribe-f6z2.vercel.app/api/versions?documentId=${DOCUMENT_ID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVersions(data.map(v => ({
          id: v.id,
          name: v.snapshot_name || v.name,
          createdAt: v.created_at || v.createdAt,
          stateVector: v.state_vector || v.stateVector
        })));
      }
    } else {
      setToast({ message: 'Failed to save snapshot', type: 'error' });
    }
  };

  const restoreSnapshot = (version: any) => {
    if (!editor) return;
    if (!confirm('Are you sure you want to restore this version?')) return;
    const rawVector = version.stateVector || version.state_vector;
    
    try {
      const binaryState = Buffer.from(rawVector, 'base64');
      const tempDoc = new Y.Doc();
      Y.applyUpdate(tempDoc, binaryState);
      const historicalContent = tempDoc.getXmlFragment('default').toJSON();
      
      editor.commands.clearContent(true);
      editor.commands.setContent(historicalContent, true);
      
      tempDoc.destroy();
      setIsHistoryOpen(false);
      setToast({ message: 'Version restored successfully!', type: 'success' });

      // Trigger Blue Diff Effect on Restore
      triggerDiffEffect('rgba(59, 130, 246, 0.2)'); 
    } catch (err) {
      setToast({ message: 'Failed to decode snapshot.', type: 'error' });
    }
  };

  const handleAutocomplete = async () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) {
      setToast({ message: 'Document is empty. Write something first!', type: 'error' });
      return;
    }
    
    setIsAiLoading(true);
    try {
      // Fixed URL to point to localhost:1234 to prevent routing errors
      const response = await fetch('https://sync-scribe-f6z2.vercel.app/api/completion', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ prompt: text })
      });
      if (response.ok) {
        const data = await response.json();
        setAiText(data.text); 
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <main ref={mainRef} className="min-h-screen relative flex overflow-hidden bg-slate-50">
      
      {/* AMBIENT SLINGSHOT BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_30%,transparent_100%)]"></div>
      <div className="bg-blob absolute top-[20%] left-[10%] w-[30rem] h-[30rem] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="bg-blob absolute bottom-[20%] right-[10%] w-[30rem] h-[30rem] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <Toast message={toast?.message || ''} type={toast?.type} onClose={() => setToast(null)} />

      <div className={`transition-all duration-300 flex-1 max-w-5xl mx-auto py-8 relative z-10 ${isHistoryOpen ? 'mr-[320px]' : ''}`}>
        
        {/* WORKSPACE CARD */}
        <div className="workspace-card bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[calc(100vh-4rem)]">
          
          <EditorHeader 
            status={status}
            title={title}
            onTitleChange={setTitle}
            onTitleSave={saveTitle} 
            onSave={saveSnapshot} 
            onToggleHistory={() => { setIsHistoryOpen(!isHistoryOpen); setIsChatOpen(false); }} 
            onSummarize={handleAutocomplete} 
            onLogout={logout}
            isAiLoading={isAiLoading}
          />

          <EditorToolbar editor={editor} />

          {aiText && (
            <div className="bg-purple-50/90 backdrop-blur-md border-b border-purple-100 p-6 relative animate-in slide-in-from-top-4 duration-300">
              <button onClick={() => setAiText('')} className="absolute top-4 right-4 text-purple-400 hover:text-purple-600"><X className="w-5 h-5" /></button>
              <h3 className="text-purple-800 font-semibold flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" /> AI Auto-Complete</h3>
              <p className="text-sm text-purple-900 whitespace-pre-wrap">{aiText}</p>
              <button 
                onClick={() => { 
                  editor?.commands.insertContent(` ${aiText}`); 
                  setAiText(''); 
                  // Trigger Purple Diff Effect on AI Insert
                  triggerDiffEffect('rgba(168, 85, 247, 0.2)'); 
                }} 
                className="mt-4 text-xs font-semibold bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition-colors active:scale-95"
              >
                Insert Text
              </button>
            </div>
          )}
          
          {/* EDITOR INNER CONTENT (Targeted for Diff Flash) */}
          <div className="editor-inner-content bg-transparent flex-1 overflow-y-auto rounded-b-xl">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <VersionHistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} versions={versions} onRestore={restoreSnapshot} />
      <AiChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {!isChatOpen && (
        <button onClick={() => { setIsChatOpen(true); setIsHistoryOpen(false); }} className="fixed bottom-[45px] right-8 z-40 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1 active:scale-95 font-medium text-sm">
          <MessageSquare className="w-5 h-5" /> Open Chat
        </button>
      )}

      {/* FOOTER */}
      <footer className="absolute bottom-0 w-full text-center py-2 bg-white/80 backdrop-blur-md border-t border-gray-200 text-xs text-gray-500 z-30">
        <p>
          Built by <span className="font-semibold text-gray-700">Himanshu Mishra</span> |{' '}
          <a 
            href="https://github.com/himanshumiisshra/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-gray-900 transition-colors font-medium"
          >
            GitHub
          </a> |{' '}
          <a 
            href="https://www.linkedin.com/in/himanshumiisshra/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-blue-600 transition-colors font-medium"
          >
            LinkedIn
          </a>
        </p>
      </footer>
    </main>
  );
}

export default function Home() {
  const { token, logout } = useAuth();
  
  if (!token) {
    return <Login />;
  }

  return <AuthenticatedEditor token={token} logout={logout} />;
}