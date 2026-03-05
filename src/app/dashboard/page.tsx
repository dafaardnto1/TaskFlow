'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Circle, Trash2, Plus, LogOut, 
  Search, LayoutDashboard, CheckSquare, Calendar,
  Zap, Moon, Sun, Info, Play, Pause, RotateCcw, ExternalLink, UserPlus, 
  Users as UsersIcon, Edit3, Save, X, Check, Send
} from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#22c55e']
    });
  };

  const triggerModal = (title: string, message: string, withConfetti = false) => {
    setModalContent({ title, message });
    setShowModal(true);
    if (withConfetti) triggerConfetti();
  };

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

  useEffect(() => { fetchTasks(); }, []);

  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  useEffect(() => {
    if (tasks.length > 0 && completionRate === 100) {
      playSound('complete_all');
      triggerModal("Mission Accomplished", "Semua tugas kamu telah selesai dikerjakan.", true);
    }
  }, [completionRate]);

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    setUserEmail(user.email || "");
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    setProfileName(name);
    setTempProfileName(name);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},shared_with.cs.{${user.email}}`)
      .order('created_at', { ascending: false });
    
    if (!error && data) setTasks(data);
  }

  async function handleShare() {
    if (!shareEmail || !shareEmail.includes('@')) return toast.error("Email tidak valid");
    const task = tasks.find(t => t.id === activeShareId);
    const currentShared = Array.isArray(task?.shared_with) ? task.shared_with : [];
    const { error } = await supabase.from('tasks').update({ shared_with: [...currentShared, shareEmail] }).eq('id', activeShareId);

    if (!error) {
      playSound('share');
      setShowShareModal(false);
      setShareEmail("");
      triggerModal("Task Shared", `Tugas berhasil dibagikan kepada ${shareEmail}`, true);
      fetchTasks();
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
      triggerModal("Task Added", "Tugas baru berhasil ditambahkan.");
    }
  }

  async function deleteTask(id: any) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      playSound('delete');
      setTasks(tasks.filter(t => t.id !== id));
      triggerModal("Task Deleted", "Tugas telah berhasil dihapus.");
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    if (newStatus === 'completed') playSound('success');
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  }

  async function updateProfile() {
    const { error } = await supabase.auth.updateUser({ data: { full_name: tempProfileName } });
    if (!error) {
      setProfileName(tempProfileName);
      setIsEditingProfile(false);
      playSound('success');
      triggerModal("Profile Updated", "Nama profil berhasil diperbarui.");
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredTasks = tasks.filter(t => (filterCat === 'All' || t.category === filterCat));
  const activeCategories = Array.from(new Set(tasks.map(t => t.category))).filter(c => c !== 'General' && c !== null);

  return (
    <div className={`min-h-screen flex font-sans transition-all duration-300 ${isDarkMode ? 'bg-[#0f172a] text-slate-100 dark' : 'bg-[#F1F5F9] text-slate-900'}`}>
      
      {/* MODAL SUCCESS CENTER */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-emerald-500" size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{modalContent.title}</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{modalContent.message}</p>
            <button onClick={() => setShowModal(false)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest">Great!</button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8 font-sans">
              <h3 className="text-2xl font-black text-white">Share Task</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <input 
                type="email" 
                placeholder="Email teman sekelas..." 
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 px-6 py-4 rounded-2xl outline-none text-sm text-white transition-all font-sans"
              />
              <button onClick={handleShare} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3">
                <Send size={18}/> <span className="uppercase text-xs tracking-widest">Kirim Akses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-72 bg-slate-900 text-white p-8 hidden lg:flex flex-col sticky top-0 h-screen border-r border-white/5">
        <div className="flex items-center gap-3 mb-10"><Zap className="text-indigo-500" size={28} fill="currentColor"/><span className="font-black text-2xl italic font-sans">TaskFlow</span></div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {tasks.length > 0 && (
            <>
              <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-4 px-4 font-sans">Workspace</p>
              <button onClick={() => setFilterCat('All')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${filterCat === 'All' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 text-slate-400'}`}>
                <div className="flex items-center gap-3"><LayoutDashboard size={18} /><span>Dashboard</span></div>
              </button>
              {activeCategories.map(cat => (
                <button key={cat as string} onClick={() => setFilterCat(cat as string)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${filterCat === cat ? 'bg-indigo-600 font-bold' : 'hover:bg-white/5 text-slate-400'}`}>
                  <div className="flex items-center gap-3"><CheckSquare size={18} /><span>{cat as string}</span></div>
                </button>
              ))}
            </>
          )}
          <div className="pt-4 border-t border-white/5 mt-4">
            <button onClick={() => { setIsDarkMode(!isDarkMode); playSound('toggle'); }} className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-xs font-bold font-sans">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />} {isDarkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/10 font-sans">
          {isEditingProfile ? (
            <div className="space-y-2">
              <input value={tempProfileName} onChange={(e) => setTempProfileName(e.target.value)} className="w-full bg-slate-800 text-xs p-2 rounded border border-indigo-500 outline-none text-white" />
              <button onClick={updateProfile} className="w-full bg-indigo-600 p-1 rounded text-[10px] font-bold">Save</button>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <p className="text-sm font-bold truncate text-white">{profileName}</p>
              <button onClick={() => setIsEditingProfile(true)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white"><Edit3 size={14}/></button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className={`md:col-span-2 p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900 border-white/5 shadow-lg' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-end mb-6 font-sans">
                <h2 className="text-2xl font-black">Progress</h2>
                <span className="text-3xl font-black text-indigo-500 font-sans">{completionRate}%</span>
              </div>
              <div className="w-full h-4 rounded-full p-1 bg-slate-800">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div className={`p-8 rounded-[2.5rem] border text-center flex flex-col justify-center items-center ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
              <span className="text-3xl font-black mb-2 font-sans">{formatTime(timer)}</span>
              <div className="flex gap-2">
                <button onClick={() => setIsActive(!isActive)} className="p-2 bg-indigo-600 text-white rounded-xl font-sans">{isActive ? <Pause size={18}/> : <Play size={18}/>}</button>
                <button onClick={() => { setIsActive(false); setTimer(120*60); }} className="p-2 bg-slate-800 rounded-xl text-white font-sans"><RotateCcw size={18}/></button>
              </div>
            </div>
          </div>

          <form onSubmit={addTask} className={`p-8 rounded-[3rem] border mb-12 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white shadow-slate-200/60'}`}>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Tulis tugas baru..." className="w-full text-2xl font-black outline-none bg-transparent mb-4 font-sans text-white" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Catatan atau link..." className="w-full bg-transparent text-sm outline-none mb-4 opacity-60 focus:opacity-100 transition-opacity font-sans text-white" />
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/5 font-sans">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-slate-800 p-2 rounded-xl text-[11px] font-bold text-white uppercase outline-none font-sans" />
              <button type="submit" className="ml-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:scale-105 transition-all font-sans">+ Tambah</button>
            </div>
          </form>

          <div className="space-y-4 pb-10">
            {filteredTasks.map(task => (
              <div key={task.id} className={`group p-6 rounded-[2.5rem] border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-900 border-white/5 hover:border-indigo-500/30' : 'bg-white shadow-sm hover:shadow-xl'}`}>
                <div className="flex items-center gap-6 flex-1 font-sans">
                  <button onClick={() => toggleStatus(task.id, task.status)} className={`${task.status === 'completed' ? 'text-indigo-500' : 'text-slate-500'}`}>
                    {task.status === 'completed' ? <CheckCircle2 size={32} fill="currentColor" /> : <Circle size={32} />}
                  </button>
                  <div className="flex-1 font-sans">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-black text-lg font-sans ${task.status === 'completed' ? 'line-through opacity-30 text-white' : 'text-white'}`}>{task.title}</h3>
                      {task.description && (
                        <div className="group/info relative cursor-help flex items-center">
                          <Info size={14} className="text-slate-500 hover:text-indigo-400" />
                          <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-[11px] text-white rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity z-50 shadow-2xl border border-white/5 font-sans">
                            {renderDescription(task.description)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setActiveShareId(task.id); setShowShareModal(true); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-colors"><UserPlus size={18} /></button>
                  <button onClick={() => deleteTask(task.id)} className="p-2 hover:text-red-500 text-slate-500 transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}