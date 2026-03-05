'use client'

import { useState, useEffect } from 'react'
// useRouter dari next/navigation adalah standar untuk Next.js App Router
import { useRouter } from 'next/navigation'
// Pastikan file src/lib/supabase.js sudah ada di proyek kamu
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Mencegah error hidrasi (hydration error) pada Next.js
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSignIn = async () => {
    if (!email || !password) return alert('Silakan masukkan email dan password!')
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        alert(`Gagal Masuk: ${error.message}`)
      } else if (data.user) {
        // Berhasil login, arahkan ke dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat mencoba masuk.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!email || !password) return alert('Silakan masukkan email dan password!')
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          }
        }
      })

      if (error) {
        alert(`Gagal Daftar: ${error.message}`)
      } else {
        alert('Pendaftaran berhasil! Silakan cek email kamu (dan folder spam) untuk konfirmasi akun.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat mendaftar.')
    } finally {
      setLoading(false)
    }
  }

  // Jika belum di sisi client, jangan render apa pun untuk menghindari mismatch HTML
  if (!isClient) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md p-8 bg-[#1e293b] rounded-3xl shadow-2xl border border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Task App</h1>
          <p className="text-slate-400 text-sm mt-2">Masuk untuk mulai mengelola tugas</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300 ml-1">Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all placeholder:text-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300 ml-1">Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all placeholder:text-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 active:scale-[0.97]"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">Atau</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button 
            onClick={handleSignUp}
            className="w-full bg-slate-700/30 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-300 p-4 rounded-2xl font-semibold transition-all"
          >
            Daftar Akun Baru
          </button>
        </div>

        <p className="mt-10 text-center text-xs text-slate-500 leading-relaxed">
          Pastikan kamu melakukan konfirmasi email setelah mendaftar sebelum mencoba masuk.
        </p>
      </div>
    </div>
  )
}