async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    setProfileName(name);
    setTempProfileName(name);

    const { data, error } = await supabase.from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTasks(data);
      
      // --- LOGIKA SMART STREAK (FIXED) ---
      // Kita hitung semua tugas yang statusnya 'completed' 
      // dan tanggal update-nya adalah HARI INI.
      const today = new Date().toISOString().split('T')[0];
      const completedToday = data.filter(t => 
        t.status === 'completed' && 
        (t.updated_at ? t.updated_at.startsWith(today) : t.created_at.startsWith(today))
      ).length;
      
      setStreak(completedToday);
    }
  }
