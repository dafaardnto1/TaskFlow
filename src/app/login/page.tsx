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
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: email.split('@')[0] } }
      });
      if (error) toast.error(error.message);
      else { toast.success('Cek email untuk verifikasi!'); setIsRegistering(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error('Email atau password salah!');
      else { toast.success('Selamat datang!'); router.push('/dashboard'); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">TaskFlow</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            {isRegistering ? 'Buat Akun Baru' : 'Masuk Dashboard'}
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-xl">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 pl-12 pr-4 py-3 rounded-xl outline-none text-white text-sm transition-all"
                placeholder="Email" required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 pl-12 pr-4 py-3 rounded-xl outline-none text-white text-sm transition-all"
                placeholder="Password" required
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
              {isRegistering ? 'Daftar' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              {isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
