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
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
              { label: 'Total Nodes', value: gateways.length, color: 'blue', icon: Server, id: 'all' },
              { label: 'Active/Online', value: gateways.filter(g => g.status === 'online').length, color: 'emerald', icon: Activity, id: 'online' },
              { label: 'Unresponsive', value: gateways.filter(g => g.status === 'offline').length, color: 'slate', icon: PowerOff, id: 'offline' }
          ].map(stat => (
              <button 
                key={stat.id}
                onClick={() => setStatusFilter(stat.id)}
                className={`p-6 rounded-3xl border transition-all text-left group ${
                    statusFilter === stat.id 
                    ? `bg-${stat.color}-600 border-${stat.color}-600 text-white shadow-xl shadow-${stat.color}-500/20` 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                  <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${statusFilter === stat.id ? 'bg-white/20' : `bg-${stat.color}-50 text-${stat.color}-600`}`}>
                          <stat.icon size={24} />
                      </div>
                      <div className={`h-2 w-2 rounded-full ${stat.id === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  </div>
                  <div className={`text-3xl font-black ${statusFilter === stat.id ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${statusFilter === stat.id ? 'text-white/70' : 'text-slate-400'}`}>{stat.label}</div>
              </button>
          ))}
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                />
            </div>
            <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
            </select>
        </div>
        
        {user?.role === 'Admin' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus size={18} />
            Provision Gateway
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border-2 border-blue-500/20 shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Server className="text-blue-500" size={20} />
            Add New Gateway
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Unique ID (Optional)</label>
                <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newGateway.id}
                    onChange={(e) => setNewGateway({...newGateway, id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Gateway Name</label>
                <input
                    type="text"
                    placeholder="Enter descriptive name"
                    value={newGateway.name}
                    onChange={(e) => setNewGateway({...newGateway, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    required
                />
            </div>
            <div className="flex items-end gap-2 pb-[1px]">
               <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Start Gateway</button>
               <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Modal Overlay */}
      {editingSettings && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 border border-slate-200"
              >
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <Settings className="text-blue-600" size={24} />
                          Gateway Simulation Control
                      </h3>
                      <button onClick={() => setEditingSettings(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleUpdateSettings} className="space-y-8">
                      <div>
                          <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <Clock size={16} className="text-slate-400" />
                                  Heartbeat Interval (Seconds)
                              </label>
                              <span className="text-blue-600 font-bold">{editingSettings.heartbeat_interval}s</span>
                          </div>
                          <input 
                            type="range" min="1" max="60" 
                            value={editingSettings.heartbeat_interval} 
                            onChange={(e) => setEditingSettings({...editingSettings, heartbeat_interval: parseInt(e.target.value)})}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <p className="text-[10px] text-slate-400 mt-2 italic">Defines how often the gateway signals its health to the core processor.</p>
                      </div>

                      <div>
                          <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <Zap size={16} className="text-slate-400" />
                                  Simulation Traffic Rate (ms)
                              </label>
                              <span className="text-blue-600 font-bold">{editingSettings.traffic_rate}ms</span>
                          </div>
                          <input 
                            type="range" min="500" max="10000" step="500"
                            value={editingSettings.traffic_rate} 
                            onChange={(e) => setEditingSettings({...editingSettings, traffic_rate: parseInt(e.target.value)})}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <p className="text-[10px] text-slate-400 mt-2 italic">Defines the delay between synthetic traffic packet generations.</p>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">Apply Parameters</button>
                      </div>
                  </form>
              </motion.div>
          </div>
      )}

      {/* Diagnostics Modal */}
      {selectedGatewayLogs && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">System Diagnostics: {selectedGatewayLogs.id}</h3>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Real-time Telemetry & Health History</p>
                      </div>
                      <button onClick={() => setSelectedGatewayLogs(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Heartbeat Cluster */}
                      <div>
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                              <Zap size={16} className="text-amber-500" />
                              Heartbeat Signal Registry
                          </h4>
                          <div className="space-y-2">
                              {selectedGatewayLogs.heartbeatHistory.length > 0 ? selectedGatewayLogs.heartbeatHistory.map(log => (
                                  <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                          <span className="text-sm font-mono text-slate-600">Signal Acknowledged</span>
                                      </div>
                                      <span className="text-xs text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                              )) : (
                                  <p className="text-sm text-slate-400 italic py-4">No recent signals detected.</p>
                              )}
                          </div>
                      </div>

                      {/* Status Transition History */}
                      <div>
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                              <Activity size={16} className="text-blue-500" />
                              State Transitions
                          </h4>
                          <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                              {selectedGatewayLogs.statusHistory.length > 0 ? selectedGatewayLogs.statusHistory.map(log => (
                                  <div key={log.id} className="relative pl-6">
                                      <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${log.new_status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                      <div className="text-sm font-bold text-slate-800">
                                          {log.old_status.toUpperCase()} → {log.new_status.toUpperCase()}
                                      </div>
                                      <p className="text-xs text-slate-500 mt-0.5">{log.reason || 'Manual Operator Override'}</p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                  </div>
                              )) : (
                                  <p className="text-sm text-slate-400 italic py-4 pl-6">No status changes recorded.</p>
                              )}
                          </div>
                      </div>
                  </div>
              </motion.div>
          </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th onClick={() => toggleSort('name')} className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] cursor-pointer hover:text-blue-600 transition-colors">
                <div className="flex items-center gap-2">Gateway <ArrowUpDown size={12} /></div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">Status</th>
              <th onClick={() => toggleSort('last_heartbeat')} className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] cursor-pointer hover:text-blue-600 transition-colors">
                 <div className="flex items-center gap-2">Last Activity <ArrowUpDown size={12} /></div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] text-right">Simulation Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">Synchronizing simulation state...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No gateways matching criteria.</td></tr>
            ) : (
              currentItems.map((gtw) => (
                <tr key={gtw.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{gtw.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">{gtw.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      gtw.status === 'online' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${gtw.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {gtw.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 font-medium">{gtw.last_heartbeat ? new Date(gtw.last_heartbeat).toLocaleTimeString() : '---'}</div>
                    <div className="text-[10px] text-slate-400">{gtw.last_heartbeat ? new Date(gtw.last_heartbeat).toLocaleDateString() : 'Inactive'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <button 
                         onClick={() => fetchLogs(gtw.id)}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                         title="Detailed Diagnostics"
                       >
                         <History size={18} />
                       </button>
                       <button 
                         onClick={() => setEditingSettings(gtw)}
                         className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                         title="Simulation Settings"
                       >
                         <Settings size={18} />
                       </button>
                       <button 
                        onClick={() => handleToggle(gtw.id, gtw.is_enabled)}
                        className={`p-2 rounded-lg transition-all ${gtw.is_enabled ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        title={gtw.is_enabled ? 'Disable' : 'Enable'}
                      >
                        {gtw.is_enabled ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      {user?.role === 'Admin' && (
                        <button 
                          onClick={() => handleDelete(gtw.id)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Showing {(currentPage-1)*itemsPerPage + 1} to {Math.min(currentPage*itemsPerPage, filteredGateways.length)} of {filteredGateways.length}
                </div>
                <div className="flex gap-2">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Gateways;
