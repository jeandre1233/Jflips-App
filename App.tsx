
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ClipboardCheck, 
  Users, 
  User,
  FileText, 
  LayoutDashboard, 
  Plus, 
  X, 
  Trash2, 
  Pencil, 
  ChevronRight, 
  Download, 
  RotateCcw, 
  History, 
  Settings2, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Search, 
  BarChart3, 
  UserCircle, 
  Upload, 
  Loader2, 
  AlertTriangle, 
  Settings, 
  Moon, 
  Sun,
  Database,
  CloudUpload,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { View, Student, ClassType, AttendanceSession, AppState, HistoryMonth, Profile } from './types';
import { toPng } from 'html-to-image';
import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_KEY = 'jflips_theme_pref';

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const INITIAL_PROFILE: Profile = {
  businessName: 'JFLIPS',
  bankName: '',
  accountNumber: '',
  branchCode: '',
  accountType: 'Current',
  logo: ''
};

const INITIAL_STATE: AppState = {
  students: [],
  classTypes: [
    { id: '1', name: 'Private Session', price: 300 },
    { id: '2', name: 'Group Class', price: 150 },
    { id: '3', name: 'Tumbling Intensive', price: 250 }
  ],
  sessions: [],
  history: [],
  profile: INITIAL_PROFILE,
  theme: (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light'
};

// --- ANIMATION VARIANTS ---

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const athleteItemVariants = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

const classItemVariants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

const registerItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 22 } }
};

const invoiceItemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
};

// --- SPLASH SCREEN ---

