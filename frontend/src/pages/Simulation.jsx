import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldAlert, ShieldCheck, Zap, AlertOctagon, Terminal, 
  Play, RotateCcw, Lock, Unlock, Shield, Printer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Simulation = () => {
  const { user } = useContext(AuthContext);
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [attackType, setAttackType] = useState('DDoS');
  const [intensity, setIntensity] = useState('High');
  const [isSecureMode, setIsSecureMode] = useState(true);
  const [isDefenseActive, setIsDefenseActive] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState(["[INFO] System initialized. Waiting for simulation vector..."]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGWs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/gateways');
        setGateways(res.data.filter(g => g.status === 'online'));
      } catch (e) {
        console.error("Failed to fetch gateways", e);
      }
    };
    fetchGWs();
  }, []);

  const addLog = (msg) => {
    setConsoleLogs(prev => [msg, ...prev].slice(0, 20));
  };

  const handleLaunchAttack = async () => {
    if (!selectedGateway) return alert('Select target gateway');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/analytics/attack', {
        targetGatewayId: selectedGateway,
        type: attackType,
        intensity
      });
      addLog(`[ATTACK] Initialized ${attackType} on ${selectedGateway} (${intensity})`);
    } catch (e) {
      addLog(`[ERROR] Failed to trigger attack vector.`);
    } finally {
      setLoading(false);
    }
  };

  const runDefense = (type) => {
    if (type === 'Deploy IPS') {
      setIsDefenseActive(!isDefenseActive);
      addLog(`[DEFENSE] ${!isDefenseActive ? 'IPS Engine Active' : 'IPS Engine Standby'} - Traffic scrubbing enabled.`);
    } else {
      addLog(`[DEFENSE] Executing ${type}... Buffer cleared.`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simulation Control */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <Terminal className="text-blue-600" size={24} />
            Attack Sandbox & Encryption Toggle
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isSecureMode ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                  {isSecureMode ? <Lock size={24} /> : <Unlock size={24} />}
                </div>
                <div>
                  <p className="font-black text-slate-800">{isSecureMode ? 'TLS 1.3 ENABLED' : 'PLAINTEXT MODE'}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{isSecureMode ? 'Secure Channel' : 'Vulnerable'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsSecureMode(!isSecureMode);
                  addLog(`[INFO] Global mode -> ${!isSecureMode ? 'INSECURE' : 'SECURE'}`);
                }}
                className={`px-6 py-2 rounded-full text-xs font-black transition-all ${
                  isSecureMode ? 'bg-slate-800 text-white hover:bg-black' : 'bg-red-600 text-white'
                }`}
              >
                TOGGLE
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Selection</h4>
               <div className="grid grid-cols-1 gap-4">
                  <select 
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Choose Target Gateway...</option>
                    {gateways.map(g => <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>)}
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={attackType}
                      onChange={(e) => setAttackType(e.target.value)}
                      className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="DDoS">DDoS Flood</option>
                      <option value="XML Injection">XML Injection</option>
                      <option value="Brute Force">Brute Force</option>
                    </select>
                    <select 
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="Low">Low Stress</option>
                      <option value="Medium">Moderate</option>
                      <option value="High">Critical</option>
                    </select>
                  </div>
               </div>
               
               <button 
                 disabled={loading || !selectedGateway || user?.role === 'Viewer'}
                 onClick={handleLaunchAttack}
                 className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
               >
                 LAUNCH ATTACK VECTOR
               </button>
            </div>
          </div>
        </div>

        {/* Console & Defense Summary */}
        <div className="flex flex-col gap-8">
           <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Terminal size={120} className="text-blue-500" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest">Kernel stream active</span>
                 </div>
                 <button onClick={() => setConsoleLogs([])} className="text-slate-500 hover:text-white transition-colors">
                    <RotateCcw size={16}/>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar relative z-10 min-h-[300px]">
                 <AnimatePresence>
                    {consoleLogs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className="font-mono text-[11px] leading-relaxed"
                      >
                         <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>{' '}
                         <span className={
                           log.includes('[ATTACK]') ? 'text-red-400' : 
                           log.includes('[DEFENSE]') ? 'text-emerald-400' : 
                           log.includes('[ERROR]') ? 'text-rose-600 font-bold' : 'text-blue-400'
                         }>
                            {log}
                         </span>
                      </motion.div>
                    ))}
                 </AnimatePresence>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <h3 className="font-black text-slate-800 mb-2 uppercase tracking-tight">Active Defense Layer</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Toggle automated IPS/IDS mitigation engines.</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => runDefense('Deploy IPS')}
                   className={`py-4 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-2 shadow-lg ${
                     isDefenseActive ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-slate-100 text-slate-600 border border-slate-200'
                   }`}
                 >
                    <Shield size={20} />
                    {isDefenseActive ? 'IPS ENGINE ON' : 'ACTIVATE IPS'}
                 </button>
                 <button 
                   onClick={() => runDefense('Flush Buffer')}
                   className="py-4 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-black transition-all flex flex-col items-center gap-2 shadow-lg shadow-slate-900/20"
                 >
                    <RotateCcw size={20} />
                    FLUSH BUFFER
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
