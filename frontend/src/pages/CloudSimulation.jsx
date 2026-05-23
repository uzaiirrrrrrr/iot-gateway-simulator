import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Cloud, CloudLightning, CloudOff, Server, Play, Pause, 
  RefreshCw, Plus, Trash2, ArrowRight, Activity, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CloudSimulation = () => {
  const { user } = useContext(AuthContext);
  const [pipelines, setPipelines] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000); // 2s, 5s, 10s, 30s
  const [isPaused, setIsPaused] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPipeline, setNewPipeline] = useState({ name: '', provider: 'AWS', gateway_id: '' });
  
  // Simulated reconnection logs
  const [retryLogs, setRetryLogs] = useState([]);
  const [successCounts, setSuccessCounts] = useState({});
  const [failedCounts, setFailedCounts] = useState({});

  const fetchData = async () => {
    if (isPaused) return;
    try {
      const [pipeRes, gtwRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/pipelines'),
        axios.get('http://localhost:5000/api/gateways')
      ]);
      setPipelines(pipeRes.data);
      setGateways(gtwRes.data);
    } catch (e) {
      console.error('Failed to sync cloud simulations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Polling loop
  useEffect(() => {
    let loop;
    if (!isPaused) {
      loop = setInterval(fetchData, refreshInterval);
    }
    return () => clearInterval(loop);
  }, [refreshInterval, isPaused]);

  // Update success/failure simulation counts
  useEffect(() => {
    if (pipelines.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setSuccessCounts(prev => {
        const next = { ...prev };
        pipelines.forEach(p => {
          if (p.status === 'connected') {
            next[p.id] = (next[p.id] || 0) + Math.floor(Math.random() * 3) + 1;
          }
        });
        return next;
      });

      setFailedCounts(prev => {
        const next = { ...prev };
        pipelines.forEach(p => {
          if (p.status === 'disconnected') {
            next[p.id] = (next[p.id] || 0) + Math.floor(Math.random() * 2) + 1;
          }
        });
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [pipelines, isPaused]);

  const handleToggleStatus = async (id, currentStatus) => {
    if (user?.role === 'Viewer') return alert('Access Denied: Viewers cannot alter pipeline connection parameters.');
    const nextStatus = currentStatus === 'connected' ? 'disconnected' : 'reconnecting';
    
    try {
      // 1. Instantly patch status
      await axios.patch(`http://localhost:5000/api/analytics/pipelines/${id}/status`, { status: nextStatus });
      await fetchData();

      if (nextStatus === 'reconnecting') {
        const timestamp = new Date().toLocaleTimeString();
        setRetryLogs(prev => [`[${timestamp}] Initiated TLS Handshake sequence for Pipeline ${id}...`, ...prev]);
        
        // Simulating reconnection success after 4 seconds
        setTimeout(async () => {
          try {
            await axios.patch(`http://localhost:5000/api/analytics/pipelines/${id}/status`, { status: 'connected' });
            await fetchData();
            const successTimestamp = new Date().toLocaleTimeString();
            setRetryLogs(prev => [
              `[${successTimestamp}] Pipeline ${id} authenticated. Secure MQTT broker connection established!`, 
              `[${successTimestamp}] Retry session completed. AuthToken sync successful.`,
              ...prev
            ]);
          } catch (err) {
            console.error(err);
          }
        }, 4000);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        setRetryLogs(prev => [`[${timestamp}] Pipeline ${id} decommissioned / connection terminated by user override.`, ...prev]);
      }
    } catch (e) {
      alert('Failed to update pipeline status');
    }
  };

  const handleCreatePipeline = async (e) => {
    e.preventDefault();
    if (!newPipeline.gateway_id) return alert('Please select an active gateway to link.');
    try {
      await axios.post('http://localhost:5000/api/analytics/pipelines', newPipeline);
      setNewPipeline({ name: '', provider: 'AWS', gateway_id: '' });
      setIsAdding(false);
      await fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating pipeline');
    }
  };

  const handleDeletePipeline = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this pipeline?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/analytics/pipelines/${id}`);
      await fetchData();
    } catch (e) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Metrics Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
              <Cloud size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Sim Ingestion Streams</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">{pipelines.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configured Cloud Pipelines</div>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 animate-pulse">
              <CheckCircle size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Connected Nodes</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {pipelines.filter(p => p.status === 'connected').length} / {pipelines.length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Safe Ingress Pipelines</div>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-red-500/10 rounded-2xl text-red-400">
              <CloudOff size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Active Outages</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {pipelines.filter(p => p.status === 'disconnected').length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipelines Simulating Drops</div>
        </div>
      </div>

      {/* Controller bar: auto refresh adjustments and create trigger */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-3 rounded-2xl transition-all border ${
              isPaused 
                ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-900/20' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>

          {/* Refresh Intervals Selector */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/50">
            {[2000, 5000, 10000, 30000].map(val => (
              <button
                key={val}
                disabled={isPaused}
                onClick={() => setRefreshInterval(val)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-20 ${
                  refreshInterval === val && !isPaused
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {val / 1000}s Sync
              </button>
            ))}
          </div>
        </div>

        {user?.role === 'Admin' && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Provision Cloud Pipeline
          </button>
        )}
      </div>

      {/* Provisioning Drawer */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0c1a] p-8 rounded-[2rem] border border-purple-500/30 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Cloud size={100} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-white">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Cloud size={18} />
            </div>
            Deploy Virtual Cloud Pipeline
          </h3>
          <form onSubmit={handleCreatePipeline} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Pipeline Name</label>
              <input
                type="text"
                placeholder="e.g. AWS Production Ingress"
                value={newPipeline.name}
                onChange={(e) => setNewPipeline({...newPipeline, name: e.target.value})}
                className="w-full px-5 py-3 bg-slate-900/50 border border-slate-800 rounded-xl outline-none focus:border-purple-500/50 text-slate-300 placeholder:text-slate-700 text-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cloud Provider</label>
              <select
                value={newPipeline.provider}
                onChange={(e) => setNewPipeline({...newPipeline, provider: e.target.value})}
                className="w-full px-5 py-3 bg-slate-900/50 border border-slate-800 rounded-xl outline-none focus:border-purple-500/50 text-slate-300 text-sm font-bold"
              >
                <option value="AWS" className="bg-[#0a0c1a]">AWS IoT Core</option>
                <option value="Azure" className="bg-[#0a0c1a]">Azure IoT Hub</option>
                <option value="Custom" className="bg-[#0a0c1a]">Custom MQTT Broker</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mapped Edge Gateway</label>
              <select
                value={newPipeline.gateway_id}
                onChange={(e) => setNewPipeline({...newPipeline, gateway_id: e.target.value})}
                className="w-full px-5 py-3 bg-slate-900/50 border border-slate-800 rounded-xl outline-none focus:border-purple-500/50 text-slate-300 text-sm font-bold"
                required
              >
                <option value="" className="bg-[#0a0c1a]">Select Gateway</option>
                {gateways.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-lg active:scale-95">Commit Deployment</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-3 text-slate-400 hover:text-white transition-colors font-bold text-sm">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SVG Pipeline Map & Node Map */}
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-8 relative overflow-hidden backdrop-blur-md">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Virtual Cloud Pipelines Map</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">SVG telemetry visualization pathways</p>
          </div>
          <div className="text-[9px] font-mono text-slate-500 font-black uppercase tracking-widest">Active Channels</div>
        </div>

        {/* Pipeline Builder Visual Graph */}
        <div className="relative border border-slate-800/50 bg-slate-950/80 p-8 rounded-3xl min-h-[350px] flex flex-col justify-center overflow-x-auto custom-scrollbar">
          {pipelines.length === 0 ? (
            <div className="text-center py-20 text-slate-600 italic">No cloud pipelines deployed. Deploy a pipeline above to map transmissions.</div>
          ) : (
            <div className="w-full min-w-[800px] grid grid-cols-3 gap-24 relative px-10">
              {/* Column 1: Mapped Gateways */}
              <div className="flex flex-col gap-16 justify-center">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-2">Edge Gateways</h4>
                {pipelines.map(pl => {
                  const mappedGtw = gateways.find(g => g.id === pl.gateway_id);
                  return (
                    <div key={`gtw-node-${pl.id}`} className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <Server size={20} />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-white">{mappedGtw ? mappedGtw.name : 'Unmapped Node'}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{pl.gateway_id || 'STANDBY'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Column 2: Visual Transmission Pipes (SVG pathways) */}
              <div className="absolute inset-0 pointer-events-none w-full h-full">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {pipelines.map((pl, idx) => {
                    // Approximate node coordinate metrics to plot SVG lines between cols
                    const startY = 70 + idx * 82;
                    const endY = 70 + idx * 82;
                    
                    const isConnected = pl.status === 'connected';
                    const isReconnecting = pl.status === 'reconnecting';

                    return (
                      <g key={`svg-pipe-${pl.id}`}>
                        {/* Static Background wire */}
                        <path 
                          d={`M 260 ${startY} H 530`} 
                          stroke={isConnected ? '#0f172a' : isReconnecting ? '#451a03' : '#7f1d1d'} 
                          strokeWidth="4" 
                          fill="none" 
                        />
                        {/* Active core flow lines */}
                        <path 
                          d={`M 260 ${startY} H 530`} 
                          stroke={isConnected ? '#10b981' : isReconnecting ? '#d97706' : '#ef4444'} 
                          strokeWidth="2" 
                          fill="none"
                          opacity="0.3"
                        />
                        {/* Floating packets */}
                        {isConnected && (
                          <motion.circle 
                            r="5" 
                            fill="#10b981"
                            animate={{ cx: [260, 530] }}
                            transition={{ duration: 2.5 + Math.random(), repeat: Infinity, ease: "linear" }}
                            style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
                            cy={startY}
                          />
                        )}
                        {isReconnecting && (
                          <motion.circle 
                            r="5" 
                            fill="#d97706"
                            animate={{ cx: [260, 395] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            cy={startY}
                          />
                        )}
                        {/* Dropping packets: break halfway */}
                        {pl.status === 'disconnected' && (
                          <motion.circle 
                            r="5" 
                            fill="#ef4444"
                            animate={{ 
                              cx: [260, 395],
                              opacity: [1, 1, 0],
                              scale: [1, 1, 0]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            cy={startY}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Column 3: Cloud Target Systems */}
              <div className="flex flex-col gap-16 justify-center relative">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-2">Cloud Providers</h4>
                {pipelines.map(pl => {
                  const isConnected = pl.status === 'connected';
                  const isReconnecting = pl.status === 'reconnecting';

                  return (
                    <div 
                      key={`cloud-node-${pl.id}`} 
                      onClick={() => handleToggleStatus(pl.id, pl.status)}
                      className={`relative p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 group shadow-xl ${
                        isConnected 
                          ? 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40' 
                          : isReconnecting
                            ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-red-950/10 border-red-500/20 hover:border-red-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-4 truncate">
                        <div className={`p-3 rounded-xl transition-all ${
                          isConnected 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : isReconnecting 
                              ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                              : 'bg-red-500/10 text-red-500'
                        }`}>
                          {isConnected ? <Cloud size={20} /> : isReconnecting ? <CloudLightning size={20} /> : <CloudOff size={20} />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-black text-white group-hover:text-purple-400 transition-colors">{pl.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{pl.provider} broker</div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-4 pl-4">
                        <div className="text-right">
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Rate (PKT)</div>
                          <div className="text-xs font-black font-mono mt-0.5 text-slate-300">
                            {isConnected 
                              ? `TX: ${successCounts[pl.id] || 0}` 
                              : `ERR: ${failedCounts[pl.id] || 0}`
                            }
                          </div>
                        </div>
                        
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          isConnected 
                            ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' 
                            : isReconnecting
                              ? 'bg-amber-500 shadow-[0_0_8px_#d97706] animate-pulse'
                              : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cloud pipelines CRUD table and Connection Retry Loggers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Retry and Auth Logs panel */}
        <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-8 backdrop-blur-md flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-lg font-black text-white tracking-tight">Reconnection Retry Logs</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live cloud handshakes registry</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/50 p-6 rounded-2xl font-mono text-[10px] text-slate-400 space-y-3 h-[250px] overflow-y-auto custom-scrollbar flex-1">
            {retryLogs.length === 0 ? (
              <div className="text-slate-600 italic text-center py-16">No network authorization events recorded in this session. Flow stable.</div>
            ) : (
              retryLogs.map((log, index) => {
                const isSuccess = log.includes('authenticated') || log.includes('successful');
                const isWarning = log.includes('Initiated');
                return (
                  <div key={index} className={`pb-2.5 last:pb-0 border-b border-slate-900/30 last:border-0 ${isSuccess ? 'text-emerald-400' : isWarning ? 'text-amber-500' : 'text-red-400'}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pipeline deployment list */}
        <div className="lg:col-span-2 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-8 backdrop-blur-md flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-lg font-black text-white tracking-tight">Active Pipelines Registry</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cloud endpoints and authorization tags</p>
          </div>

          <div className="overflow-x-auto max-h-[250px] overflow-y-auto custom-scrollbar flex-1 border border-slate-800/30 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Pipeline</th>
                  <th className="px-6 py-4">Cloud Destination</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20 text-xs font-medium text-slate-300">
                {pipelines.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-600 italic">No cloud pipelines deployed. Link one above.</td></tr>
                ) : (
                  pipelines.map(pl => (
                    <tr key={pl.id} className="hover:bg-purple-500/5 transition-all">
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{pl.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{pl.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-800/50 text-slate-400 border border-slate-700">
                          {pl.provider} INGRESS
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                          pl.status === 'connected' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : pl.status === 'reconnecting'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pl.status === 'connected' ? 'bg-emerald-400 shadow-sm animate-pulse' : pl.status === 'reconnecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          {pl.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(pl.id, pl.status)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                              pl.status === 'connected'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {pl.status === 'connected' ? 'Disconnect' : 'Connect'}
                          </button>
                          
                          {user?.role === 'Admin' && (
                            <button
                              onClick={() => handleDeletePipeline(pl.id)}
                              className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
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
        </div>
      </div>
    </div>
  );
};

export default CloudSimulation;
