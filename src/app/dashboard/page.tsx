'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Circle, Trash2, Plus, LogOut, LayoutDashboard, 
  CheckSquare, Zap, Moon, Sun, Info, Play, Pause, RotateCcw, 
  ExternalLink, UserPlus, Edit3, Save, X, Menu
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
  const router = useRouter();

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsActive(false);
      const audio = new Audio('/sounds/win.mp3');
      audio.play().catch(() => {});
      toast.success("Waktu Fokus Selesai!");
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tasks').insert([
      { title: newTask, description, due_date: dueDate || null, user_id: user?.id, status: 'pending', category, priority }
    ]).select();
    if (!error && data) {
      setTasks([data[0], ...tasks]);
      setNewTask(''); setDescription(''); setDueDate('');
      toast.success('Tugas ditambahkan');
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredTasks = tasks.filter(t => (filterCat === 'All' || t.category === filterCat));
  
  // Kategori dinamis (hanya muncul jika ada tugasnya)
  const activeCategories = Array.from(new Set(tasks.map(t => t.category))).filter(c => c && c !== 'General');

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'}`}>
      <Toaster />
      
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
           {/* DASHBOARD PERMANEN */}
           <button onClick={() => {setFilterCat('All'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterCat === 'All' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5'}`}>
             <LayoutDashboard size={18}/> <span>Dashboard</span>
           </button>

           {/* KATEGORI DINAMIS */}
           {activeCategories.length > 0 && activeCategories.map(cat => (
             <button key={cat as string} onClick={() => {setFilterCat(cat as string); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterCat === cat ? 'bg-indigo-600' : 'hover:bg-white/5'}`}>
               <CheckSquare size={18}/> <span>{cat as string}</span>
             </button>
           ))}
        </nav>

        <div className="pt-4 border-t border-white/10 space-y-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-sm w-full">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
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
            <div className={`p-6 rounded-3xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`text-sm font-bold opacity-50 mb-2 uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Progress</h3>
              <span className="text-4xl font-black text-indigo-500">{(tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0)}%</span>
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
            <input 
              type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)}
              placeholder="Tulis tugas baru..." 
              className={`w-full text-xl font-bold bg-transparent outline-none mb-4 ${isDarkMode ? 'text-white placeholder:text-slate-700' : 'text-slate-900 placeholder:text-slate-300'}`}
            />
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-white/5">
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-slate-800 text-[10px] text-white font-bold p-2 rounded-lg outline-none">
                <option value="General">General</option>
                <option value="Kerja">Kerja</option>
                <option value="Kuliah">Kuliah</option>
                <option value="Urgent">Urgent</option>
              </select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-slate-800 text-[10px] text-white p-2 rounded-lg outline-none" />
              <button type="submit" className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">+ Tambah</button>
            </div>
          </form>

          <div className="space-y-3">
            {filteredTasks.map(task => (
              <div key={task.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4 flex-1">
                  <button className={task.status === 'completed' ? 'text-indigo-500' : 'text-slate-500'}><Circle size={24}/></button>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-slate-900'} ${task.status === 'completed' ? 'line-through opacity-30' : ''}`}>{task.title}</span>
                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{task.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
