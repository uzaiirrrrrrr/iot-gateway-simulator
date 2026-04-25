import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ListFilter, Search, AlertCircle, Info, History, Download, Trash2, Activity, ShieldCheck, Terminal } from 'lucide-react';

const Logs = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'audit', 'traffic'
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = 'alerts';
      if (activeTab === 'audit') endpoint = 'audit';
      if (activeTab === 'traffic') endpoint = 'traffic-logs';
      
      const res = await axios.get(`http://localhost:5000/api/analytics/${endpoint}`);
      setData(res.data);
    } catch (e) {
      console.error('Log fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleClear = async () => {
    if (!window.confirm(`Clear all ${activeTab} history? This cannot be undone.`)) return;
    try {
      await axios.post('http://localhost:5000/api/analytics/clear', { type: activeTab });
      fetchData();
    } catch (e) {
      alert('Clear failed');
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = (item.message || item.severity || item.device_name || item.gateway_name || item.payload || '').toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
              <History size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-800">Intelligence Ledger</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Secure system event sequencing</p>
           </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
                { id: 'alerts', label: 'Alerts', icon: AlertCircle },
                { id: 'audit', label: 'Audit', icon: ShieldCheck },
                { id: 'traffic', label: 'Traffic', icon: Terminal }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setData([]); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                        activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Filter ${activeTab} stream...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs uppercase cursor-not-allowed opacity-50">
              <Download size={16} />
              Export
           </button>
           {user?.role === 'Admin' && (
             <button onClick={handleClear} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all font-bold text-xs uppercase">
                <Trash2 size={16} />
                Purge
             </button>
           )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <Activity className="animate-spin text-blue-500" size={32} />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Decrypting Logs...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
             <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Search size={24} />
             </div>
             <p className="text-slate-400 italic font-medium">No historical records found for this segment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Timestamp</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Classification</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Data Stream / Actor</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Metadata / Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-slate-400 tabular-nums font-mono text-xs">
                       {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${
                            log.severity === 'CRITICAL' || activeTab === 'audit' ? 'bg-red-50 text-red-600 border-red-100' : 
                            activeTab === 'traffic' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                       }`}>
                         {log.severity || (activeTab === 'traffic' ? 'PACKET' : 'AUDIT')}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-slate-800 font-bold">{log.message || log.device_name || log.action}</span>
                          {log.gateway_name && <span className="text-[10px] text-slate-400 font-bold uppercase">{log.gateway_name}</span>}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="max-w-md">
                          <p className="text-slate-600 font-medium truncate group-hover:whitespace-normal transition-all duration-300">
                             {log.details || log.payload || `Packet Offset: ${log.payload_size} bytes`}
                          </p>
                          {log.user_email && <span className="text-[10px] text-blue-500 font-mono">By: {log.user_email}</span>}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
