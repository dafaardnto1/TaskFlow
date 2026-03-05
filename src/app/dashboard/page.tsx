'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Circle, Trash2, Plus, LogOut, LayoutDashboard, 
  CheckSquare, Zap, Moon, Sun, Info, Play, Pause, RotateCcw, 
  ExternalLink, UserPlus, Edit3, Save, X, Menu, Send
} from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [filterCat, setFilterCat] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [timer, setTimer] = useState(120 * 60);
  const [isActive, setIsActive] = useState(false);
  const [profileName, setProfileName] = useState("User");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [activeShareId, setActiveShareId] = useState<any>(null);

  const router = useRouter();

  // --- 1. KEMBALIKAN SOUND LOGIC ---
  const playSound = (type: 'delete' | 'success' | 'share' | 'toggle' | 'complete_all') => {
    const sounds = {
      delete: '/sounds/delete.mp3',
      success: '/sounds/success.mp3',
      share: '/sounds/share.mp3',
      toggle: '/sounds/toggle.mp3',
      complete_all: '/sounds/win.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {}); 
  };

  // --- 2. KEMBALIKAN POP-UP & CONFETTI LOGIC ---
  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#22c55e'] });
  };

  const triggerModal = (title: string, message: string, withConfetti = false) => {
    setModalContent({ title, message });
    setShowModal(true);
    if (withConfetti) triggerConfetti();
  };

  // --- 3. KEMBALIKAN SMART LINK LOGIC ---
  const renderDescription = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold">
            Link <ExternalLink size={10} />
          </a>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsActive(false);
      playSound('complete_all');
      triggerModal("Waktu Habis!", "Sesi fokus kamu telah berakhir.", true);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  useEffect(() => { fetchTasks(); }, []);

  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  useEffect(() => {
    if (tasks.length > 0 && completionRate === 100) {
      playSound('complete_all');
      triggerModal("Mission Accomplished", "Semua tugas selesai!", true);
    }
  }, [completionRate]);

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    setUserEmail(user.email || "");
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    setProfileName(name);
    setTempProfileName(name);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
  }

  // --- 4. KEMBALIKAN SHARE LOGIC ---
  async function handleShare() {
    if (!shareEmail.includes('@')) return toast.error("Email tidak valid");
    const task = tasks.find(t => t.id === activeShareId);
    const currentShared = Array.isArray(task?.shared_with) ? task.shared_with : [];
    const { error } = await supabase.from('tasks').update({ shared_with: [...currentShared, shareEmail] }).eq('id', activeShareId);
    if (!error) {
      playSound('share');
      setShowShareModal(false);
      triggerModal("Shared!", `Tugas dikirim ke ${shareEmail}`, true);
      fetchTasks();
    }
  }

  // --- 5. KEMBALIKAN PROFILE EDIT LOGIC ---
  async function updateProfile() {
    const { error } = await supabase.auth.updateUser({ data: { full_name: tempProfileName } });
    if (!error) {
      setProfileName(tempProfileName);
      setIsEditingProfile(false);
      playSound('success');
      triggerModal("Updated!", "Profil kamu berhasil diperbarui.");
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tasks').insert([
      { title: newTask, description, due_date: dueDate || null, user_id: user?.id, status: 'pending', category, priority }
    ]).select();
    if (!error && data) {
      playSound('success');
      setTasks([data[0], ...tasks]);
      setNewTask(''); setDescription(''); setDueDate('');
      triggerModal("Tugas Baru", "Tugas berhasil ditambahkan.");
    }
  }

  // --- 6. KEMBALIKAN DELETE LOGIC ---
  async function deleteTask(id: any) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      playSound('delete');
      setTasks(tasks.filter(t => t.id !== id));
      triggerModal("Dihapus", "Tugas telah dihapus.");
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    if (newStatus === 'completed') playSound('success');
    else playSound('toggle');
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredTasks = tasks.filter(t => (filterCat === 'All' || t.category === filterCat));
  const activeCategories = Array.from(new Set(tasks.map(t => t.category))).filter(c => c && c !== 'General');

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'}`}>
      <Toaster />
      
      {/* MODAL SUCCESS (Pop-up Tengah) */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-emerald-500" size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{modalContent.title}</h3>
            <p className="text-slate-400 text-sm mb-8">{modalContent.message}</p>
            <button onClick={() => setShowModal(false)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-xs">Great!</button>
          </div>
        </div>
      )}

      {/* SHARE MODAL (Pop-up Tengah) */}
      {showShareModal && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white">Share Task</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 text-slate-500 hover:text-white"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <input type="email" placeholder="Email teman..." value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 px-6 py-4 rounded-2xl outline-none text-white transition-all"/>
              <button onClick={handleShare} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3">
                <Send size={18}/> <span className="uppercase text-xs tracking-widest">Kirim Akses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-slate-900 text-white">
        <div className="flex items-center gap-2"><Zap size={20} className="text-indigo-500" /> <span className="font-bold uppercase tracking-widest text-sm">TaskFlow</span></div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg"><Menu size={20} /></button>
      </div>

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-0 z-50 w-72 bg-slate-900 text-white p-6 transition-transform duration-300 flex flex-col border-r border-white/5`}>
        <div className="hidden lg:flex items-center gap-3 mb-10"><Zap className="text-indigo-500" /> <span className="font-black text-xl italic">TaskFlow</span></div>
        <nav className="flex-1 space-y-2">
           <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-4 px-4">Workspace</p>
           <button onClick={() => {setFilterCat('All'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterCat === 'All' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5'}`}>
             <LayoutDashboard size={18}/> <span>Dashboard</span>
           </button>
           {activeCategories.map(cat => (
             <button key={cat as string} onClick={() => {setFilterCat(cat as string); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterCat === cat ? 'bg-indigo-600' : 'hover:bg-white/5'}`}>
               <CheckSquare size={18}/> <span>{cat as string}</span>
             </button>
           ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
          {/* PROFILE EDIT UI */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            {isEditingProfile ? (
              <div className="space-y-2">
                <input value={tempProfileName} onChange={(e) => setTempProfileName(e.target.value)} className="w-full bg-slate-800 text-xs p-2 rounded border border-indigo-500 outline-none text-white" />
                <div className="flex gap-2">
                  <button onClick={updateProfile} className="flex-1 bg-indigo-600 p-1 rounded text-[10px] font-bold flex items-center justify-center gap-1"><Save size={10}/> Save</button>
                  <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-slate-700 p-1 rounded text-[10px] font-bold flex items-center justify-center gap-1"><X size={10}/> Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shrink-0">{profileName[0]?.toUpperCase()}</div>
                  <p className="text-sm font-bold truncate text-white">{profileName}</p>
                </div>
                <button onClick={() => setIsEditingProfile(true)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400"><Edit3 size={14}/></button>
              </div>
            )}
          </div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-sm w-full">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 text-sm w-full">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`text-sm font-bold opacity-50 mb-2 uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Progress</h3>
              <span className="text-4xl font-black text-indigo-500">{completionRate}%</span>
            </div>
            <div className={`p-6 rounded-3xl text-center flex flex-col items-center justify-center border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/20 text-white' : 'bg-indigo-50 border-indigo-100 text-slate-900'}`}>
              <span className="text-3xl font-black mb-3">{formatTime(timer)}</span>
              <div className="flex gap-2">
                <button onClick={() => setIsActive(!isActive)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">{isActive ? <Pause size={20}/> : <Play size={20}/>}</button>
                <button onClick={() => { setIsActive(false); setTimer(120*60); }} className="p-2 bg-slate-800 rounded-xl text-white"><RotateCcw size={20}/></button>
              </div>
            </div>
          </div>

          <form onSubmit={addTask} className={`p-6 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Tulis tugas baru..." className={`w-full text-xl font-bold bg-transparent outline-none mb-2 ${isDarkMode ? 'text-white placeholder:text-slate-700' : 'text-slate-900 placeholder:text-slate-300'}`} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Catatan atau link..." className={`w-full bg-transparent text-sm outline-none mb-4 opacity-60 focus:opacity-100 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-white/5">
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-slate-800 text-[10px] text-white font-bold p-2 rounded-lg outline-none uppercase"><option value="General">General</option><option value="Kerja">Kerja</option><option value="Kuliah">Kuliah</option><option value="Urgent">Urgent</option></select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-slate-800 text-[10px] text-white p-2 rounded-lg outline-none" />
              <button type="submit" className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">+ Tambah</button>
            </div>
          </form>

          <div className="space-y-3">
            {filteredTasks.map(task => (
              <div key={task.id} className={`group p-4 rounded-2xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 flex-1">
                  <button onClick={() => toggleStatus(task.id, task.status)} className={task.status === 'completed' ? 'text-indigo-500' : 'text-slate-500'}>
                    {task.status === 'completed' ? <CheckCircle2 size={24} fill="currentColor" /> : <Circle size={24}/>}
                  </button>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-slate-900'} ${task.status === 'completed' ? 'line-through opacity-30' : ''}`}>{task.title}</span>
                      {task.description && (
                        <div className="group/info relative flex items-center">
                          <Info size={14} className="text-slate-500" />
                          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-white rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity z-50 shadow-xl border border-white/5">{renderDescription(task.description)}</div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{task.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setActiveShareId(task.id); setShowShareModal(true); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white"><UserPlus size={16} /></button>
                  <button onClick={() => deleteTask(task.id)} className="p-2 hover:text-red-500 text-slate-500"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
