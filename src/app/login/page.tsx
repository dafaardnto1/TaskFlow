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
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: email.split('@')[0] } }
        });
        if (error) throw error;
        toast.success('Pendaftaran berhasil! Cek email untuk verifikasi.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast.success('Selamat datang kembali!');
        // Redirect paksa agar session segar
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <Toaster position="top-center" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Zap className="text-white fill-current" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase tracking-widest">TaskFlow</h1>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            {isRegistering ? 'Registration Mode' : 'Authentication Mode'}
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="relative group text-white">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 pl-12 pr-4 py-4 rounded-2xl outline-none text-sm transition-all text-white"
                placeholder="Email..." required
              />
            </div>
            <div className="relative group text-white">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 pl-12 pr-4 py-4 rounded-2xl outline-none text-sm transition-all text-white"
                placeholder="Password..." required
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 uppercase text-xs tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
              <span>{isRegistering ? 'Daftar Akun' : 'Masuk Dashboard'}</span>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-medium">{isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}</p>
            <button onClick={() => setIsRegistering(!isRegistering)} className="mt-2 text-indigo-400 hover:text-indigo-300 font-black text-sm uppercase underline underline-offset-8">
              {isRegistering ? 'Masuk Sekarang' : 'Daftar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
