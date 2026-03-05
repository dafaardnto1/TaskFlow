'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Zap, Mail, Lock, UserPlus, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // State tukar Login/Daftar
  const router = useRouter();

  const playSound = (type: 'success' | 'toggle') => {
    const audio = new Audio(`/sounds/${type === 'success' ? 'success.mp3' : 'toggle.mp3'}`);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      // LOGIKA DAFTAR
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: email.split('@')[0] } }
      });

      if (error) {
        toast.error(error.message);
      } else {
        playSound('success');
        toast.success('Pendaftaran berhasil! Silakan cek email kamu.');
        setIsRegistering(false);
      }
    } else {
      // LOGIKA MASUK
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error('Email atau password salah!');
      } else {
        playSound('success');
        toast.success('Selamat datang kembali!');
        router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans selection:bg-indigo-500/30">
      <Toaster position="top-center" />
      
      {/* Efek Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        {/* LOGO */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-4 ring-4 ring-indigo-500/20">
            <Zap className="text-white fill-current" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TaskFlow</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">
            {isRegistering ? 'Buat Akun Baru' : 'Masuk ke Dashboard'}
          </p>
        </div>

        {/* CARD LOGIN/DAFTAR */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-500">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 pl-12 pr-6 py-4 rounded-2xl outline-none text-white text-sm transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 pl-12 pr-6 py-4 rounded-2xl outline-none text-white text-sm transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] group"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
              {isRegistering ? 'Daftar Sekarang' : 'Masuk Sekarang'}
            </button>
          </form>

          {/* TOGGLE ANTARA LOGIN & DAFTAR */}
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); playSound('toggle'); }}
              className="text-slate-400 hover:text-white text-xs font-bold transition-colors group"
            >
              {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'} 
              <span className="text-indigo-400 ml-1 group-hover:underline">
                {isRegistering ? 'Masuk di sini' : 'Daftar di sini'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
