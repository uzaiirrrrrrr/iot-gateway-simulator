import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, Play, CheckCircle2, Circle, 
  RotateCcw, Info, Trophy, Timer, AlertCircle, 
  ShieldCheck, Lock, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TrainingEnvironment = () => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('idle'); // idle, running, success, failing
  const [tasks, setTasks] = useState([]);
  const [timer, setTimer] = useState(0);
  const [logs, setLogs] = useState([]);

  const SCENARIOS = [
    { 
      id: 'DDOS_MITIGATION', 
      title: 'DDoS Defense Drill', 
      difficulty: 'Expert',
      desc: 'A massive UDP flood is hitting Gateway Alpha. Identify the source and apply rate-limiting before the buffer overflows.',
      initialTasks: [
        { id: 1, label: 'Identify Attack Source', completed: false },
        { id: 2, label: 'Enable Rate Limiting (IPS)', completed: false },
        { id: 3, label: 'Verify Traffic Normalization', completed: false }
      ]
    },
    { 
       id: 'INJECTION_REPAIR', 
       title: 'SQL/XML Injection Neutralization', 
       difficulty: 'Intermediate',
       desc: 'Malicious payloads are being detected in the data stream. Isolate the affected device and sanitize the input buffer.',
       initialTasks: [
         { id: 1, label: 'Locate Compromised Device', completed: false },
         { id: 2, label: 'Deploy Sanitizer Hook', completed: false },
         { id: 3, label: 'Restart Data Sync Pipeline', completed: false }
       ]
    },
    { 
       id: 'SYSTEM_RECOVERY', 
       title: 'Post-Breach System Recovery', 
       difficulty: 'Beginner',
       desc: 'The system has been isolated following a detected breach. Restore service heartbeats while maintaining security protocols.',
       initialTasks: [
         { id: 1, label: 'Perform Integrity Check', completed: false },
         { id: 2, label: 'Re-authorize Gateway Nodes', completed: false },
         { id: 3, label: 'Resume Cloud Uplink', completed: false }
       ]
    }
  ];

  useEffect(() => {
    let interval;
    if (sessionStatus === 'running') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  const startScenario = (sc) => {
    setActiveScenario(sc);
    setTasks(sc.initialTasks);
    setSessionStatus('running');
    setTimer(0);
    setLogs([`[SESSION] ${sc.title} started.`, `[INFO] ${sc.desc}`]);
  };

  const completeTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    addLog(`[ACTION] Task "${tasks.find(t => t.id === id).label}" completed.`);
    
    // Check if all done
    if (tasks.every(t => t.id === id ? true : t.completed)) {
       setSessionStatus('success');
       addLog(`[SUCCESS] Drills completed! System integrity restored.`);
    }
  };

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`, ...prev]);
  };

  const reset = () => {
    setActiveScenario(null);
    setSessionStatus('idle');
    setTasks([]);
    setTimer(0);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
               <Trophy size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">Simulator Training Lab</h2>
               <p className="text-slate-500 font-medium italic">Interactive cyber-defense drills for IoT security specialists</p>
            </div>
         </div>
         {sessionStatus !== 'idle' && (
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                 <p className="text-xl font-mono text-slate-800">{String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}</p>
              </div>
              <button 
                onClick={reset}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all"
              >
                 <RotateCcw size={20} />
              </button>
           </div>
         )}
      </div>

      {!activeScenario ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {SCENARIOS.map(sc => (
             <motion.div 
               whileHover={{ y: -10 }}
               key={sc.id}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col group relative overflow-hidden h-full"
             >
                <div className="absolute inset-0 bg-blue-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                         <Play size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        sc.difficulty === 'Expert' ? 'bg-red-50 text-red-600' : sc.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                         {sc.difficulty}
                      </span>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{sc.title}</h3>
                   <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8 flex-1 opacity-80 italic">"{sc.desc}"</p>
                   <button 
                     onClick={() => startScenario(sc)}
                     className="w-full py-4 bg-slate-900 group-hover:bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-slate-900/10 group-hover:shadow-blue-600/20 transition-all duration-500 active:scale-95"
                   >
                      BEGIN DRILL
                   </button>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
           {/* Task List */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-8">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">Mission Objectives</h3>
                 <span className="text-xs font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full ring-1 ring-blue-100">
                    {sessionStatus === 'running' ? 'Active Session' : 'Briefing Complete'}
                 </span>
              </div>
              
              <div className="space-y-6">
                 {tasks.map(t => (
                   <div 
                     key={t.id} 
                     onClick={() => !t.completed && completeTask(t.id)}
                     className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                       t.completed 
                       ? 'bg-emerald-50 border-emerald-500/20 text-emerald-700' 
                       : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-white shadow-sm'
                     }`}
                   >
                      <div className="flex items-center gap-6">
                         <div className={t.completed ? 'text-emerald-500' : 'text-slate-300'}>
                            {t.completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                         </div>
                         <div>
                            <p className={`font-black tracking-tight ${t.completed ? 'line-through opacity-50' : ''}`}>{t.label}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">{t.completed ? 'Success' : 'Awaiting input'}</p>
                         </div>
                      </div>
                      {!t.completed && (
                        <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg group hover:bg-blue-600 hover:text-white transition-colors">
                           <ShieldCheck size={18} />
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              {sessionStatus === 'success' && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl text-white text-center shadow-2xl shadow-emerald-500/30"
                >
                   <Trophy size={48} className="mx-auto mb-4" />
                   <h4 className="text-2xl font-black mb-2">Drill Mastered!</h4>
                   <p className="text-sm font-medium opacity-90 mb-6 font-mono">Session Ref: TR-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                   <button 
                     onClick={reset}
                     className="px-8 py-3 bg-white text-emerald-600 rounded-xl font-black text-sm hover:bg-emerald-50 transition-all uppercase tracking-widest shadow-lg"
                   >
                      NEXT CHALLENGE
                   </button>
                </motion.div>
              )}
           </div>

           {/* Live Simulator Console */}
           <div className="flex flex-col gap-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                       <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] font-mono">Simulator Intelligence Stream</h4>
                    </div>
                    <Terminal size={18} className="text-slate-700" />
                 </div>
                 
                 <div className="flex-1 font-mono text-xs overflow-y-auto max-h-[350px] space-y-3 custom-scrollbar pr-4">
                    <AnimatePresence>
                       {logs.map((log, i) => (
                         <motion.div 
                           initial={{ opacity: 0, x: -5 }}
                           animate={{ opacity: 1, x: 0 }}
                           key={i} 
                           className="leading-relaxed border-l border-white/5 pl-3"
                         >
                            <span className={
                              log.includes('[SUCCESS]') ? 'text-emerald-400' :
                              log.includes('[ACTION]') ? 'text-blue-400' :
                              log.includes('[SESSION]') ? 'text-indigo-400 font-bold' : 'text-slate-500 italic'
                            }>
                               {log}
                            </span>
                         </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertCircle size={48} className="text-amber-600" />
                 </div>
                 <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Info size={20} /></div>
                 <div>
                    <h5 className="font-black text-amber-800 text-sm tracking-tight mb-1">PRO TIP: Real-world Simulation</h5>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                       In a real deployment, these actions would trigger automatic firewall rule updates across the entire cluster.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrainingEnvironment;
