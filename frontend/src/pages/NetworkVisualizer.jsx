import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, ShieldAlert, Wifi, Zap, Lock, Unlock, ArrowDownUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkVisualizer = () => {
  const [packets, setPackets] = useState([]);
  const [securityScore, setSecurityScore] = useState(98);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/analytics/alerts?limit=5');
          const trafficRes = await axios.get('http://localhost:5000/api/analytics/stats?timeRange=1h');
          
          // Generate pseudo-live packets based on real data trend
          const newPacket = {
            id: Math.random().toString(36).substr(2, 9),
            time: new Date().toLocaleTimeString(),
            source: 'Device-' + Math.floor(Math.random() * 20),
            size: Math.floor(Math.random() * 400) + 50,
            isSecure: Math.random() > 0.1,
            type: Math.random() > 0.8 ? 'MQTT' : 'HTTP/S'
          };
          
          setPackets(prev => [newPacket, ...prev].slice(0, 15));
          
          // Adjust security score based on alerts
          if (res.data.some(a => a.severity === 'CRITICAL')) {
             setSecurityScore(prev => Math.max(prev - 2, 45));
          } else {
             setSecurityScore(prev => Math.min(prev + 0.1, 100));
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
         <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${securityScore > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
               {securityScore > 80 ? <Shield size={32} /> : <ShieldAlert size={32} />}
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Posture</h2>
               <p className="text-slate-500 font-medium">Network integrity is currently <span className={securityScore > 80 ? 'text-emerald-600' : 'text-red-600'}>{securityScore > 80 ? 'Optimal' : 'Degraded'}</span></p>
            </div>
         </div>
         <div className="text-right">
            <div className="text-4xl font-black text-slate-800">{securityScore.toFixed(1)}%</div>
            <div className="w-48 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${securityScore}%` }}
                 className={`h-full ${securityScore > 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Live Traffic Feed */}
         <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="flex items-center justify-between mb-6 relative">
               <h3 className="text-white font-bold flex items-center gap-2">
                  <Wifi size={18} className="text-blue-400" />
                  Live Communication Visualizer
               </h3>
               <button 
                onClick={() => setIsLive(!isLive)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50' : 'bg-red-500/10 text-red-400 border border-red-500/50'}`}
               >
                  {isLive ? 'LIVE' : 'PAUSED'}
               </button>
            </div>

            <div className="space-y-3 relative h-[450px] overflow-hidden">
               <AnimatePresence mode="popLayout">
                  {packets.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${p.isSecure ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                             {p.isSecure ? <Lock size={16} /> : <Unlock size={16} />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{p.source}</p>
                             <p className="text-[10px] text-slate-500 font-mono italic">{p.isSecure ? 'TLS 1.3 Encrypted' : 'Plaintext Protocol (Insecure)'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-slate-300">{p.size} Bytes</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{p.type}</p>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         </div>

         {/* Protocol Distribution */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Traffic Distribution</h3>
               <div className="space-y-6">
                  <div>
                     <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">Encrypted (TLS)</span>
                        <span className="text-emerald-600 font-bold">88%</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[88%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">Unencrypted (HTTP)</span>
                        <span className="text-red-600 font-bold">12%</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-[12%] shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
               <div className="flex items-center gap-3 mb-4">
                  <ArrowDownUp size={24} />
                  <h3 className="font-bold text-lg">Active Flow</h3>
               </div>
               <p className="text-sm text-blue-100 leading-relaxed opacity-90">
                  Interception engine is actively monitoring packet headers for potential MITM (Man-in-the-Middle) attempts.
               </p>
               <button className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold backdrop-blur-sm transition-all">
                  EXPORT PCAP BUFFER
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default NetworkVisualizer;
