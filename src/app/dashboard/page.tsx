'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Trash2, LayoutDashboard, 
  CheckSquare, Zap, Moon, Sun, Info, 
  ExternalLink, LogOut, X, Menu, Check, Calendar, UserPlus, Send, Edit3, Save, Flame
} from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');
  const [filterCat, setFilterCat] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [timer, setTimer] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  
  const [profileName, setProfileName] = useState("User");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");
  const [streak, setStreak] = useState(0);

  // --- FITUR SHARE TASK STATE ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [activeShareId, setActiveShareId] = useState<any>(null);

  const router = useRouter();
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    const sounds = ['success', 'delete', 'toggle', 'win', 'share'];
    sounds.forEach(s => {
      const audio = new Audio(`/sounds/${s === 'win' ? 'win' : s}.mp3`);
      audio.preload = 'auto';
      audioRefs.current[s] = audio;
    });
    fetchTasks();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsActive(false);
      playSound('complete_all');
      triggerModal("WAKTU HABIS!", "Sesi fokus berakhir.", true);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  const playSound = (type: string) => {
    const soundKey = type === 'complete_all' ? 'win' : type;
    const audio = audioRefs.current[soundKey];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const triggerModal = (title: string, message: string, withConfetti = false) => {
    setModalContent({ title, message });
    setShowModal(true);
    if (withConfetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    setProfileName(name);
    setTempProfileName(name);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) {
      setTasks(data);
      setStreak(data.filter(t => t.status === 'completed').length);
    }
  }

  async function updateProfile() {
    const { error } = await supabase.auth.updateUser({ data: { full_name: tempProfileName } });
    if (!error) {
      setProfileName(tempProfileName);
      setIsEditingProfile(false);
      playSound('success');
      toast.success("Profil diperbarui!");
    }
  }

  async function handleShare() {
    if (!shareEmail.includes('@')) return toast.error("Email tidak valid!");
    const task = tasks.find(t => t.id === activeShareId);
    const currentShared = Array.isArray(task?.shared_with) ? task.shared_with : [];
    const { error } = await supabase.from('tasks').update({ shared_with: [...currentShared, shareEmail] }).eq('id', activeShareId);
    if (!error) {
      playSound('share');
      setShowShareModal(false);
      triggerModal("SHARED!", `Tugas dikirim ke ${shareEmail}`, true);
      setShareEmail("");
      fetchTasks();
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tasks').insert([
      { title: newTask, description, due_date: dueDate || null, status: 'pending', category, user_id: user?.id }
    ]).select();
    if (!error && data) {
      playSound('success');
      setTasks([data[0], ...tasks]);
      setNewTask(''); setDescription(''); setDueDate('');
      triggerModal("BERHASIL!", "Misi baru ditambahkan.", true);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    playSound(newStatus === 'completed' ? 'success' : 'toggle');
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    if (newStatus === 'completed') setStreak(prev => prev + 1);
  }

  async function deleteTask(id: any) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      playSound('delete');
      setTasks(tasks.filter(t => t.id !== id));
      toast.success("Tugas dihapus");
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
  const activeCategories = Array.from(new Set(tasks.map(t => t.category))).filter(c => c && c !== 'General');

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${isDarkMode ? 'bg-[#0f172a] text-white font-sans' : 'bg-white text-slate-900 font-sans'}`}>
      <Toaster />
      
      {/* OVERLAY MODAL */}
      {(showModal || showShareModal) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setShowModal(false); setShowShareModal(false); }}></div>
          {showModal && (
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center text-white">
              <Check className="text-emerald-500 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-black mb-2 uppercase italic tracking-widest">{modalContent.title}</h3>
              <p className="text-slate-400 text-sm mb-6">{modalContent.message}</p>
              <button onClick={() => setShowModal(false)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">Lanjutkan</button>
            </div>
          )}
          {showShareModal && (
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-white">
              <h3 className="text-2xl font-black mb-8">Share Task</h3>
              <input type="email" placeholder="Email teman..." value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 px-6 py-4 rounded-2xl outline-none text-white mb-4"/>
              <button onClick={handleShare} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3">
                <Send size={18}/> <span className="uppercase text-xs tracking-widest text-white">Kirim Akses</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between p-5 bg-slate-900 border-b border-white/5 text-white">
        <div className="flex items-center gap-2 font-black italic uppercase"><Zap className="text-indigo-500" /> TaskFlow</div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-xl"><Menu /></button>
      </div>

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-0 z-50 w-full lg:w-72 bg-slate-900 text-white p-6 transition-transform duration-300 flex flex-col border-r border-white/5 shadow-2xl`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3"><Zap className="text-indigo-500" /> <span className="font-black text-xl italic uppercase tracking-tighter">TaskFlow</span></div>
          <button className="lg:hidden p-2 bg-white/5 rounded-full" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="flex items-center gap-3 text-[10px] text-red-400 font-black mb-10 hover:bg-red-400/10 p-4 rounded-2xl border border-red-400/20 transition-all uppercase tracking-widest"><LogOut size={16}/> <span>Keluar Aplikasi</span></button>

        {/* PROFILE EDIT */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
          {isEditingProfile ? (
            <div className="space-y-3">
              <input value={tempProfileName} onChange={(e) => setTempProfileName(e.target.value)} className="w-full bg-slate-800 text-xs p-2 rounded-xl border border-indigo-500 text-white outline-none font-bold" />
              <div className="flex gap-2">
                <button onClick={updateProfile} className="flex-1 bg-indigo-600 p-2 rounded-xl text-[10px] font-black uppercase">Save</button>
                <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-slate-700 p-2 rounded-xl text-[10px] font-bold text-white">No</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white shrink-0 shadow-lg">{profileName[0]?.toUpperCase()}</div>
                <div className="overflow-hidden text-left">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Master</p>
                  <p className="text-sm font-bold truncate italic">{profileName}</p>
                </div>
              </div>
              <button onClick={() => setIsEditingProfile(true)} className="p-2 text-slate-500 hover:text-indigo-400 transition-all"><Edit3 size={16}/></button>
            </div>
          )}
        </div>

        {/* STREAK COUNTER 🔥 */}
        <div className="mb-8 flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl">
           <Flame className="text-orange-500" fill="currentColor" size={24} />
           <div className="text-left">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Daily Streak</p>
              <p className="text-lg font-black text-white">{streak} Missions</p>
           </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.3em] px-4 mb-4 text-left">Workspace</p>
          <button onClick={() => {setFilterCat('All'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterCat === 'All' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}><LayoutDashboard size={18}/> <span>Dashboard</span></button>
          {activeCategories.map(cat => (
            <button key={cat as string} onClick={() => {setFilterCat(cat as string); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterCat === cat ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}><CheckSquare size={18}/> <span>{cat as string}</span></button>
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/10 text-left">
          <button onClick={() => { setIsDarkMode(!isDarkMode); playSound('toggle'); }} className="flex items-center gap-3 text-[11px] font-bold text-slate-500 hover:text-white w-full uppercase tracking-widest transition-all">
            {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>} <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-8 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="text-[10px] font-black opacity-30 mb-2 uppercase text-left tracking-[0.2em]">Overall Progress</h3>
              <span className="text-5xl font-black text-indigo-500 flex tracking-tighter tabular-nums">{(tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0)}%</span>
            </div>
            <div className="p-8 rounded-[2.5rem] text-center flex flex-col items-center justify-center bg-indigo-900/20 border border-indigo-500/20 text-white shadow-xl">
              <span className="text-4xl font-black mb-1 tabular-nums tracking-tighter">{formatTime(timer)}</span>
              <button onClick={() => setIsActive(!isActive)} className="text-[10px] uppercase font-black tracking-widest text-indigo-400 hover:text-indigo-300 transition-all">{isActive ? 'Pause Focusing' : 'Start Focus'}</button>
            </div>
          </div>

          <form onSubmit={addTask} className="bg-slate-900/60 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Tulis tugas utama..." className="w-full text-2xl font-black bg-transparent outline-none mb-2 text-white placeholder:text-slate-800" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Link atau catatan..." className="w-full bg-transparent text-sm outline-none mb-6 text-slate-500 h-12" />
            <div className="flex flex-wrap gap-2 items-center pt-6 border-t border-white/5 text-white">
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-slate-800 text-white text-[10px] p-3 rounded-xl font-black uppercase tracking-widest outline-none"><option value="General">General</option><option value="Kerja">Kerja</option><option value="Kuliah">Kuliah</option></select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-slate-800 text-white text-[10px] p-3 rounded-xl font-black outline-none" />
              <button type="submit" className="ml-auto bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all">+ Tambah</button>
            </div>
          </form>

          <div className="space-y-4 pb-20">
            {tasks.filter(t => filterCat === 'All' || t.category === filterCat).map(task => (
              <div key={task.id} className="group p-6 rounded-[2.5rem] bg-slate-900/40 border border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-5 flex-1 overflow-hidden">
                  <button onClick={() => toggleStatus(task.id, task.status)} className={`${task.status === 'completed' ? 'text-indigo-500' : 'text-slate-700'}`}>
                    <CheckCircle2 size={32} fill={task.status === 'completed' ? 'currentColor' : 'none'} />
                  </button>
                  <div className="flex flex-col text-left overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base truncate ${task.status === 'completed' ? 'line-through opacity-20 text-slate-500' : 'text-white'}`}>{task.title}</span>
                      {task.description && (
                        <div className="group/info relative flex items-center">
                          <Info size={14} className="text-slate-600 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-3 w-56 p-4 bg-slate-800 text-[10px] text-white rounded-2xl opacity-0 group-hover/info:opacity-100 transition-all z-50 border border-white/10 leading-relaxed font-bold shadow-2xl">
                            {task.description.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => part.match(/(https?:\/\/[^\s]+)/g) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold underline">Link <ExternalLink size={10}/></a> : part)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                      <span className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em]">{task.category}</span>
                      {task.due_date && <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1 uppercase"><Calendar size={10}/> {task.due_date}</span>}
                    </div>
                  </div>
                </div>
                {/* SHARE & DELETE AREA (FIXED) */}
                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setActiveShareId(task.id); setShowShareModal(true); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><UserPlus size={18} /></button>
                  <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-700 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
