import React, { useState, useEffect } from 'react';
import { Cloud, Server, Database, ArrowRight, ShieldCheck, Globe, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CloudPipeline = () => {
  const [pipelineState, setPipelineState] = useState('active');
  const [dataPoints, setDataPoints] = useState([]);

  // Generate "moving" data points in the pipeline
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Math.random().toString(36).substr(2, 9);
      setDataPoints(prev => [...prev, id]);
      setTimeout(() => {
        setDataPoints(prev => prev.filter(p => p !== id));
      }, 3000);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Server size={24} /></div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Gateway Edge</p>
              <p className="text-lg font-black text-slate-800">4 Active Nodes</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={24} /></div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Buffer Load</p>
              <p className="text-lg font-black text-slate-800">12% Capcaity</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Globe size={24} /></div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Cloud Sync</p>
              <p className="text-lg font-black text-slate-800">99.9% Success</p>
           </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-center">
         {/* Background Grid */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
         
         <div className="relative flex items-center justify-between max-w-5xl mx-auto w-full">
            
            {/* Edge Gateway */}
            <div className="flex flex-col items-center gap-4 z-10">
               <motion.div 
                 animate={{ scale: [1, 1.05, 1], borderColor: ['#334155', '#3b82f6', '#334155'] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="w-32 h-32 bg-slate-800/80 rounded-3xl border-2 border-slate-700 flex items-center justify-center shadow-lg backdrop-blur-md"
               >
                  <Server size={48} className="text-blue-400" />
               </motion.div>
               <span className="font-black text-sm text-slate-400 tracking-widest uppercase">Local Gateway</span>
            </div>

            {/* Pipeline Beam */}
            <div className="flex-1 h-1 bg-slate-800 relative mx-4">
               <div className="absolute inset-0 bg-blue-500/20 blur-md"></div>
               
               {/* Animated Data Points */}
               <AnimatePresence>
                  {dataPoints.map(id => (
                    <motion.div
                      key={id}
                      initial={{ left: '0%', opacity: 0 }}
                      animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 3, ease: 'linear' }}
                      className="absolute -top-1.5 w-4 h-4"
                    >
                       <div className="w-full h-full bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.8)] filter blur-[1px]"></div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>

            {/* Cloud Endpoint */}
            <div className="flex flex-col items-center gap-4 z-10">
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className="w-32 h-32 bg-blue-600/20 rounded-full border-2 border-blue-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.2)] backdrop-blur-md"
               >
                  <Cloud size={48} className="text-blue-400" />
               </motion.div>
               <span className="font-black text-sm text-blue-400 tracking-widest uppercase font-mono">Azure/AWS Cloud</span>
            </div>

         </div>

         <div className="mt-16 max-w-2xl mx-auto text-center relative">
            <h4 className="text-white text-xl font-bold mb-4">Real-Time Data Pipeline Active</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
               Each packet is being transformed, validated, and asynchronously transmitted to the cloud storage layer via secure MQTT/HTTPS bridge.
            </p>
         </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
         <h3 className="text-lg font-black text-slate-800 mb-6">Pipeline Compliance Status</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
               { label: 'Data Encryption', status: 'Compliant' },
               { label: 'End-to-End Auth', status: 'Compliant' },
               { label: 'Latency Check', status: 'Passed (<50ms)' },
               { label: 'Loss Ratio', status: '0.0001% (Safe)' }
            ].map((check, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{check.status}</span>
                 </div>
                 <p className="text-sm font-bold text-slate-700">{check.label}</p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default CloudPipeline;