const SplashScreen: React.FC<{ message?: string }> = ({ message = "Initializing Workspace" }) => {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-700 overflow-hidden relative">
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-[80px] animate-[drift_20s_infinite_linear]"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#1e4da1]/5 dark:bg-indigo-500/10 rounded-full blur-[100px] animate-[drift_25s_infinite_linear_reverse]"></div>
      <div className="relative flex flex-col items-center">
        <div className="inline-flex items-center justify-center mb-12">
           <div className="overflow-hidden pr-6">
             <h1 className="text-7xl font-[1000] italic text-[#1e4da1] dark:text-blue-500 tracking-tighter drop-shadow-2xl animate-[reveal-text_1.2s_cubic-bezier(0.77,0,0.175,1)_forwards]">
               JFLIPS
             </h1>
           </div>
        </div>
        <div className="flex flex-col items-center gap-6 opacity-0 animate-[fade-in_0.8s_ease-out_1.2s_forwards]">
          <div className="w-32 h-[2px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-[#1e4da1] dark:bg-blue-400 rounded-full animate-[progress-scan_2s_infinite_ease-in-out]"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em] translate-y-2 animate-[slide-up-fade_1s_ease-out_forwards]">
              {message}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes reveal-text {
          0% { clip-path: inset(0 100% 0 0); transform: translateX(-20px); filter: blur(10px); }
          100% { clip-path: inset(0 0 0 0); transform: translateX(0); filter: blur(0); }
        }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes progress-scan { 0% { left: -100%; width: 40%; } 50% { left: 30%; width: 60%; } 100% { left: 100%; width: 40%; } }
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -50px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [archiveMonth, setArchiveMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [archiveYear, setArchiveYear] = useState<number>(new Date().getFullYear());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<HistoryMonth | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    };
    initAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) loadCloudData(false);
  }, [user]);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, state.theme);
  }, [state.theme]);

  const loadCloudData = async (silent = true) => {
    if (!user) return;
    if (!silent) setIsLoading(true);
    setIsSyncing(true);
    setDbError(null);
    try {
      const [studentsRes, classesRes, sessionsRes, historyRes, profileRes] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', user.id),
        supabase.from('class_types').select('*').eq('user_id', user.id),
        supabase.from('sessions').select('*').eq('user_id', user.id),
        supabase.from('history').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);
      const errors = [studentsRes.error, classesRes.error, sessionsRes.error, historyRes.error];
      if (errors.some(e => e?.code === '42P01')) { setDbError('Database Setup Required'); return; }
      const p = profileRes.data;
      const mappedProfile: Profile = p ? {
        businessName: p.business_name || INITIAL_PROFILE.businessName,
        bankName: p.bank_name || INITIAL_PROFILE.bankName,
        accountNumber: p.account_number || INITIAL_PROFILE.accountNumber,
        branchCode: p.branch_code || INITIAL_PROFILE.branchCode,
        accountType: p.account_type || INITIAL_PROFILE.accountType,
        logo: p.logo || INITIAL_PROFILE.logo
      } : INITIAL_PROFILE;
      setState(prev => ({
        ...prev,
        students: (studentsRes.data || []).map((s: any) => ({ ...s, groupKey: s.group_key })),
        classTypes: (classesRes.data || []).map((ct: any) => ({ ...ct, studentIds: ct.enrolled_student_ids || [] })),
        sessions: (sessionsRes.data || []).map(s => ({ ...s, classTypeId: s.class_type_id, studentIds: s.student_ids || [] })),
        history: (historyRes.data || []).map(h => ({ ...h, monthName: h.month_name, sessions_json: h.sessions_json || [], sessions: h.sessions_json || [], recordedAt: h.recorded_at })),
        profile: mappedProfile
      }));
    } catch (err: any) { console.error("Fetch failed", err); } 
    finally { setIsSyncing(false); if (!silent) setTimeout(() => setIsLoading(false), 800); }
  };

  const handleSaveStudent = async (name: string, linkedSiblingId?: string) => {
    if (!user) return;
    let finalGroupKey = editingStudent?.groupKey || '';
    if (linkedSiblingId) {
      const sibling = state.students.find(s => s.id === linkedSiblingId);
      if (sibling) {
        if (sibling.groupKey) { finalGroupKey = sibling.groupKey; } 
        else {
          const newKey = `group_${Date.now()}`; finalGroupKey = newKey;
          await supabase.from('students').update({ group_key: newKey }).eq('id', linkedSiblingId).eq('user_id', user.id);
        }
      }
    }
    const studentId = editingStudent ? editingStudent.id : Date.now().toString();
    const { error } = await supabase.from('students').upsert({ id: studentId, name, group_key: finalGroupKey, user_id: user.id });
    if (error) { alert("Cloud Save Error: " + error.message); return; }
    loadCloudData(true); setShowModal(null); setEditingStudent(null);
  };

  const removeStudent = async (id: string) => {
    if (!user) return; if(!window.confirm("Delete athlete?")) return;
    setIsSyncing(true);
    const { error } = await supabase.from('students').delete().eq('id', id).eq('user_id', user.id);
    if (error) { alert("Delete failed: " + error.message); setIsSyncing(false); return; }
    loadCloudData(true);
  };

  const handleSaveClassType = async (name: string, price: number, studentIds: string[]) => {
    if (!user) return;
    const classId = editingClassType ? editingClassType.id : Date.now().toString();
    const { error } = await supabase.from('class_types').upsert({ id: classId, name, price, user_id: user.id, enrolled_student_ids: studentIds });
    if (error) { alert("Cloud Save Error: " + error.message); return; }
    loadCloudData(true); setShowModal(null); setEditingClassType(null);
  };

  const removeClassType = async (id: string) => {
    if (!user) return; if(!window.confirm("Delete class type?")) return;
    const { error } = await supabase.from('class_types').delete().eq('id', id).eq('user_id', user.id);
    if (error) alert("Delete failed: " + error.message);
    loadCloudData(true);
  };

  const handleUpdateProfile = async (profile: Profile) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, business_name: profile.businessName, bank_name: profile.bankName, account_number: profile.accountNumber, branch_code: profile.branchCode, account_type: profile.accountType, logo: profile.logo });
    if (error) { alert("Profile Save Error: " + error.message); return; }
    loadCloudData(true);
  };

  const recordAttendance = async (classTypeId: string, studentIds: string[], date: string) => {
    if (!user) return;
    const sessionId = editingSession ? editingSession.id : Date.now().toString();
    const { error } = await supabase.from('sessions').upsert({ id: sessionId, date, class_type_id: classTypeId, student_ids: studentIds, user_id: user.id });
    if (error) { alert("Session Save Error: " + error.message); return; }
    loadCloudData(true); handleViewChange(View.DASHBOARD);
  };

  const removeSession = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('sessions').delete().eq('id', id).eq('user_id', user.id);
    if (error) alert("Delete failed: " + error.message);
    loadCloudData(true);
  };

  const removeHistoryEntry = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Delete history record?")) return;
    setIsSyncing(true);
    const { error } = await supabase.from('history').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      alert("Delete failed: " + error.message);
      setIsSyncing(false);
      return;
    }
    loadCloudData(true);
  };

  const resetMonth = async () => {
    if (!user) return; if (state.sessions.length === 0) { setIsResetConfirming(false); return; }
    const revenue = state.sessions.reduce((acc, sess) => {
      const ct = state.classTypes.find(c => c.id === sess.classTypeId);
      return acc + (ct?.price || 0) * (sess.studentIds?.length || 0);
    }, 0);
    const { error: histErr } = await supabase.from('history').insert({ id: Date.now().toString(), month_name: archiveMonth, year: archiveYear, sessions_json: state.sessions, revenue, recorded_at: new Date().toISOString(), user_id: user.id });
    if (histErr) { alert("Archive Error: " + histErr.message); return; }
    await supabase.from('sessions').delete().eq('user_id', user.id);
    loadCloudData(true); setIsResetConfirming(false); handleViewChange(View.HISTORY);
  };

  const handleViewChange = (view: View) => {
    setActiveView(view);
    if (view === View.HISTORY) {
      setSelectedHistoryMonth(null);
    }
  };

  const startEditSession = (session: AttendanceSession) => { setEditingSession(session); setActiveView(View.REGISTER); };
  const toggleTheme = () => setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  const handleLogout = async () => { await supabase.auth.signOut(); setState(INITIAL_STATE); setShowSettingsModal(false); };

  if (isAuthLoading) return <SplashScreen message="Verifying Identity" />;
  if (!user) return <AuthView />;
  if (dbError) return <DatabaseSetupView message={dbError} onReload={() => loadCloudData(false)} />;
  if (isLoading) return <SplashScreen message="Syncing Elite Data" />;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      <header className="px-6 pt-8 pb-3 sticky top-0 z-20 bg-[#f8fafc] dark:bg-[#0f172a] print:hidden">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-[900] italic text-[#1e4da1] dark:text-blue-400 tracking-tight animate-roll-in">JFLIPS</h1>
              {activeView === View.ROSTER && (
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => setShowSettingsModal(true)} className="p-1.5 bg-white dark:bg-slate-800 text-[#1e4da1] dark:text-blue-400 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><Settings size={18} strokeWidth={2.5} /></motion.button>
              )}
            </div>
            <p className="text-[#94a3b8] dark:text-slate-400 text-[9px] font-bold tracking-[0.1em] uppercase mt-0.5">Stunting & Tumbling Assistant</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setArchiveMonth(MONTHS[new Date().getMonth()]); setArchiveYear(new Date().getFullYear()); setIsResetConfirming(true); }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-[#94a3b8] rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-100 dark:border-slate-700"><RotateCcw size={18} /></motion.button>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-[#1e4da1] dark:bg-blue-400'}`}></div>
          <span className="text-[#1e4da1] dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : `${state.sessions?.length || 0} Cloud Logs`}</span>
        </div>
      </header>

      <main className="flex-1 px-6 pb-28 relative z-0 print:p-0 print:m-0 print:overflow-visible overflow-x-hidden min-h-[50vh]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full"
          >
            {activeView === View.DASHBOARD && <DashboardView state={state} onEditSession={startEditSession} onRemoveSession={removeSession} />}
            {activeView === View.REGISTER && <RegisterView state={state} onSave={recordAttendance} onCancel={() => handleViewChange(View.DASHBOARD)} initialSession={editingSession} />}
            {activeView === View.HISTORY && (
              !selectedHistoryMonth ? (
                <HistoryView history={state.history} onSelectMonth={(month) => setSelectedHistoryMonth(month)} onRemove={removeHistoryEntry} onOpenStats={() => handleViewChange(View.STATISTICS)} />
              ) : (
                <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pb-16">
                  <button onClick={() => setSelectedHistoryMonth(null)} className="mb-4 text-slate-500 text-[10px] font-black uppercase tracking-widest py-2 hover:text-[#1e4da1] transition-colors">&larr; Back to History</button>
                  <h2 className="text-xl font-black mb-5 uppercase tracking-tight text-[#1a1a1a] dark:text-white px-2 italic">{selectedHistoryMonth.monthName} {selectedHistoryMonth.year}</h2>
                  <InvoicesView state={{ ...state, sessions: selectedHistoryMonth.sessions || [] }} monthLabel={`${selectedHistoryMonth.monthName} ${selectedHistoryMonth.year}`} />
                </motion.div>
              )
            )}
            {activeView === View.STATISTICS && <StatisticsView history={state.history} onBack={() => handleViewChange(View.HISTORY)} />}
            {activeView === View.INVOICES && <InvoicesView state={state} />}
            {activeView === View.ROSTER && <RosterView state={state} onUpdateProfile={handleUpdateProfile} onAddStudent={() => { setEditingStudent(null); setShowModal('student'); }} onEditStudent={(s) => { setEditingStudent(s); setShowModal('student'); }} onRemoveStudent={removeStudent} onAddClass={() => { setEditingClassType(null); setShowModal('class'); }} onEditClass={(c) => { setEditingClassType(c); setShowModal('class'); }} onRemoveClass={removeClassType} onLogout={handleLogout} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {activeView === View.DASHBOARD && (
        <motion.button 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setEditingSession(null); handleViewChange(View.REGISTER); }} 
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#1e4da1] dark:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl z-30 print:hidden"
        >
          <Plus size={28} strokeWidth={3} />
        </motion.button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-md mx-auto bg-white dark:bg-[#1e293b] border-t border-slate-100 dark:border-slate-800 flex justify-around items-center py-2.5 px-2 z-30 print:hidden transition-colors duration-300">
        <NavButton active={activeView === View.DASHBOARD} icon={<LayoutDashboard size={20}/>} label="Home" onClick={() => handleViewChange(View.DASHBOARD)} />
        <NavButton active={activeView === View.REGISTER} icon={<ClipboardCheck size={20}/>} label="Reg" onClick={() => { setEditingSession(null); handleViewChange(View.REGISTER); }} />
        <NavButton active={activeView === View.HISTORY} icon={<History size={20}/>} label="History" onClick={() => handleViewChange(View.HISTORY)} />
        <NavButton active={activeView === View.INVOICES} icon={<FileText size={20}/>} label="Invs" onClick={() => handleViewChange(View.INVOICES)} />
        <NavButton active={activeView === View.ROSTER} icon={<Settings2 size={20}/>} label="Setup" onClick={() => handleViewChange(View.ROSTER)} />
      </nav>

      <AnimatePresence>
        {showModal && (
          <Modal title={showModal === 'student' ? "Athlete" : "Class"} onClose={() => { setShowModal(null); setEditingStudent(null); setEditingClassType(null); }}>
            {showModal === 'student' ? <StudentForm otherStudents={state.students.filter(s => s.id !== editingStudent?.id)} initialData={editingStudent || undefined} onSubmit={handleSaveStudent} onCancel={() => setShowModal(null)} /> : <ClassTypeForm students={state.students} initialData={editingClassType || undefined} onSubmit={handleSaveClassType} onCancel={() => setShowModal(null)} />}
          </Modal>
        )}
        {showSettingsModal && <AppSettingsModal state={state} toggleTheme={toggleTheme} onLogout={handleLogout} onClose={() => setShowSettingsModal(false)} />}
        {isResetConfirming && <ArchiveModal archiveMonth={archiveMonth} archiveYear={archiveYear} setArchiveMonth={setArchiveMonth} setArchiveYear={setArchiveYear} onConfirm={resetMonth} onCancel={() => setIsResetConfirming(false)} />}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DashboardView: React.FC<{ state: AppState, onEditSession: (s: AttendanceSession) => void, onRemoveSession: (id: string) => void }> = ({ state, onEditSession, onRemoveSession }) => {
  const revenue = (state.sessions || []).reduce((acc, sess) => {
    const ct = (state.classTypes || []).find(c => c.id === sess.classTypeId);
    return acc + (ct?.price || 0) * (sess.studentIds?.length || 0);
  }, 0);
  return (
    <div className="space-y-8 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#1e4da1] dark:bg-blue-900/40 rounded-3xl p-5 text-white shadow-lg flex flex-col justify-between h-36 relative overflow-hidden"><div className="z-10"><p className="text-white/60 text-[9px] font-black uppercase tracking-[0.15em] mb-1">Rev</p><h3 className="text-3xl font-black italic">R{revenue}</h3></div><CreditCard className="absolute -bottom-3 -right-3 text-white/10 w-20 h-20 rotate-12" /></motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-[#1a1a1a] dark:bg-slate-800 rounded-3xl p-5 text-white shadow-lg flex flex-col justify-between h-36 relative overflow-hidden"><div className="z-10"><p className="text-white/40 text-[9px] font-black uppercase tracking-[0.15em] mb-1">Athletes</p><h3 className="text-3xl font-black">{state.students?.length || 0}</h3></div><Users className="absolute -bottom-3 -right-3 text-white/10 w-20 h-20 -rotate-12" /></motion.div>
      </div>
      <div className="space-y-4">
        <div className="flex items-end justify-between"><h4 className="font-black text-[#1a1a1a] dark:text-slate-100 text-xl uppercase italic">Sessions</h4><span className="text-[#94a3b8] text-[9px] font-bold uppercase tracking-widest">{state.sessions?.length || 0} Logs</span></div>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
          {state.sessions.length === 0 ? <p className="text-center py-10 text-[#94a3b8] text-[9px] font-black uppercase">No Data</p> : [...state.sessions].reverse().slice(0, 15).map(session => {
            const ct = state.classTypes.find(c => c.id === session.classTypeId);
            return (
              <motion.div key={session.id} variants={invoiceItemVariants} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/60 border border-slate-50 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-10 h-10 bg-[#eff6ff] dark:bg-blue-900/30 rounded-full flex items-center justify-center text-[#1e4da1] dark:text-blue-400 shrink-0">{session.studentIds?.length > 1 ? <Users size={18} /> : <User size={18} />}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-black text-[#1a1a1a] dark:text-slate-100 truncate italic uppercase">{ct?.name || 'Class'}</p><p className="text-[9px] font-bold text-[#94a3b8] uppercase">{new Date(session.date).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-2 shrink-0"><span className="text-[9px] font-black text-[#1e4da1] mr-1">{(session.studentIds?.length || 0)} IN</span><button onClick={() => onEditSession(session)} className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-lg"><Pencil size={12} /></button><button onClick={() => { if(window.confirm("Delete?")) onRemoveSession(session.id); }} className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-lg"><Trash2 size={12} /></button></div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

const RegisterView: React.FC<{ state: AppState, onSave: (ct: string, sids: string[], date: string) => void, onCancel: () => void, initialSession?: AttendanceSession | null }> = ({ state, onSave, onCancel, initialSession }) => {
  const [selectedClassId, setSelectedClassId] = useState(initialSession?.classTypeId || '');
  const [selectedStudents, setSelectedStudents] = useState<string[]>(initialSession?.studentIds || []);
  const [date, setDate] = useState(initialSession?.date || new Date().toISOString().split('T')[0]);

  const studentsToShow = useMemo(() => {
    if (!selectedClassId) return state.students;
    const selectedClass = state.classTypes.find(ct => ct.id === selectedClassId);
    if (!selectedClass || !selectedClass.studentIds || selectedClass.studentIds.length === 0) return state.students;
    return state.students.filter(s => selectedClass.studentIds?.includes(s.id));
  }, [selectedClassId, state.students, state.classTypes]);

  const toggleStudent = (id: string) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  const handleSave = () => selectedClassId && selectedStudents.length > 0 ? onSave(selectedClassId, selectedStudents, date) : alert("Select class and student");

  return (
    <div className="space-y-6 mt-6 pb-40 px-1">
      <h2 className="text-2xl font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">Register</h2>
      <div className="space-y-2"><label className="text-[10px] font-black text-[#94a3b8] uppercase px-1">Training Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-black dark:text-slate-200 shadow-sm outline-none" /></div>
      
      <div className="space-y-3">
        <label className="text-[10px] font-black text-[#94a3b8] uppercase px-1">Select Class</label>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-2.5">
          {state.classTypes.map(ct => (
            <motion.button key={ct.id} variants={registerItemVariants} whileTap={{ scale: 0.98 }} onClick={() => { setSelectedClassId(ct.id); setSelectedStudents([]); }} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${selectedClassId === ct.id ? 'bg-[#1e4da1] dark:bg-blue-600 border-[#1e4da1] text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-[#1a1a1a] dark:text-slate-300'}`}>
              <span className="font-black text-sm italic uppercase">{ct.name}</span>
              <span className="text-[10px] font-black opacity-60">R{ct.price}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-[#94a3b8] uppercase px-1">Attendance {selectedClassId && `(${studentsToShow.length} Athletes)`}</label>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={selectedClassId || 'none'} variants={staggerContainer} initial="hidden" animate="show" className="space-y-2.5">
            {!selectedClassId ? <div className="bg-white dark:bg-slate-800/40 border border-dashed border-slate-200 rounded-[2rem] p-12 text-center"><p className="text-[10px] text-slate-400 font-black uppercase">Choose session</p></div> : studentsToShow.map(student => (
              <motion.button key={student.id} variants={registerItemVariants} whileTap={{ scale: 0.97 }} onClick={() => toggleStudent(student.id)} className={`w-full p-4 rounded-xl border flex items-center gap-3.5 transition-colors ${selectedStudents.includes(student.id) ? 'bg-[#eff6ff] dark:bg-blue-900/30 border-[#1e4da1] text-[#1e4da1] shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-[#1a1a1a] dark:text-slate-300'}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedStudents.includes(student.id) ? 'bg-[#1e4da1] border-[#1e4da1]' : 'border-slate-200'}`}>
                  {selectedStudents.includes(student.id) && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="font-black uppercase italic text-[13px] truncate">{student.name}</span>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-24 left-6 right-6 max-md mx-auto flex gap-4 z-40">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} className="flex-[4] bg-[#1e4da1] dark:bg-blue-600 text-white py-4.5 rounded-2xl font-black text-[11px] uppercase shadow-2xl">Confirm</motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onCancel} className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[#94a3b8] p-4 rounded-2xl flex items-center justify-center shadow-lg"><X size={24}/></motion.button>
      </div>
    </div>
  );
};

const HistoryView: React.FC<{ history: HistoryMonth[], onSelectMonth: (m: HistoryMonth) => void, onRemove: (id: string) => void, onOpenStats: () => void }> = ({ history, onSelectMonth, onRemove, onOpenStats }) => {
  const currentYear = new Date().getFullYear();
  const yearlyRevenue = useMemo(() => (history || []).filter(m => m.year === currentYear).reduce((sum, m) => sum + (typeof m.revenue === 'string' ? parseFloat(m.revenue) : m.revenue), 0), [history, currentYear]);
  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">History</h2>
      <motion.button whileTap={{ scale: 0.98 }} onClick={onOpenStats} className="w-full text-left bg-white dark:bg-slate-800/60 border border-[#eff6ff] rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div><p className="text-[#94a3b8] text-[9px] font-black uppercase mb-1">{currentYear} Total Rev</p><h3 className="text-2xl font-black text-[#1e4da1] italic">R{yearlyRevenue}</h3></div>
          <ChevronRight className="text-[#94a3b8]" size={20} />
        </div>
      </motion.button>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3 pb-4">
        {history.length === 0 ? <p className="text-center py-10 text-[#94a3b8] text-[9px] font-black uppercase">No Records</p> : history.map(m => (
          <motion.div key={m.id} variants={invoiceItemVariants} className="relative">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => onSelectMonth(m)} className="w-full p-4 bg-white dark:bg-slate-800/60 border border-slate-50 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-[#1a1a1a] dark:bg-slate-700 text-white rounded-xl flex items-center justify-center italic font-black"><span className="text-[7px] uppercase opacity-40">{m.monthName.slice(0, 3)}</span><span className="text-sm">{m.year % 100}</span></div><div className="text-left"><p className="text-sm font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">{m.monthName}</p><p className="text-[9px] text-[#1e4da1] font-black uppercase">R{m.revenue}</p></div></div><ChevronRight className="text-slate-300" size={16} />
            </motion.button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(m.id); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1.5 rounded-full border-2 border-white shadow-md active:scale-90 transition-transform"><Trash2 size={12} /></button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const RosterView: React.FC<{ state: AppState, onUpdateProfile: (p: Profile) => void, onAddStudent: () => void, onEditStudent: (s: Student) => void, onRemoveStudent: (id: string) => void, onAddClass: () => void, onEditClass: (c: ClassType) => void, onRemoveClass: (id: string) => void, onLogout: () => void }> = ({ state, onUpdateProfile, onAddStudent, onEditStudent, onRemoveStudent, onAddClass, onEditClass, onRemoveClass, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'profile'>('students');
  const [search, setSearch] = useState('');
  const [profileForm, setProfileForm] = useState<Profile>(state.profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = (state.students || []).filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const handleProfileSubmit = (e: React.FormEvent) => { e.preventDefault(); onUpdateProfile(profileForm); alert('Profile Saved'); };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setProfileForm({ ...profileForm, logo: reader.result as string }); reader.readAsDataURL(file); }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex bg-slate-100/50 dark:bg-slate-800/40 p-1 rounded-xl relative">
        {(['students', 'classes', 'profile'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-colors duration-300 relative z-10 ${activeTab === tab ? 'text-white' : 'text-[#94a3b8]'}`}>
            {tab === 'students' ? 'Athletes' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <motion.div layoutId="rosterTabBg" className="absolute inset-0 bg-[#1e4da1] dark:bg-blue-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
          </button>
        ))}
      </div>
      
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
          {activeTab === 'profile' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">{profileForm.logo ? <img src={profileForm.logo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border-2 shadow-sm" /> : <div className="w-16 h-16 bg-[#1e4da1] rounded-2xl flex items-center justify-center text-white italic font-black text-xl">JF</div>}<div><h2 className="text-xl font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">Coach Profile</h2><p className="text-[8px] font-black text-[#94a3b8] uppercase">Details & Logo</p></div></div>
              <form onSubmit={handleProfileSubmit} className="space-y-4 bg-white dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>{profileForm.logo ? <div className="relative"><img src={profileForm.logo} alt="Logo" className="h-24 w-auto object-contain rounded-lg" /><button type="button" onClick={(e) => { e.stopPropagation(); setProfileForm({...profileForm, logo: ''}); }} className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 text-red-500 rounded-full p-1 shadow-md"><X size={12} /></button></div> : <div className="flex flex-col items-center py-2"><Upload size={20} className="text-slate-300 mb-1" /><span className="text-[9px] font-black text-slate-400 uppercase">Logo Upload</span></div>}<input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></div>
                <input placeholder="BUSINESS NAME" value={profileForm.businessName} onChange={e => setProfileForm({...profileForm, businessName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" />
                <div className="space-y-3"><input placeholder="BANK" value={profileForm.bankName} onChange={e => setProfileForm({...profileForm, bankName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" /><input placeholder="ACC NUMBER" value={profileForm.accountNumber} onChange={e => setProfileForm({...profileForm, accountNumber: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" /><div className="grid grid-cols-2 gap-3"><input placeholder="BRANCH" value={profileForm.branchCode} onChange={e => setProfileForm({...profileForm, branchCode: e.target.value})} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" /><select value={profileForm.accountType} onChange={e => setProfileForm({...profileForm, accountType: e.target.value})} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200 appearance-none"><option value="Current">Current</option><option value="Savings">Savings</option></select></div></div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full bg-[#1e4da1] dark:bg-blue-600 text-white py-4 mt-4 rounded-xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2">Save <CheckCircle2 size={16}/></motion.button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={onLogout} className="w-full bg-slate-50 dark:bg-slate-800/50 text-[#94a3b8] py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2">Log Out <LogOut size={16}/></motion.button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h2 className="text-xl font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">{activeTab === 'students' ? 'Athletes' : activeTab}</h2><motion.button whileTap={{ scale: 0.8 }} onClick={activeTab === 'students' ? onAddStudent : onAddClass} className="w-10 h-10 bg-[#1e4da1] dark:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Plus size={20} strokeWidth={3}/></motion.button></div>
              {activeTab === 'students' && (
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={16} /><input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 pl-11 pr-4 text-xs font-bold shadow-sm outline-none dark:text-slate-200" /></div>
              )}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3 pb-20">
                {(activeTab === 'students' ? filtered : state.classTypes).map(item => (
                  <motion.div key={item.id} variants={activeTab === 'students' ? athleteItemVariants : classItemVariants} className="p-4 bg-white dark:bg-slate-800/60 border border-slate-50 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 bg-[#eff6ff] dark:bg-blue-900/30 text-[#1e4da1] dark:text-blue-400 rounded-xl flex items-center justify-center font-black text-sm italic shrink-0">
                        {activeTab === 'students' ? (item as Student).groupKey ? <Users size={16}/> : item.name.charAt(0) : <FileText size={16}/>}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic truncate">{item.name}</p>
                        {activeTab === 'classes' && <p className="text-[8px] text-[#94a3b8] font-bold uppercase">R{(item as ClassType).price} • {(item as ClassType).studentIds?.length || 0} enrolled</p>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => activeTab === 'students' ? onEditStudent(item as Student) : onEditClass(item as ClassType)} className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg text-[#94a3b8] active:scale-90"><Pencil size={14}/></button>
                      <button onClick={() => activeTab === 'students' ? onRemoveStudent(item.id) : onRemoveClass(item.id)} className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg text-[#94a3b8] hover:text-red-500 active:scale-90"><Trash2 size={14}/></button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const InvoicesView: React.FC<{ state: AppState, monthLabel?: string }> = ({ state, monthLabel }) => {
  const [sel, setSel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const current = monthLabel || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const invoiceRef = useRef<HTMLDivElement>(null);

  const groupedInvoices = useMemo(() => {
    const groups: { [key: string]: Student[] } = {};
    const solos: Student[] = [];
    state.students.forEach(s => {
      if (s.groupKey) {
        if (!groups[s.groupKey]) groups[s.groupKey] = [];
        groups[s.groupKey].push(s);
      } else solos.push(s);
    });
    const res = Object.values(groups).map(g => ({ id: g[0].id, label: g.map(s => s.name).join(' & '), studentIds: g.map(s => s.id) }));
    solos.forEach(s => res.push({ id: s.id, label: s.name, studentIds: [s.id] }));
    return res;
  }, [state.students]);

  const selectedGroup = groupedInvoices.find(g => g.id === sel);
  const athleteSessions = useMemo(() => {
    if (!selectedGroup) return [];
    return state.sessions.filter(s => s.studentIds?.some(sid => selectedGroup.studentIds.includes(sid))).flatMap(s => {
      const matching = s.studentIds.filter(sid => selectedGroup.studentIds.includes(sid));
      return matching.map(sid => ({ ...s, targetStudentName: state.students.find(st => st.id === sid)?.name || 'Athlete' }));
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.sessions, selectedGroup, state.students]);

  const total = athleteSessions.reduce((acc, s) => acc + (state.classTypes.find(c => c.id === s.classTypeId)?.price || 0), 0);

  const handleDownloadImage = async () => {
    if (!selectedGroup || !invoiceRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const dataUrl = await toPng(invoiceRef.current, { backgroundColor: state.theme === 'dark' ? '#0f172a' : '#ffffff', pixelRatio: 2 });
      const fileName = `Invoice_${selectedGroup.label.replace(/\s+/g, '_')}.png`;
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })], title: `Invoice: ${selectedGroup.label}` });
      } else {
        const link = document.createElement('a'); link.download = fileName; link.href = dataUrl; link.click();
      }
    } catch (e) { alert('Failed.'); } finally { setIsGenerating(false); }
  };

  if (sel && selectedGroup) return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 mt-4 pb-32 overflow-x-hidden w-full px-2">
      <div className="flex justify-between items-center mb-2"><button onClick={() => setSel(null)} className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-[#1e4da1]">&larr; Back</button><motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadImage} disabled={isGenerating} className="bg-[#1e4da1] text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg flex items-center gap-2 disabled:opacity-70 transition-all">{isGenerating ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} strokeWidth={3}/> Image</>}</motion.button></div>
      <div ref={invoiceRef} className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-slate-50 dark:border-slate-800 w-full max-w-sm mx-auto transition-all duration-500">
        <div className="flex justify-between items-start mb-8"><div className="flex flex-col gap-3">{state.profile.logo ? <img src={state.profile.logo} className="w-20 h-20 object-contain rounded-2xl" /> : <h1 className="text-xl font-[1000] italic text-[#1e4da1] dark:text-blue-400">{state.profile.businessName}</h1>}<p className="text-slate-500 text-[10px] font-black uppercase">Invoice</p></div><div className="text-right"><p className="text-slate-500 text-[9px] font-black uppercase">Month</p><p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">{current}</p></div></div>
        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8"></div>
        <div className="mb-8"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Billed To:</p><h2 className="text-xl font-[900] italic uppercase text-slate-900 dark:text-slate-100 mt-1">{selectedGroup.label}</h2></div>
        <div className="grid grid-cols-3 gap-2 mb-3"><span className="text-[10px] font-black text-slate-500 uppercase">Date</span><span className="text-[10px] font-black text-slate-500 uppercase">Desc</span><span className="text-[10px] font-black text-slate-500 uppercase text-right">Amount</span></div>
        <div className="w-full h-[3px] bg-slate-900 dark:bg-slate-600 mb-6"></div>
        <div className="space-y-6 mb-8">{athleteSessions.map((s, idx) => { const ct = state.classTypes.find(c => c.id === s.classTypeId); return (<div key={idx} className="grid grid-cols-3 gap-2 items-center"><div className="text-[10px] font-bold text-slate-400">{new Date(s.date).toLocaleDateString('en-GB')}</div><div className="text-[10px] font-black text-slate-900 dark:text-slate-200 uppercase italic truncate">{ct?.name}{selectedGroup.studentIds.length > 1 && <span className="block text-[8px] opacity-70 normal-case not-italic">{s.targetStudentName}</span>}</div><div className="text-[10px] font-black text-slate-900 dark:text-slate-200 text-right">R{ct?.price}</div></div>); })}</div>
        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-900 dark:text-slate-300 uppercase truncate">Bank: {state.profile.bankName}</p>
            <p className="text-[9px] font-black text-slate-900 dark:text-slate-300 uppercase truncate">Acc: {state.profile.accountNumber}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Total</p>
            <p className="text-4xl sm:text-5xl font-[1000] italic text-[#1e4da1] dark:text-blue-400">R{total}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 mt-4 px-2 pb-24">
      <h2 className="text-xl font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">Invoices</h2>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
        {groupedInvoices.length === 0 ? <div className="bg-white dark:bg-slate-800/40 border border-slate-100 rounded-[2rem] p-10 text-center shadow-sm"><UserCircle className="mx-auto text-slate-100 mb-4" size={48}/><p className="text-[#94a3b8] text-[10px] font-black uppercase">No Athletes</p></div> : groupedInvoices.map(group => {
            const count = state.sessions.filter(sess => sess.studentIds?.some(sid => group.studentIds.includes(sid))).length;
            return (
              <motion.button key={group.id} variants={invoiceItemVariants} whileTap={{ scale: 0.97 }} onClick={() => setSel(group.id)} className="w-full p-4.5 bg-white dark:bg-slate-800/60 border border-slate-50 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm group text-left">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center italic font-black text-white shrink-0 ${group.studentIds.length > 1 ? 'bg-[#1e4da1] dark:bg-blue-600' : 'bg-slate-400 dark:bg-slate-600'}`}>{group.studentIds.length > 1 ? <Users size={18}/> : group.label.charAt(0)}</div>
                  <div className="overflow-hidden">
                    <p className="font-black text-slate-800 dark:text-slate-100 text-[17px] uppercase italic truncate group-hover:text-[#1e4da1] transition-colors">{group.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5"><Calendar size={9} className="text-[#94a3b8]"/><p className="text-[9px] text-slate-500 font-black uppercase">{count} logs</p></div>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-[#1e4da1]" size={20}/>
              </motion.button>
            );
        })}
      </motion.div>
    </div>
  );
};

const StatisticsView: React.FC<{ history: HistoryMonth[], onBack: () => void }> = ({ history, onBack }) => {
  const currentYear = new Date().getFullYear();
  const yearlyData = useMemo(() => MONTHS.map(mName => {
    const recorded = (history || []).find(h => h.monthName === mName && h.year === currentYear);
    return { month: mName, revenue: recorded?.revenue || 0, active: !!recorded };
  }), [history, currentYear]);
  const yearlyTotal = yearlyData.reduce((acc, d) => acc + (typeof d.revenue === 'string' ? parseFloat(d.revenue) : d.revenue), 0);
  const maxMonthly = Math.max(...yearlyData.map(d => (typeof d.revenue === 'string' ? parseFloat(d.revenue) : d.revenue)), 1);
  return (
    <div className="space-y-6 mt-4 pb-20">
      <button onClick={onBack} className="text-[#94a3b8] text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-[#1e4da1] transition-colors">&larr; Back to History</button>
      <div className="bg-[#1e4da1] dark:bg-blue-900/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"><div className="relative z-10"><p className="text-white/60 text-[9px] font-black uppercase mb-1">{currentYear} Performance</p><h2 className="text-3xl font-black italic uppercase">Yearly Stats</h2><div className="mt-4"><p className="text-[8px] font-black uppercase opacity-60">Total Rev</p><p className="text-xl font-black italic">R{yearlyTotal}</p></div></div><BarChart3 className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24" /></div>
      <div className="space-y-3">{yearlyData.map((data, i) => (
        <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-50 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase italic transition-colors ${data.active ? 'bg-[#1e4da1] text-white' : 'bg-slate-50 dark:bg-slate-700 text-slate-300'}`}>{data.month.slice(0, 3)}</div>
          <div className="flex-1 min-w-0"><div className="flex justify-between items-end mb-1.5"><p className="text-xs font-black text-[#1a1a1a] dark:text-slate-100 uppercase italic">{data.month}</p><p className={`text-[10px] font-black ${data.revenue > 0 ? 'text-[#1e4da1]' : 'text-slate-300'}`}>R{data.revenue}</p></div><div className="w-full bg-slate-50 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${((typeof data.revenue === 'string' ? parseFloat(data.revenue) : data.revenue) / maxMonthly) * 100}%` }} transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }} className="bg-[#1e4da1] h-full rounded-full"></motion.div></div></div>
        </div>
      ))}</div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#1e4da1] dark:text-blue-400' : 'text-[#94a3b8] dark:text-slate-600'}`}>
    <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-[#eff6ff] dark:bg-blue-900/30 scale-110' : 'bg-transparent'}`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

const Modal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="p-8 pb-3 flex justify-between items-center border-b border-slate-50 dark:border-slate-800"><h3 className="font-black text-[10px] uppercase tracking-widest text-[#94a3b8]">{title}</h3><button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[#94a3b8]"><X size={16}/></button></div>
      <div className="p-8 pt-5">{children}</div>
    </motion.div>
  </div>
);

const AuthView: React.FC = () => {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (isLogin) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; } 
      else { const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error; alert("Check email."); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-[1000] italic text-[#1e4da1] dark:text-blue-500 tracking-tighter">JFLIPS</h1>
          <p className="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em]">Athlete Management</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-8 rounded-[2.5rem] shadow-2xl border border-slate-50 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1"><label className="text-[9px] font-black text-[#94a3b8] uppercase ml-1">Email</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none dark:text-slate-200" /></div></div>
            <div className="space-y-1"><label className="text-[9px] font-black text-[#94a3b8] uppercase ml-1">Password</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none dark:text-slate-200" /></div></div>
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /><p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full bg-[#1e4da1] dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70">{loading ? <Loader2 size={16} className="animate-spin" /> : <>{isLogin ? 'Log In' : 'Sign Up'}<ArrowRight size={16}/></>}</button>
          </form>
          <div className="mt-8 text-center"><button onClick={() => setIsLogin(!isLogin)} className="text-[#94a3b8] text-[9px] font-black uppercase tracking-widest">{isLogin ? "Join JFLIPS" : "Have an account?"}</button></div>
        </div>
      </div>
    </div>
  );
};

const StudentForm: React.FC<any> = ({ otherStudents, initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [linkedSiblingId, setLinkedSiblingId] = useState<string>('');
  return (
    <div className="space-y-4">
      <div className="space-y-1"><label className="text-[8px] font-black text-[#94a3b8] uppercase ml-1">Full Name</label><input placeholder="NAME" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" /></div>
      <div className="space-y-1"><label className="text-[8px] font-black text-[#94a3b8] uppercase ml-1">Link Sibling</label><select value={linkedSiblingId} onChange={e => setLinkedSiblingId(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200 appearance-none"><option value="">- NONE -</option>{(otherStudents || []).map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="flex gap-2 mt-4"><motion.button whileTap={{ scale: 0.95 }} onClick={() => onSubmit(name, linkedSiblingId || undefined)} className="flex-[4] bg-[#1e4da1] dark:bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">Confirm</motion.button><motion.button whileTap={{ scale: 0.9 }} onClick={onCancel} className="flex-1 bg-slate-100 dark:bg-slate-800 text-[#94a3b8] rounded-xl flex items-center justify-center"><X size={16}/></motion.button></div>
    </div>
  );
};

const ClassTypeForm: React.FC<any> = ({ students, initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price.toString() || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialData?.studentIds || []);
  const toggleStudent = (id: string) => setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
      <div className="space-y-1"><label className="text-[8px] font-black text-[#94a3b8] uppercase ml-1">Class Name</label><input placeholder="NAME" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" /></div>
      <div className="space-y-1"><label className="text-[8px] font-black text-[#94a3b8] uppercase ml-1">Price</label><input placeholder="PRICE" type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-black uppercase text-[10px] outline-none dark:text-slate-200" /></div>
      <div className="space-y-1"><label className="text-[8px] font-black text-[#94a3b8] uppercase ml-1">Roster</label><div className="space-y-1.5 mt-1 max-h-40 overflow-y-auto pr-1">{students.map((s:any) => (<motion.button whileTap={{ scale: 0.98 }} key={s.id} onClick={() => toggleStudent(s.id)} className={`w-full p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-[#1e4da1] text-[#1e4da1]' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500'}`}><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedStudentIds.includes(s.id) ? 'bg-[#1e4da1] border-[#1e4da1]' : 'border-slate-300'}`}>{selectedStudentIds.includes(s.id) && <CheckCircle2 size={10} className="text-white" />}</div><span className="text-[10px] font-black uppercase italic truncate">{s.name}</span></motion.button>))}{students.length === 0 && <p className="text-[9px] text-slate-400 font-bold uppercase py-2">No data</p>}</div></div>
      <div className="flex gap-2 pt-2"><motion.button whileTap={{ scale: 0.95 }} onClick={() => onSubmit(name, parseFloat(price), selectedStudentIds)} className="flex-[4] bg-[#1e4da1] dark:bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">Save</motion.button><motion.button whileTap={{ scale: 0.9 }} onClick={onCancel} className="flex-1 bg-slate-100 dark:bg-slate-800 text-[#94a3b8] rounded-xl flex items-center justify-center transition-transform"><X size={16}/></motion.button></div>
    </div>
  );
};

const AppSettingsModal: React.FC<any> = ({ state, toggleTheme, onLogout, onClose }) => (
  <Modal title="Settings" onClose={onClose}>
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
         <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#1e4da1] dark:text-blue-400">{state.theme === 'dark' ? <Moon size={16}/> : <Sun size={16}/>}</div><span className="font-black uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300">Dark Mode</span></div>
         <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${state.theme === 'dark' ? 'bg-[#1e4da1]' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${state.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
      </div>
      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
      <button type="button" onClick={onLogout} className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl transition-colors"><div className="flex items-center gap-3"><LogOut size={18} className="text-slate-600 dark:text-slate-400"/><span className="font-black uppercase text-[10px] text-slate-600 dark:text-slate-400">Log Out</span></div><ArrowRight size={14} className="text-slate-400 opacity-50"/></button>
    </div>
  </Modal>
);

const ArchiveModal: React.FC<any> = ({ archiveMonth, archiveYear, setArchiveMonth, setArchiveYear, onConfirm, onCancel }) => (
  <Modal title="Archive" onClose={onCancel}>
    <div className="space-y-4">
      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase text-center">Export logs to history.</p>
      <div className="space-y-3">
        <select value={archiveMonth} onChange={(e) => setArchiveMonth(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black uppercase text-[10px] dark:text-slate-200 outline-none">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={archiveYear} onChange={(e) => setArchiveYear(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black uppercase text-[10px] dark:text-slate-200 outline-none"><option value={new Date().getFullYear()}>{new Date().getFullYear()}</option><option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option></select>
      </div>
      <div className="flex gap-3 pt-2"><motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm} className="flex-1 bg-[#1e4da1] dark:bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Confirm</motion.button><button onClick={onCancel} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-xl font-black text-[10px] uppercase">Cancel</button></div>
    </div>
  </Modal>
);

const DatabaseSetupView: React.FC<{ message: string, onReload: () => void }> = ({ message, onReload }) => (
  <div className="flex flex-col min-h-screen items-center justify-center p-8 bg-[#f8fafc] dark:bg-[#0f172a] text-center">
    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6"><Terminal size={32} /></div>
    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-2">{message}</h2>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs">Tables missing. Check Supabase setup.</p>
    <button onClick={onReload} className="mt-8 bg-[#1e4da1] text-white px-8 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2"><RefreshCw size={14}/> Reload</button>
  </div>
);

export default App;
