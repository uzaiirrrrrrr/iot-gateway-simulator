import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, Activity, AlertCircle, CheckCircle2, Search, Cpu, Thermometer, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const SystemHealth = () => {
  const [gateways, setGateways] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [gwRes, alertRes] = await Promise.all([
        axios.get('http://localhost:5000/api/gateways'),
        axios.get('http://localhost:5000/api/analytics/alerts?limit=10')
      ]);
      setGateways(gwRes.data);
      setAlerts(alertRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 5000);
    return () => clearInterval(inv);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-slate-800">System Health Monitor</h2>
         <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold ring-1 ring-emerald-200">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
            ALL SERVICES OPERATIONAL
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Gateway Heartbeats */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Heart size={16} className="text-red-500" />
               Gateway Heartbeat Status
            </h3>
            <div className="space-y-4">
               {gateways.map(g => (
                 <div key={g.id} className="p-4 rounded-xl border border-slate-50 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={`p-2.5 rounded-lg ${g.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Cpu size={20} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800">{g.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono italic">Missed heartbeats: 0</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                         g.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                       }`}>
                          {g.status}
                       </span>
                       <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-end">
                          <Clock size={10} /> {new Date(g.last_heartbeat).toLocaleTimeString()}
                       </p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Anomaly Detection Log */}
         <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Activity size={16} className="text-blue-500" />
               Intelligent Anomaly Engine
            </h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px]">
               {alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').map((alert, i) => (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   key={alert.id}
                   className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4"
                 >
                    <div className={alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}>
                       <AlertCircle size={20} />
                    </div>
                    <div>
                       <p className="text-sm text-slate-200 font-medium leading-relaxed">{alert.message}</p>
                       <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(alert.timestamp).toLocaleString()} | Source: {alert.gateway_id}</p>
                    </div>
                 </motion.div>
               ))}
               {alerts.length === 0 && <p className="text-center text-slate-600 italic py-12">No anomalies detected in the current flight window.</p>}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'CPU Temp', val: '42°C', icon: <Thermometer />, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Uptime', val: '99.99%', icon: <Clock />, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Threats Blocked', val: '14/Hr', icon: <AlertCircle />, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Data Accuracy', val: '98.2%', icon: <CheckCircle2 />, color: 'text-emerald-600', bg: 'bg-emerald-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className={`p-2 w-fit rounded-lg mb-4 ${stat.bg} ${stat.color}`}>
                 {stat.icon}
              </div>
              <p className="text-2xl font-black text-slate-800">{stat.val}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
           </div>
         ))}
      </div>
    </div>
  );
};

export default SystemHealth;
