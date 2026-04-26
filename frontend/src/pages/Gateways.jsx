import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, Trash2, Power, PowerOff, Search, Server, 
  Settings, ChevronLeft, ChevronRight, ArrowUpDown, 
  Filter, Clock, Zap, X, History, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Gateways = () => {
  const { user } = useContext(AuthContext);
  const [gateways, setGateways] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState({ field: 'created_at', direction: 'desc' });
  const [newGateway, setNewGateway] = useState({ id: '', name: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingSettings, setEditingSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGatewayLogs, setSelectedGatewayLogs] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchGateways = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/gateways');
      setGateways(res.data);
    } catch (e) {
      console.error('Failed to fetch gateways', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
    const interval = setInterval(fetchGateways, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async (id) => {
    try {
        const res = await axios.get(`http://localhost:5000/api/gateways/${id}/logs`);
        setSelectedGatewayLogs({ id, ...res.data });
    } catch (e) {
        console.error('Failed to fetch diagnostics');
    }
  };

  // Real-time polling for diagnostics when modal is open
  useEffect(() => {
    let logInterval;
    if (selectedGatewayLogs?.id) {
        logInterval = setInterval(() => fetchLogs(selectedGatewayLogs.id), 3000);
    }
    return () => clearInterval(logInterval);
  }, [selectedGatewayLogs?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/gateways', newGateway);
      setNewGateway({ id: '', name: '' });
      setIsAdding(false);
      fetchGateways();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating gateway');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/gateways/${id}`, { is_enabled: !currentStatus });
      fetchGateways();
    } catch (e) {
      alert('Action failed');
    }
  };

  const handleUpdateSettings = async (e) => {
      e.preventDefault();
      try {
          await axios.patch(`http://localhost:5000/api/gateways/${editingSettings.id}/settings`, {
              heartbeat_interval: editingSettings.heartbeat_interval,
              traffic_rate: editingSettings.traffic_rate
          });
          setEditingSettings(null);
          fetchGateways();
      } catch (e) {
          alert('Update failed');
      }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will remove all associated devices.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/gateways/${id}`);
      fetchGateways();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const toggleSort = (field) => {
      setSortBy(prev => ({
          field,
          direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  // Processing: Filter -> Sort -> Paginate
  const filteredGateways = gateways
    .filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
        return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
        let valA = a[sortBy.field];
        let valB = b[sortBy.field];
        if (sortBy.field === 'last_heartbeat') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        }
        if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
        return 0;
    });

  const totalPages = Math.ceil(filteredGateways.length / itemsPerPage);
  const currentItems = filteredGateways.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 pb-10">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
              { label: 'Infrastructure Nodes', value: gateways.length, color: 'purple', icon: Server, id: 'all' },
              { label: 'Operational / Online', value: gateways.filter(g => g.status === 'online').length, color: 'emerald', icon: Activity, id: 'online' },
              { label: 'Link Terminated', value: gateways.filter(g => g.status === 'offline').length, color: 'red', icon: PowerOff, id: 'offline' }
          ].map(stat => (
              <button 
                key={stat.id}
                onClick={() => setStatusFilter(stat.id)}
                className={`p-8 rounded-[2rem] border transition-all text-left relative overflow-hidden group ${
                    statusFilter === stat.id 
                    ? `bg-slate-900 border-purple-500/50 shadow-[0_0_40px_rgba(124,58,237,0.1)]` 
                    : 'bg-slate-900/40 border-slate-800/50 hover:border-purple-500/30'
                }`}
              >
                  {statusFilter === stat.id && (
                      <motion.div 
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent pointer-events-none" 
                      />
                  )}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`p-4 rounded-2xl ${statusFilter === stat.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800 text-slate-400 group-hover:text-purple-400'} transition-all`}>
                          <stat.icon size={26} />
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full ${stat.id === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-slate-700'}`} />
                  </div>
                  <div className={`text-4xl font-black mb-1 ${statusFilter === stat.id ? 'text-white' : 'text-slate-300'}`}>{stat.value}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.25em] ${statusFilter === stat.id ? 'text-purple-400' : 'text-slate-500'}`}>{stat.label}</div>
              </button>
          ))}
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-md">
        <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all text-sm text-slate-300 placeholder:text-slate-600"
                />
            </div>
            
            {/* Status Selector - Custom Styled */}
            <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 pointer-events-none" size={16} />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-11 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-sm outline-none focus:border-purple-500/50 transition-all text-slate-300 font-bold tracking-wide cursor-pointer hover:border-slate-700"
                >
                    <option value="all" className="bg-[#0a0c1a]">All Clusters</option>
                    <option value="online" className="bg-[#0a0c1a]">Active Only</option>
                    <option value="offline" className="bg-[#0a0c1a]">Disconnected</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ArrowUpDown size={14} />
                </div>
            </div>
        </div>
        
        {user?.role === 'Admin' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-bold text-sm shadow-xl shadow-purple-900/20 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Provision Gateway
          </button>
        )}
      </div>

      {isAdding && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0c1a] p-8 rounded-[2rem] border border-purple-500/30 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Server size={120} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
            <div className="p-2 bg-purple-500/10 rounded-lg">
                <Server className="text-purple-400" size={20} />
            </div>
            Initialize New Infrastructure Unit
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Serial Identifier</label>
                <input
                    type="text"
                    placeholder="Leave empty for auto-gen"
                    value={newGateway.id}
                    onChange={(e) => setNewGateway({...newGateway, id: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-900/50 border border-slate-800 rounded-xl outline-none focus:border-purple-500/50 text-slate-300 placeholder:text-slate-700"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Descriptive Alias</label>
                <input
                    type="text"
                    placeholder="e.g. Edge Node Delta"
                    value={newGateway.name}
                    onChange={(e) => setNewGateway({...newGateway, name: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-900/50 border border-slate-800 rounded-xl outline-none focus:border-purple-500/50 text-slate-300 placeholder:text-slate-700"
                    required
                />
            </div>
            <div className="flex items-end gap-3">
               <button type="submit" className="flex-1 bg-white text-black py-3 rounded-xl font-black hover:bg-slate-200 transition-all uppercase tracking-tighter shadow-lg active:scale-95">Deploy Node</button>
               <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-3 text-slate-400 hover:text-white transition-colors font-bold text-sm">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Settings Modal Overlay */}
      {editingSettings && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#0a0c1a] w-full max-w-lg rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] p-10 border border-slate-800/50 relative overflow-hidden"
              >
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 blur-[60px] rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-center mb-10 relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-purple-500/10 rounded-2xl">
                              <Settings className="text-purple-400" size={28} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-white tracking-tight">System Parameters</h3>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Simulation Tuning Control</p>
                          </div>
                      </div>
                      <button onClick={() => setEditingSettings(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
                  </div>
                  
                  <form onSubmit={handleUpdateSettings} className="space-y-10 relative z-10">
                      <div className="space-y-6">
                          <div>
                              <div className="flex justify-between items-end mb-4">
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <Clock size={14} className="text-purple-400" />
                                      Heartbeat Frequency
                                  </label>
                                  <span className="text-purple-400 font-mono text-xl font-bold">{editingSettings.heartbeat_interval}s</span>
                              </div>
                              <input 
                                type="range" min="1" max="60" 
                                value={editingSettings.heartbeat_interval} 
                                onChange={(e) => setEditingSettings({...editingSettings, heartbeat_interval: parseInt(e.target.value)})}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                  <span>High Performance</span>
                                  <span>Conservative</span>
                              </div>
                          </div>

                          <div>
                              <div className="flex justify-between items-end mb-4">
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <Zap size={14} className="text-amber-400" />
                                      Traffic Throughput
                                  </label>
                                  <span className="text-purple-400 font-mono text-xl font-bold">{editingSettings.traffic_rate}ms</span>
                              </div>
                              <input 
                                type="range" min="500" max="10000" step="500"
                                value={editingSettings.traffic_rate} 
                                onChange={(e) => setEditingSettings({...editingSettings, traffic_rate: parseInt(e.target.value)})}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                  <span>High Load</span>
                                  <span>Stable Load</span>
                              </div>
                          </div>
                      </div>

                      <button type="submit" className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-purple-500 transition-all shadow-xl shadow-purple-900/30 uppercase tracking-widest active:scale-95">
                          Commit Cluster Parameters
                      </button>
                  </form>
              </motion.div>
          </div>
      )}

      {/* Diagnostics Modal */}
      {selectedGatewayLogs && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[999] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0c1a] w-full max-w-5xl max-h-[85vh] rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border border-slate-800/50"
              >
                  <div className="p-10 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/20">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-emerald-500/10 rounded-2xl">
                             <Activity size={32} className="text-emerald-400" />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-white tracking-tight">Node Diagnostics: <span className="text-purple-400 font-mono">{selectedGatewayLogs.id}</span></h3>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                  Streaming Real-time Telemetry Data
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedGatewayLogs(null)} className="p-3 text-slate-500 hover:text-white transition-colors bg-slate-800/50 rounded-full"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 custom-scrollbar">
                      {/* Heartbeat Cluster */}
                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                              Signal Intercept Registry
                          </h4>
                          <div className="space-y-3">
                              {selectedGatewayLogs.heartbeatHistory.length > 0 ? selectedGatewayLogs.heartbeatHistory.map(log => (
                                  <div key={log.id} className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-slate-800/50 group hover:border-purple-500/30 transition-all">
                                      <div className="flex items-center gap-4">
                                          <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:animate-ping" />
                                          <span className="text-sm font-bold text-slate-300 font-mono">SIGNAL_OK_ACK</span>
                                      </div>
                                      <span className="text-xs text-slate-500 font-mono font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                              )) : (
                                  <div className="p-10 text-center border border-dashed border-slate-800 rounded-3xl text-slate-600 italic">No signals detected in current cycle.</div>
                              )}
                          </div>
                      </div>

                      {/* Status Transition History */}
                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                              State Transition Ledger
                          </h4>
                          <div className="relative border-l border-slate-800 ml-4 space-y-8 py-2">
                              {selectedGatewayLogs.statusHistory.length > 0 ? selectedGatewayLogs.statusHistory.map(log => (
                                  <div key={log.id} className="relative pl-8">
                                      <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-[#0a0c1a] ${log.new_status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                                      <div className="flex items-center gap-3 mb-1">
                                          <div className="text-sm font-black text-white tracking-wide uppercase">
                                              {log.old_status} <span className="text-slate-600 mx-1">→</span> {log.new_status}
                                          </div>
                                      </div>
                                      <p className="text-xs text-slate-500 font-medium mb-2 italic">"{log.reason || 'Manual Node Override'}"</p>
                                      <div className="text-[10px] text-slate-600 font-mono bg-slate-900/50 w-fit px-2 py-0.5 rounded-lg border border-slate-800/50">{new Date(log.timestamp).toLocaleString()}</div>
                                  </div>
                              )) : (
                                  <div className="p-10 text-center text-slate-600 italic pl-8">Initial state established. No transitions recorded.</div>
                              )}
                          </div>
                      </div>
                  </div>
              </motion.div>
          </div>
      )}

      {/* Table Container */}
      <div className="bg-slate-900/40 rounded-[2.5rem] shadow-2xl border border-slate-800/50 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/50">
                <th onClick={() => toggleSort('name')} className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer hover:text-purple-400 transition-colors group">
                  <div className="flex items-center gap-2">Infrastructure Unit <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Status</th>
                <th onClick={() => toggleSort('last_heartbeat')} className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer hover:text-purple-400 transition-colors group">
                   <div className="flex items-center gap-2">Latest Signal <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Node Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {loading ? (
                <tr><td colSpan="4" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Activity className="text-purple-500 animate-spin" size={32} />
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Accessing Registry...</span>
                  </div>
                </td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="4" className="px-8 py-20 text-center text-slate-600 italic font-medium text-sm">No infrastructure units matched current search criteria.</td></tr>
              ) : (
                currentItems.map((gtw) => (
                  <tr key={gtw.id} className="hover:bg-purple-500/5 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">{gtw.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono tracking-wider mt-1 uppercase font-bold">{gtw.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
                        gtw.status === 'online' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : 'bg-slate-800/30 text-slate-500 border-slate-700/50'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${gtw.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-600'}`}></span>
                        {gtw.status}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-slate-300 font-bold font-mono tracking-tight">{gtw.last_heartbeat ? new Date(gtw.last_heartbeat).toLocaleTimeString() : '---'}</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">{gtw.last_heartbeat ? new Date(gtw.last_heartbeat).toLocaleDateString() : 'NO_SIGNAL'}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-all">
                         <button 
                           onClick={() => fetchLogs(gtw.id)}
                           className="p-3 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"
                           title="Detailed Diagnostics"
                         >
                           <History size={20} />
                         </button>
                         <button 
                           onClick={() => setEditingSettings(gtw)}
                           className="p-3 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                           title="Simulation Tuning"
                         >
                           <Settings size={20} />
                         </button>
                         <button 
                          onClick={() => handleToggle(gtw.id, gtw.is_enabled)}
                          className={`p-3 rounded-xl transition-all ${gtw.is_enabled ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                          title={gtw.is_enabled ? 'Terminate Link' : 'Establish Link'}
                        >
                          {gtw.is_enabled ? <PowerOff size={20} /> : <Power size={20} />}
                        </button>
                        {user?.role === 'Admin' && (
                          <button 
                            onClick={() => handleDelete(gtw.id)}
                            className="p-3 text-slate-600 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Decommission Node"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="px-10 py-6 bg-slate-950/20 border-t border-slate-800/30 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">
                    Displaying {(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, filteredGateways.length)} / Total {filteredGateways.length} Units
                </div>
                <div className="flex gap-4">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Gateways;
