// src/components/Login.tsx
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Register from './Register';
import Toast from './Toast'; 
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Loader2, Cloud, Database, FileText, RefreshCcw, Check, XCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  // Replaced isLoading with a more robust status state
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { login } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initial Entrance & Continuous Background Animations
  const { contextSafe } = useGSAP(() => {
    gsap.from('.auth-form', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });

    gsap.utils.toArray('.floating-icon').forEach((icon: any, i) => {
      gsap.to(icon, {
        y: `random(-40, 40)`,
        x: `random(-40, 40)`,
        rotation: `random(-15, 15)`,
        duration: `random(4, 7)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.2
      });
    });

    gsap.utils.toArray('.bg-blob').forEach((blob: any) => {
      gsap.to(blob, {
        y: `random(-30, 30)`,
        x: `random(-30, 30)`,
        scale: `random(0.9, 1.1)`,
        duration: `random(5, 8)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });

  }, { scope: containerRef, dependencies: [isRegister] });

  // 2. Failure Animation: Snappy error shake
  const playErrorAnimation = contextSafe(() => {
  gsap.to('.auth-form', {
    x: [-12, 12, -10, 10, -5, 5, 0] as any, // Add 'as any' here
    duration: 0.5,
    ease: 'power3.inOut'
  });
});

  // 3. Success Animation: Smooth "Cloud Sync" lift-off
  const playSuccessAnimation = contextSafe((onComplete: () => void) => {
    gsap.to('.auth-form', {
      scale: 0.9,
      opacity: 0,
      y: -40,
      duration: 0.6,
      ease: 'power2.in',
      onComplete 
    });
  });

  if (isRegister) {
    return (
      <div ref={containerRef}>
        <Toast message={toast?.message || ''} type={toast?.type} onClose={() => setToast(null)} />
        <Register 
          onSwitchToLogin={() => setIsRegister(false)} 
          setToast={setToast} 
        />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus('loading');
    setToast(null);

    try {
      const res = await fetch('https://sync-scribe-f6z2.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setLoginStatus('success');
        
        // Brief 400ms delay so the user can see the green success button before it flies away
        setTimeout(() => {
          playSuccessAnimation(() => {
            login(data.token);
          });
        }, 400);

      } else {
        setToast({ message: 'Invalid email or password', type: 'error' });
        setLoginStatus('error');
        playErrorAnimation();
        
        // Reset the button back to normal after 2 seconds
        setTimeout(() => setLoginStatus('idle'), 2000);
      }
    } catch (error) {
      setToast({ message: 'Network error. Backend might be offline.', type: 'error' });
      setLoginStatus('error');
      playErrorAnimation();
      setTimeout(() => setLoginStatus('idle'), 2000);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      
      <div className="bg-blob absolute top-[10%] left-[20%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>
      <div className="bg-blob absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Cloud className="floating-icon absolute top-[20%] left-[15%] w-24 h-24 text-blue-200/60 drop-shadow-lg" />
        <Database className="floating-icon absolute bottom-[25%] left-[20%] w-20 h-20 text-purple-200/60 drop-shadow-lg" />
        <FileText className="floating-icon absolute top-[25%] right-[20%] w-16 h-16 text-indigo-200/60 drop-shadow-lg" />
        <RefreshCcw className="floating-icon absolute bottom-[20%] right-[15%] w-28 h-28 text-sky-200/60 drop-shadow-lg" />
      </div>

      <Toast message={toast?.message || ''} type={toast?.type} onClose={() => setToast(null)} />
      
      {/* FOREGROUND FORM */}
      <form onSubmit={handleLogin} className="auth-form relative z-10 p-8 bg-white/90 backdrop-blur-md shadow-2xl border border-white/50 rounded-2xl w-96 flex flex-col gap-5">
        
        <div className="text-center mb-2">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <RefreshCcw className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SyncScribe</h1>
          <p className="text-sm text-gray-500 mt-1">Log in to your collaborative workspace</p>
        </div>
        
        <div className="space-y-3">
          <input 
            className="w-full p-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all" 
            type="email" 
            placeholder="Email address" 
            disabled={loginStatus !== 'idle'}
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            className="w-full p-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all" 
            type="password" 
            placeholder="Password"
            disabled={loginStatus !== 'idle'}
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        
        {/* DYNAMIC BUTTON */}
        <button 
          disabled={loginStatus !== 'idle'}
          className={`w-full flex justify-center items-center gap-2 font-semibold p-3.5 rounded-xl transition-all duration-300 mt-2
            ${loginStatus === 'idle' ? 'bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:translate-y-0' : ''}
            ${loginStatus === 'loading' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 animate-pulse cursor-wait' : ''}
            ${loginStatus === 'success' ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-105' : ''}
            ${loginStatus === 'error' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : ''}
          `}
        >
          {loginStatus === 'idle' && 'Continue to Workspace'}
          
          {loginStatus === 'loading' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Syncing...
            </>
          )}
          
          {loginStatus === 'success' && (
            <>
              <Check className="w-5 h-5 animate-in zoom-in duration-300" />
              Verified
            </>
          )}
          
          {loginStatus === 'error' && (
            <>
              <XCircle className="w-5 h-5 animate-in zoom-in duration-300" />
              Failed
            </>
          )}
        </button>
        
        <div className="text-center mt-2">
          <button 
            type="button" 
            disabled={loginStatus !== 'idle'}
            onClick={() => setIsRegister(true)} 
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 font-medium"
          >
            New here? <span className="underline decoration-2 underline-offset-2">Create an account</span>
          </button>
        </div>
      </form>
    </div>
  );
}