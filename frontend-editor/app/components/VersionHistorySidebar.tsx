// src/components/VersionHistorySidebar.tsx
import { History, ChevronRight } from 'lucide-react';
import { DocumentVersion } from '../page';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
}

export default function VersionHistorySidebar({ isOpen, onClose, versions, onRestore }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Stagger animate the history items when the sidebar opens
  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo('.version-item', 
        { x: 50, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, { scope: sidebarRef, dependencies: [isOpen, versions] });

  return (
    <div 
      ref={sidebarRef}
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <History className="w-5 h-5"/> Version History
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {(!Array.isArray(versions) || versions.length === 0) ? (
            <p className="text-gray-500 text-sm text-center mt-10">No snapshots saved yet.</p>
          ) : (
            versions.map((v) => (
              <div 
                key={v.id} 
                // Added 'version-item' class for GSAP targeting
                className="version-item p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group bg-gray-50 hover:bg-white cursor-pointer"
              >
                <h3 className="font-semibold text-sm text-gray-900">{v.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{new Date(v.createdAt).toLocaleString()}</p>
                <button
                  onClick={() => onRestore(v)}
                  className="mt-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md w-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Restore This Version
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}