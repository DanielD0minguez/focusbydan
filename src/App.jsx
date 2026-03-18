import React, { useState, useEffect } from 'react';
import { 
  Play, Square, Plus, X, BarChart2, ArrowLeft, Activity, Clock, List, PieChart, Download, BellRing,
  Brain, BookOpen, Briefcase, Code, 
  Coffee, Dumbbell, Gamepad2, Headphones, 
  Laptop, Monitor, Music, PenTool, 
  Smartphone, Target, Terminal, Zap,
  Sparkles, GraduationCap, Droplets, Calendar, AlarmClock 
} from 'lucide-react';

// Diccionario de iconos disponibles
const AVAILABLE_ICONS = {
  Brain, BookOpen, Briefcase, Code, 
  Coffee, Dumbbell, Gamepad2, Headphones, 
  Laptop, Monitor, Music, PenTool, 
  Smartphone, Target, Terminal, Zap,
  Sparkles, GraduationCap, Droplets, Calendar
};

// Tareas por defecto
const INITIAL_TASKS = [
  { id: '1', name: 'Programar', icon: 'Code', color: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' },
  { id: '2', name: 'Ocio', icon: 'Gamepad2', color: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600' },
  { id: '3', name: 'Limpieza', icon: 'Sparkles', color: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600' },
  { id: '4', name: 'Clases', icon: 'GraduationCap', color: 'bg-gradient-to-br from-amber-300 via-orange-400 to-red-500' },
  { id: '5', name: 'Aseo Personal', icon: 'Droplets', color: 'bg-gradient-to-br from-sky-300 via-blue-400 to-blue-600' },
  { id: '6', name: 'Tocar', icon: 'Music', color: 'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-red-600' },
  { id: '7', name: 'Planear', icon: 'Calendar', color: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-700' },
];

const COLORS = [
  'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
  'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
  'bg-gradient-to-br from-amber-300 via-orange-400 to-red-500',
  'bg-gradient-to-br from-sky-300 via-blue-400 to-blue-600',
  'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-red-600',
  'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-700',
  'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-800',
  'bg-gradient-to-br from-rose-400 via-red-500 to-pink-600',
  'bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800'
];

const COLORS_HEX = {
  'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500': '#8b5cf6',
  'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600': '#06b6d4',
  'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600': '#10b981',
  'bg-gradient-to-br from-amber-300 via-orange-400 to-red-500': '#f59e0b',
  'bg-gradient-to-br from-sky-300 via-blue-400 to-blue-600': '#38bdf8',
  'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-red-600': '#d946ef',
  'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-700': '#eab308',
  'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-800': '#6d28d9',
  'bg-gradient-to-br from-rose-400 via-red-500 to-pink-600': '#f43f5e',
  'bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800': '#64748b'
};

const TOTAL_DAY_SECONDS = 86400; // 24 horas

// --- SISTEMA DE ALARMAS (WEB AUDIO API) ---
const playAlarm = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  [523.25, 659.25, 783.99].forEach((freq, i) => { 
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(ctx.destination);
    const startTime = ctx.currentTime + i * 0.1; 
    gain.gain.setValueAtTime(0.5, startTime); gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);
    osc.start(startTime); osc.stop(startTime + 1.5);
  });
};

export default function App() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [view, setView] = useState('home'); 
  const [activeTask, setActiveTask] = useState(null);
  
  // ESTADOS MAESTROS DE TIEMPO
  const [globalCountdown, setGlobalCountdown] = useState(null); // Reloj Maestro
  const [isAlarmActive, setIsAlarmActive] = useState(false); // ¿Está sonando la alarma?
  const [taskSeconds, setTaskSeconds] = useState(0); // Tiempo invertido en la tarea actual
  
  const [history, setHistory] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskIcon, setNewTaskIcon] = useState('Target');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customHrs, setCustomHrs] = useState('');
  const [customMins, setCustomMins] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null); 

  // PWA Install
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // 1. MOTOR DEL RELOJ MAESTRO (Global Countdown) - Nunca se detiene si tiene tiempo
  useEffect(() => {
    let interval = null;
    if (globalCountdown !== null && globalCountdown > 0) {
      interval = setInterval(() => {
        setGlobalCountdown((prev) => {
          if (prev <= 1) {
            setIsAlarmActive(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [globalCountdown]);

  // 2. MOTOR DEL RELOJ DE TAREA (Sub-registro) - Solo corre cuando hay una tarea activa
  useEffect(() => {
    let interval = null;
    if (view === 'timer') {
      interval = setInterval(() => {
        setTaskSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  // 3. BUCLE DE LA ALARMA (Suena en bucle hasta que el usuario la apague)
  useEffect(() => {
    let alarmInterval = null;
    if (isAlarmActive) {
      playAlarm(); 
      alarmInterval = setInterval(playAlarm, 2000);
    }
    return () => clearInterval(alarmInterval); 
  }, [isAlarmActive]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return '--:--';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveToHistory = (duration) => {
    if (duration > 0 && activeTask) {
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        taskId: activeTask.id,
        taskName: activeTask.name,
        icon: activeTask.icon,
        color: activeTask.color,
        duration: duration,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // CONTROL DEL RELOJ MAESTRO
  const handleSetGlobalCountdown = (secs) => {
    setGlobalCountdown(secs);
    setIsAlarmActive(false);
  };

  const cancelGlobalCountdown = () => {
    setGlobalCountdown(null);
    setIsAlarmActive(false);
  };

  const handleCustomTimeSubmit = (e) => {
    e.preventDefault();
    const h = parseInt(customHrs || 0);
    const m = parseInt(customMins || 0);
    if (h === 0 && m === 0) return;
    handleSetGlobalCountdown(h * 3600 + m * 60);
    setShowCustomTime(false);
    setCustomHrs(''); setCustomMins('');
  };

  // CONTROL DE TAREAS (Sub-registros)
  const handleStartTask = (task) => {
    setActiveTask(task);
    setTaskSeconds(0);
    setView('timer');
  };

  const handleStopTask = () => {
    saveToHistory(taskSeconds);
    setView('home');
    setActiveTask(null);
    setTaskSeconds(0);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTasks([...tasks, { id: Date.now().toString(), name: newTaskName.trim(), icon: newTaskIcon, color: randomColor }]);
    setIsAdding(false); setNewTaskName(''); setNewTaskIcon('Target');
  };

  const renderIcon = (iconName, props = {}) => {
    const IconComponent = AVAILABLE_ICONS[iconName] || AVAILABLE_ICONS['Target'];
    return <IconComponent {...props} />;
  };

  // --- Lógica de Estadísticas ---
  const stats = history.reduce((acc, session) => {
    if (!acc[session.taskId]) acc[session.taskId] = { name: session.taskName, icon: session.icon, color: session.color, totalDuration: 0, sessions: 0 };
    acc[session.taskId].totalDuration += session.duration;
    acc[session.taskId].sessions += 1;
    return acc;
  }, {});

  const statsArray = Object.values(stats).sort((a, b) => b.totalDuration - a.totalDuration);
  const grandTotalDuration = history.reduce((sum, session) => sum + session.duration, 0);

  let currentPercent = 0;
  const gradientStops = statsArray.map(stat => {
    const percent = (stat.totalDuration / TOTAL_DAY_SECONDS) * 100;
    const start = currentPercent; const end = Math.min(start + percent, 100);
    const hex = COLORS_HEX[stat.color] || '#ffffff';
    currentPercent = end;
    return `${hex} ${start}% ${end}%`;
  });
  if (currentPercent < 100) gradientStops.push(`#334155 ${currentPercent}% 100%`);

  return (
    <div className="flex flex-col h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white overflow-hidden font-sans select-none">
      
      {/* HEADER */}
      <header className="flex-none p-4 sm:p-6 text-center shadow-md bg-slate-900 z-10 flex items-center justify-center relative">
        {view === 'summary' && (
          <button onClick={() => setView('home')} className="absolute left-4 sm:left-6 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} className="sm:w-7 sm:h-7" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 truncate px-12">
          {view === 'home' && 'FOCUS BY DAN'}
          {view === 'timer' && activeTask?.name.toUpperCase()}
          {view === 'summary' && 'ESTADÍSTICAS'}
        </h1>
        {deferredPrompt && view === 'home' && (
          <button onClick={handleInstallClick} className="absolute right-4 sm:right-6 text-slate-400 hover:text-blue-400 transition-all p-2 rounded-full hover:bg-slate-800 flex items-center gap-2" title="Instalar Focus by Dan">
            <Download size={20} className="sm:w-6 sm:h-6" />
            <span className="hidden sm:inline text-xs font-bold uppercase">Instalar</span>
          </button>
        )}
      </header>

      {/* PANTALLA PRINCIPAL (CUADRÍCULA Y RELOJ MAESTRO) */}
      {view === 'home' && (
        <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center pb-24">
          
          {/* SECCIÓN DEL RELOJ MAESTRO (Reducido a la mitad) */}
          <div className="w-full max-w-md flex flex-col items-center mt-2 mb-6 bg-slate-800/30 p-4 sm:p-5 rounded-3xl border border-slate-700/50">
            <h2 className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <AlarmClock size={16} /> Tiempo de Bloque Global
            </h2>
            
            {/* Texto reducido de 7xl/9xl a 4xl/5xl */}
            <div className={`text-4xl sm:text-5xl font-light tracking-tight tabular-nums drop-shadow-md transition-colors ${isAlarmActive ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {globalCountdown !== null ? formatTime(globalCountdown) : '--:--'}
            </div>

            {/* Controles del Reloj Maestro */}
            {isAlarmActive ? (
              <button 
                onClick={() => setIsAlarmActive(false)}
                className="mt-4 px-6 py-2 sm:py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all animate-bounce text-sm"
              >
                Apagar Alarma
              </button>
            ) : (
              <div className="flex flex-col items-center w-full mt-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { label: '5m', secs: 300 },
                    { label: '15m', secs: 900 },
                    { label: '30m', secs: 1800 },
                    { label: '1h', secs: 3600 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => handleSetGlobalCountdown(btn.secs)}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all border shadow-sm ${
                        globalCountdown === btn.secs 
                          ? 'bg-blue-500 border-blue-400 text-white' 
                          : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                  <button onClick={() => setShowCustomTime(true)} className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
                    +
                  </button>
                </div>
                
                {globalCountdown !== null && (
                  <button onClick={cancelGlobalCountdown} className="mt-3 text-[10px] sm:text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider">
                    Cancelar Reloj Global
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-center mb-4">
             <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-widest border-b border-slate-700 pb-1 px-4 text-center">
               Selecciona una Tarea para registrar tiempo
             </span>
          </div>

          {/* CUADRÍCULA DE TAREAS (Responsiva) */}
          <div className="w-full max-w-4xl flex flex-wrap content-start justify-center gap-3 sm:gap-6">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleStartTask(task)}
                className={`${task.color} transition-all duration-200 rounded-3xl flex flex-col items-center justify-center gap-2 sm:gap-3 w-[28%] min-w-[100px] sm:w-32 md:w-40 aspect-square border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_0_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.5)] transform hover:-translate-y-1 active:translate-y-2 relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                {renderIcon(task.icon, { size: 36, className: "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] relative z-10 sm:w-12 sm:h-12" })}
                <span className="font-medium text-xs sm:text-base text-white truncate w-11/12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] relative z-10">
                  {task.name}
                </span>
              </button>
            ))}
          </div>

          <button onClick={() => setView('summary')} className="absolute bottom-8 left-8 bg-slate-800 text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 border border-slate-700">
            <BarChart2 size={32} />
          </button>
          <button onClick={() => setIsAdding(true)} className="absolute bottom-8 right-8 bg-white text-slate-900 p-4 rounded-full shadow-lg hover:scale-105 active:scale-95">
            <Plus size={32} />
          </button>
        </main>
      )}

      {/* PANTALLA DE LA TAREA ACTIVA (Timer View) */}
      {view === 'timer' && (
        <main className="flex-1 flex flex-col items-center justify-start pt-6 pb-20 px-4 gap-6 overflow-y-auto w-full relative">
          
          {/* Si la alarma global suena mientras estamos en una tarea, mostramos el botón masivo para apagarla */}
          {isAlarmActive && (
             <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-center animate-in slide-in-from-top">
                <button 
                  onClick={() => setIsAlarmActive(false)}
                  className="px-6 py-3 sm:px-8 sm:py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all animate-bounce flex items-center gap-2 text-sm sm:text-base"
                >
                  <BellRing size={20} /> Apagar Alarma Global
                </button>
             </div>
          )}

          {/* RELOJ MAESTRO (Mostrado en la tarea activa pero más discreto) */}
          <div className="flex flex-col items-center mt-2">
            <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 ${isAlarmActive ? 'text-red-400' : 'text-slate-400'}`}>
              ⏳ Tiempo Restante Global
            </span>
            <div className={`text-5xl sm:text-7xl font-light tracking-tight tabular-nums drop-shadow-md transition-colors ${isAlarmActive ? 'text-red-400 animate-pulse' : 'text-white'}`}>
               {globalCountdown !== null ? formatTime(globalCountdown) : '--:--'}
            </div>
          </div>

          <div className="relative mt-2 sm:mt-4">
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse ${activeTask?.color}`}></div>
            <div className={`relative p-8 sm:p-10 rounded-full ${activeTask?.color} shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.5)] border border-white/20`}>
              {renderIcon(activeTask?.icon, { size: 60, className: "text-white drop-shadow-md sm:w-20 sm:h-20" })}
            </div>
          </div>
          
          {/* TIEMPO INVERTIDO EN ESTA TAREA ESPECÍFICA (Sub-registro) */}
          <div className="mt-2 flex flex-col items-center p-4 px-10 rounded-3xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm shadow-inner">
            <span className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-2">
               ⏱️ Tiempo en {activeTask?.name}
            </span>
            <div className="text-4xl sm:text-5xl font-medium tabular-nums text-blue-400 drop-shadow-sm">
              {formatTime(taskSeconds)}
            </div>
          </div>

          {/* Botón de Parar Tarea (Guarda y regresa al inicio, NO detiene el reloj maestro) */}
          <button
            onClick={handleStopTask}
            className="group relative flex items-center justify-center mt-6 w-20 h-20 sm:w-24 sm:h-24 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors border-2 border-red-500/50 hover:border-red-500 flex-shrink-0 shadow-[0_4px_10px_rgba(239,68,68,0.2)]"
          >
            <Square size={28} fill="currentColor" className="group-active:scale-90 transition-transform" />
            <span className="absolute -bottom-8 text-red-400 font-medium text-xs tracking-widest uppercase text-center">
              Guardar<br/>Registro
            </span>
          </button>
        </main>
      )}

      {/* PANTALLA DE RESUMEN / ESTADÍSTICAS */}
      {view === 'summary' && (
        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-2xl space-y-6 pb-20">
            
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg">
              <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <PieChart size={18} /> Distribución de 24 Horas
              </h3>
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full flex items-center justify-center relative shadow-inner mb-6 transition-all duration-500" style={{ background: `conic-gradient(${gradientStops.join(', ')})` }}>
                <div className="w-40 h-40 sm:w-48 sm:h-48 bg-slate-800 rounded-full flex flex-col items-center justify-center z-10 shadow-[inset_0_4px_10px_rgba(0,0,0,0.3)] border border-slate-700/50">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Enfocado</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{formatTime(grandTotalDuration)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 px-2"><Activity size={20} /> Desglose</h3>
              {statsArray.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-3xl border border-slate-700/50"><p className="text-slate-400">Sin actividades registradas.</p></div>
              ) : (
                statsArray.map((stat, idx) => (
                  <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${stat.color} shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] border border-white/10`}>
                        {renderIcon(stat.icon, { size: 28, className: "text-white drop-shadow-sm" })}
                      </div>
                      <div><p className="font-bold text-lg text-white">{stat.name}</p></div>
                    </div>
                    <div className="text-right"><p className="font-mono text-lg font-medium text-white">{formatTime(stat.totalDuration)}</p></div>
                  </div>
                ))
              )}
            </div>

            {/* Patrón del Día (Línea de tiempo de eventos) */}
            {history.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-700/50 w-full">
                <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 px-2">
                  <List size={20} /> Patrón del Día
                </h3>
                
                <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-4 py-2">
                  {history.map((session) => (
                    <div key={session.id} className="relative">
                      <div className={`absolute -left-[33px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${session.color} border-4 border-slate-900`}></div>
                      
                      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${session.color} shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/10`}>
                            {renderIcon(session.icon, { size: 18, className: "text-white drop-shadow-sm" })}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{session.taskName}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <p className="font-mono text-sm font-medium text-slate-300">
                          {formatTime(session.duration)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </main>
      )}

      {/* MODALES REUTILIZABLES (Añadir y Custom Time) */}
      {isAdding && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Nueva Tarea</h2><button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white"><X size={24} /></button></div>
            <form onSubmit={handleAddTask} className="space-y-6">
              <div><input type="text" autoFocus required maxLength={15} value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} placeholder="Ej: Leer libro..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500" /></div>
              <button type="submit" className="w-full bg-white text-slate-900 font-bold text-lg py-4 rounded-xl hover:bg-slate-200">Crear Tarea</button>
            </form>
          </div>
        </div>
      )}

      {showCustomTime && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Bloque de Tiempo</h2><button onClick={() => setShowCustomTime(false)} className="text-slate-400 hover:text-white"><X size={24} /></button></div>
            <form onSubmit={handleCustomTimeSubmit} className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-sm text-slate-400 mb-2">Horas</label><input type="number" min="0" max="23" value={customHrs} onChange={(e) => setCustomHrs(e.target.value)} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl" /></div>
                <div className="flex-1"><label className="block text-sm text-slate-400 mb-2">Minutos</label><input type="number" min="0" max="59" value={customMins} onChange={(e) => setCustomMins(e.target.value)} placeholder="0" autoFocus className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl" /></div>
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-600">Iniciar Reloj Maestro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}