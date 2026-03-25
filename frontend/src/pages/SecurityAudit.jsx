import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, UserCheck, ShieldAlert, History, MapPin, Monitor, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const SecurityAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/analytics/audit');
        setLogs(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
         <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-150 transition-transform duration-700"></div>
            <Fingerprint size={64} className="relative z-10" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Behavior Audit Engine</h2>
            <p className="text-slate-500 font-medium max-w-xl">
               Automated tracking of user behavior patterns, session lifecycles, and access control audit trails for ISO compliance.
            </p>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
               <p className="text-2xl font-black text-emerald-700">Clean</p>
               <p className="text-[10px] font-bold text-emerald-600 uppercase">Profile Status</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
               <p className="text-2xl font-black text-slate-700">92%</p>
               <p className="text-[10px] font-bold text-slate-600 uppercase">Trust score</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <History size={18} className="text-blue-600" />
               Master Audit Ledger
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors uppercase tracking-widest">
               Export Ledger
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50">
                  <tr>
                     <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                     <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                     <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">User / Identity</th>
                     <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Context</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="4" className="px-8 py-12 text-center text-slate-400 italic">Decrypting audit stream...</td></tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-5 text-sm font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                       </td>
                       <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold ${
                            log.action.includes('REJECTED') || log.action.includes('ATTACK') 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-blue-50 text-blue-700'
                          }`}>
                             {log.action.includes('ATTACK') ? <ShieldAlert size={14} /> : <Key size={14} />}
                             {log.action}
                          </span>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <UserCheck size={16} />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{log.user_email || 'System Kernel'}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{log.ip_address}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-right whitespace-nowrap">
                          <p className="text-sm text-slate-600 italic font-medium">"{log.details}"</p>
                          <div className="flex justify-end gap-1 mt-1 opacity-40">
                             <Monitor size={10} /> <MapPin size={10} />
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
