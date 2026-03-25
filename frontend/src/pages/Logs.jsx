import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ListFilter, Search, AlertCircle, Info, History, Download, Trash2 } from 'lucide-react';

const Logs = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('alerts');
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/analytics/alerts`);
      setData(res.data);
    } catch (e) {
      console.error('Log fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClear = async () => {
    if (!window.confirm('Clear all system alert history? This cannot be undone.')) return;
    try {
      await axios.post('http://localhost:5000/api/analytics/clear');
      fetchData();
    } catch (e) {
      alert('Clear failed');
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = (item.message || item.severity || '').toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
         <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <History size={24} />
         </div>
         <h2 className="text-2xl font-black text-slate-800">System Event Journal</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'alerts' ? 'alerts' : 'audit logs'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 text-sm"
          />
        </div>
        <div className="flex gap-2">
           <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title="Export as CSV">
              <Download size={18} />
           </button>
           {user?.role === 'Admin' && activeTab === 'alerts' && (
             <button onClick={handleClear} className="p-2.5 bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Clear Logs">
                <Trash2 size={18} />
             </button>
           )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 italic">Reading event buffer...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">No matching records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-tight">Timestamp</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-tight">Event / Action</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-tight">Details</th>
                  {activeTab === 'audit' && <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-tight">Actor</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 tabular-nums font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          {log.severity === 'CRITICAL' ? <AlertCircle className="text-red-500" size={16}/> : <Info className="text-blue-500" size={16}/>}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${log.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {log.severity}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                       {log.message}
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
