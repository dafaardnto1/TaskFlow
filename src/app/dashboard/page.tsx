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
  const [filterCat, setFilterCat] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [timer, setTimer] = useState(120 * 60);
  const [isActive, setIsActive] = useState(false);
  const [profileName, setProfileName] = useState("User");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [activeShareId, setActiveShareId] = useState<any>(null);

  const router = useRouter();

  const playSound = (type: 'delete' | 'success' | 'share' | 'toggle' | 'complete_all') => {
    const audio = new Audio(`/sounds/${type === 'complete_all' ? 'win.mp3' : type + '.mp3'}`);
    audio.volume = 0.5;
    audio.play().catch(() => {}); 
  };

  const triggerModal = (title: string, message: string, withConfetti = false) => {
    setModalContent({ title, message });
    setShowModal(true);
    if (withConfetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  const renderDescription = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold underline">Link</a>
    ) : part);
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    else if (timer === 0) { setIsActive(false); playSound('complete_all'); triggerModal("Waktu Habis!", "Sesi fokus berakhir.", true); }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");
    setTempProfileName(profileName);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tasks').insert([
      { title: newTask, description, due_date: dueDate || null, user_id: user?.id, status: 'pending', category }
    ]).select();
    if (!error && data) { playSound('success'); setTasks([data[0], ...tasks]); setNewTask(''); setDescription(''); setDueDate(''); triggerModal("Berhasil", "Tugas ditambahkan."); }
  }

  async function deleteTask(id: any) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) { playSound('delete'); setTasks(tasks.filter(t => t.id !== id)); triggerModal("Dihapus", "Tugas telah dihapus."); }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    playSound(newStatus === 'completed' ? 'success' : 'toggle');
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeCategories = Array.from(new Set(tasks.map(t => t.category))).filter(c => c && c !== 'General');

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-all duration-300 ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'}`}>
      <Toaster />
      
      {/* MODAL TENGAH */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 text-center animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-white mb-2">{modalContent.title}</h3>
            <p className="text-slate-400 text-sm mb-8">{modalContent.message}</p>
            <button onClick={() => setShowModal(false)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-xs">Great!</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-0 z-50 w-72 bg-slate-900 text-white p-6 transition-transform flex flex-col border-r border-white/5`}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3"><Zap className="text-indigo-500" /> <span className="font-black text-xl italic">TaskFlow</span></div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><X/></button>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setFilterCat('All')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${filterCat === 'All' ? 'bg-indigo-600' : 'hover:bg-white/5'}`}><LayoutDashboard size={18}/> Dashboard</button>
          {activeCategories.map(cat => (
            <button key={cat as string} onClick={() => setFilterCat(cat as string)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${filterCat === cat ? 'bg-indigo-600' : 'hover:bg-white/5'}`}><CheckSquare size={18}/> {cat as string}</button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 text-sm text-slate-400 hover:text-white">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>} {isDarkMode ? 'Light' : 'Dark'} Mode</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="flex items-center gap-3 text-sm text-red-400 font-bold"><LogOut size={18}/> Keluar</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto font-sans">
        <button className="lg:hidden mb-4 p-2 bg-slate-800 rounded-lg text-white" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="text-sm font-bold opacity-50 mb-2 uppercase tracking-widest">Progress</h3>
              <span className="text-4xl font-black text-indigo-500">{(tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0)}%</span>
            </div>
            <div className="p-6 rounded-3xl text-center flex flex-col items-center justify-center bg-indigo-900/20 border border-indigo-500/20 text-white">
              <span className="text-3xl font-black mb-3">{formatTime(timer)}</span>
              <div className="flex gap-2">
                <button onClick={() => setIsActive(!isActive)} className="p-2 bg-indigo-600 rounded-xl">{isActive ? <Pause size={20}/> : <Play size={20}/>}</button>
                <button onClick={() => { setIsActive(false); setTimer(120*60); }} className="p-2 bg-slate-800 rounded-xl"><RotateCcw size={20}/></button>
              </div>
            </div>
          </div>

          <form onSubmit={addTask} className={`p-6 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Tulis tugas baru..." className={`w-full text-xl font-bold bg-transparent outline-none mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-white/5">
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-slate-800 text-[10px] text-white p-2 rounded-lg outline-none uppercase font-bold"><option value="General">General</option><option value="Kerja">Kerja</option><option value="Kuliah">Kuliah</option><option value="Urgent">Urgent</option></select>
              <button type="submit" className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-600/30">+ Tambah</button>
            </div>
          </form>

          <div className="space-y-3">
            {tasks.filter(t => filterCat === 'All' || t.category === filterCat).map(task => (
              <div key={task.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4 flex-1">
                  <button onClick={() => toggleStatus(task.id, task.status)} className={task.status === 'completed' ? 'text-indigo-500' : 'text-slate-500'}>
                    {task.status === 'completed' ? <CheckCircle2 size={24} fill="currentColor" /> : <Circle size={24}/>}
                  </button>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-slate-900'} ${task.status === 'completed' ? 'line-through opacity-30' : ''}`}>{task.title}</span>
                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{task.category}</span>
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}