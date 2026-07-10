// src/components/Register.tsx
import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Loader2, Cloud, Database, FileText, RefreshCcw, Check, XCircle, UserPlus } from 'lucide-react';

interface Props {
  onSwitchToLogin: () => void;
  setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
}

export default function Register({ onSwitchToLogin, setToast }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [registerStatus, setRegisterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(() => {
    gsap.fromTo('.auth-form', 
      { y: 40, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );

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

  }, { scope: containerRef, dependencies: [] });

  const playErrorAnimation = contextSafe(() => {
    gsap.to('.auth-form', {
      x: [-12, 12, -10, 10, -5, 5, 0] as any, 
      duration: 0.5,
      ease: 'power3.inOut'
    });
  });

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus('loading');
    setToast(null);

    try {
      const res = await fetch('https://sync-scribe-f6z2.vercel.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (res.ok) {
        setRegisterStatus('success');
        setToast({ message: 'Registration successful! Please login.', type: 'success' });
        
        setTimeout(() => {
          playSuccessAnimation(() => {
            onSwitchToLogin();
          });
        }, 400);

      } else {
        setToast({ message: 'Registration failed. Email might be in use.', type: 'error' });
        setRegisterStatus('error');
        playErrorAnimation();
        
        setTimeout(() => setRegisterStatus('idle'), 2000);
      }
    } catch (error) {
      setToast({ message: 'Network error. Backend might be offline.', type: 'error' });
      setRegisterStatus('error');
      playErrorAnimation();
      setTimeout(() => setRegisterStatus('idle'), 2000);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      
      <div className="bg-blob absolute top-[10%] left-[20%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>
      <div className="bg-blob absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Cloud className="floating-icon absolute top-[20%] left-[15%] w-24 h-24 text-blue-300/70 drop-shadow-md" />
        <Database className="floating-icon absolute bottom-[25%] left-[20%] w-20 h-20 text-purple-300/70 drop-shadow-md" />
        <FileText className="floating-icon absolute top-[25%] right-[20%] w-16 h-16 text-indigo-300/70 drop-shadow-md" />
        <RefreshCcw className="floating-icon absolute bottom-[20%] right-[15%] w-28 h-28 text-sky-300/70 drop-shadow-md" />
      </div>

      {/* FOREGROUND FORM - Updated for strict contrast and visibility */}
      <form onSubmit={handleRegister} className="auth-form relative z-10 p-8 bg-white shadow-xl border border-gray-100 rounded-2xl w-96 flex flex-col gap-6">
        
        <div className="text-center mb-2">
          <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-200">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-600 mt-1">Join the collaborative workspace</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all shadow-sm" 
            type="text" 
            placeholder="Full Name" 
            disabled={registerStatus !== 'idle'}
            onChange={e => setName(e.target.value)} 
          />
          <input 
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all shadow-sm" 
            type="email" 
            placeholder="Email address" 
            disabled={registerStatus !== 'idle'}
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all shadow-sm" 
            type="password" 
            placeholder="Password" 
            disabled={registerStatus !== 'idle'}
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        
        <button 
          disabled={registerStatus !== 'idle'}
          className={`w-full flex justify-center items-center gap-2 font-bold p-3.5 rounded-xl transition-all duration-300 mt-2 shadow-md
            ${registerStatus === 'idle' ? 'bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 active:translate-y-0' : ''}
            ${registerStatus === 'loading' ? 'bg-green-600 text-white shadow-green-200 animate-pulse cursor-wait' : ''}
            ${registerStatus === 'success' ? 'bg-green-500 text-white shadow-green-200 scale-105' : ''}
            ${registerStatus === 'error' ? 'bg-red-500 text-white shadow-red-200' : ''}
          `}
        >
          {registerStatus === 'idle' && 'Create Account'}
          {registerStatus === 'loading' && <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>}
          {registerStatus === 'success' && <><Check className="w-5 h-5 animate-in zoom-in duration-300" /> Account Created</>}
          {registerStatus === 'error' && <><XCircle className="w-5 h-5 animate-in zoom-in duration-300" /> Failed</>}
        </button>
        
        <div className="text-center mt-2">
          <button 
            type="button" 
            disabled={registerStatus !== 'idle'}
            onClick={onSwitchToLogin} 
            className="text-sm text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50 font-medium"
          >
            Already have an account? <span className="underline decoration-2 underline-offset-2">Log in</span>
          </button>
        </div>
      </form>
    </div>
  );
}