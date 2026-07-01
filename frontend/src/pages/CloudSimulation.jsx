import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Cloud, CloudLightning, CloudOff, Server, Play, Pause, 
  RefreshCw, Plus, Trash2, ArrowRight, Activity, Clock, AlertTriangle, CheckCircle,
  Settings, X, FileText, Check, RotateCw, Terminal, Sliders, Shield, ShieldAlert, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component to animate simulated data packets flowing through the pipeline
const PacketDot = ({ status }) => {
  if (status === 'connected') {
    return (
      <motion.div
        className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] z-10"
        initial={{ left: '0%', opacity: 1, scale: 1 }}
        animate={{ left: '100%' }}
        transition={{
          duration: 2 + Math.random() * 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{ top: 'calc(50% - 7px)' }}
      />
    );
  } else if (status === 'reconnecting') {
    return (
      <motion.div
        className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24] z-10"
        initial={{ left: '0%', opacity: 1 }}
        animate={{ left: ['0%', '40%', '40%', '0%'] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{ top: 'calc(50% - 7px)' }}
      />
    );
  } else {
    // disconnected - fails and drops midway
    return (
      <motion.div
        className="absolute w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] z-10"
        initial={{ left: '0%', opacity: 1, scale: 1 }}
        animate={{
          left: ['0%', '50%', '50%'],
          opacity: [1, 1, 0],
          scale: [1, 1.3, 0]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeOut'
        }}
        style={{ top: 'calc(50% - 7px)' }}
      />
    );
  }
};

const CloudSimulation = () => {
  const { user } = useContext(AuthContext);
  const [pipelines, setPipelines] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000); // 1s, 2s, 5s, 10s, 30s
  const [isPaused, setIsPaused] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '1m', '5m', '15m'
  const [packetSearch, setPacketSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Form states for creating a new pipeline
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    provider: 'AWS',
    gateway_id: '',
    topic: 'iot/telemetry',
    port: 8883,
    qos: 1,
    encryption: 'TLS 1.3',
    transmission_rate: 2000
  });

  // Reconnection state per pipeline
  const [reconnectingStates, setReconnectingStates] = useState({});
  const [retryLogs, setRetryLogs] = useState([]);
  const [successCounts, setSuccessCounts] = useState({});
  const [failedCounts, setFailedCounts] = useState({});
  
  const packetTableContainerRef = useRef(null);

  // Fetch telemetry data from backend
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

  // Fetch live packet telemetry logs
  const fetchPackets = async () => {
    if (isPaused) return;
    try {
      const res = await axios.get('http://localhost:5000/api/analytics/pipeline-packets', {
        params: { timeRange: timeFilter, limit: 50 }
      });
      setPackets(res.data);
    } catch (e) {
      console.error('Failed to sync telemetry packet log', e);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchData();
    fetchPackets();
  }, []);

  // Populate initial handshake logs once pipelines are loaded
  useEffect(() => {
    if (pipelines.length > 0 && retryLogs.length === 0) {
      const initialLogs = [];
      pipelines.slice(0, 3).forEach(p => {
        if (p.status === 'connected') {
          const time = new Date(p.created_at || Date.now());
          const timeOffset = Math.floor(Math.random() * 5000) + 1000;
          const logTime = new Date(time.getTime() - timeOffset);
          const formattedTime = logTime.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(logTime.getMilliseconds()).padStart(3, '0');
          const pName = p.name;
          
          initialLogs.push(`[${formattedTime}] [SUCCESS] Secure MQTT channel active for ${pName}.`);
        }
      });
      setRetryLogs(initialLogs);
    }
  }, [pipelines]);

  // Sync intervals
  useEffect(() => {
    let loop;
    if (!isPaused) {
      loop = setInterval(() => {
        fetchData();
        fetchPackets();
      }, refreshInterval);
    }
    return () => clearInterval(loop);
  }, [refreshInterval, isPaused, timeFilter]);

  // Handle auto-scroll to latest packets (only inside the table container)
  useEffect(() => {
    if (autoScroll && packetTableContainerRef.current) {
      const container = packetTableContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [packets, autoScroll]);

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

  // Trigger step-by-step reconnection sequence and update logs
  const handleToggleStatus = async (id, currentStatus) => {
    if (user?.role === 'Viewer') return alert('Access Denied: Viewers cannot alter pipeline connection parameters.');
    const nextStatus = currentStatus === 'connected' ? 'disconnected' : 'reconnecting';
    
    try {
      // 1. Instantly patch status in database to trigger visual change
      await axios.patch(`http://localhost:5000/api/analytics/pipelines/${id}/status`, { status: nextStatus });
      await fetchData();

      if (nextStatus === 'reconnecting') {
        const pipeline = pipelines.find(p => p.id === id) || {};
        const pName = pipeline.name || id;
        const host = `${pipeline.provider?.toLowerCase() || 'custom'}.iot-broker.net`;
        const port = pipeline.port || 8883;

        // Step 1: Resolving Host (Immediate)
        setReconnectingStates(prev => ({
          ...prev,
          [id]: { step: 1, text: 'Resolving broker...', attempt: 1 }
        }));
        
        let t1 = new Date();
        let ts1 = `${t1.toLocaleTimeString()}.${String(t1.getMilliseconds()).padStart(3, '0')}`;
        setRetryLogs(prev => [`[${ts1}] [RESOLVING] Resolving broker endpoint: ${host}...`, ...prev]);

        // Step 2: TCP Handshake (1.2s delay)
        setTimeout(() => {
          setReconnectingStates(prev => ({
            ...prev,
            [id]: { step: 2, text: 'TCP handshake...', attempt: 1 }
          }));
          let t2 = new Date();
          let ts2 = `${t2.toLocaleTimeString()}.${String(t2.getMilliseconds()).padStart(3, '0')}`;
          setRetryLogs(prev => [`[${ts2}] [TCP_CONNECT] Handshake established. Socket open on port ${port}.`, ...prev]);
        }, 1200);

        // Step 3: TLS Negotiation (2.5s delay)
        setTimeout(() => {
          setReconnectingStates(prev => ({
            ...prev,
            [id]: { step: 3, text: 'Negotiating TLS...', attempt: 1 }
          }));
          let t3 = new Date();
          let ts3 = `${t3.toLocaleTimeString()}.${String(t3.getMilliseconds()).padStart(3, '0')}`;
          setRetryLogs(prev => [
            `[${ts3}] [TLS_HANDSHAKE] Certificate validation successful. Signed by CloudCA Root.`,
            `[${ts3}] [TLS_CIPHER] Using cipher suite: TLS_AES_256_GCM_SHA384 (TLS 1.3)`,
            ...prev
          ]);
        }, 2500);

        // Step 4: Auth Sync & Complete (4s delay)
        setTimeout(async () => {
          try {
            await axios.patch(`http://localhost:5000/api/analytics/pipelines/${id}/status`, { status: 'connected' });
            setReconnectingStates(prev => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            await fetchData();
            let t4 = new Date();
            let ts4 = `${t4.toLocaleTimeString()}.${String(t4.getMilliseconds()).padStart(3, '0')}`;
            setRetryLogs(prev => [
              `[${ts4}] [AUTHORIZED] MQTT Auth Token validated successfully.`,
              `[${ts4}] [SUCCESS] Secure cloud pipeline established for ${pName}!`,
              ...prev
            ]);
            // Force fetch log update
            fetchPackets();
          } catch (err) {
            console.error(err);
          }
        }, 4000);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        setRetryLogs(prev => [`[${timestamp}] [DECOMMISSIONED] Connection closed for Pipeline ${id} by user override.`, ...prev]);
        fetchPackets();
      }
    } catch (e) {
      alert('Failed to update pipeline status');
    }
  };

  // Create a new pipeline
  const handleCreatePipeline = async (e) => {
    e.preventDefault();
    if (!newPipeline.gateway_id) return alert('Please select an active gateway to link.');
    try {
      await axios.post('http://localhost:5000/api/analytics/pipelines', newPipeline);
      setNewPipeline({
        name: '',
        provider: 'AWS',
        gateway_id: '',
        topic: 'iot/telemetry',
        port: 8883,
        qos: 1,
        encryption: 'TLS 1.3',
        transmission_rate: 2000
      });
      setIsAdding(false);
      await fetchData();
      fetchPackets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating pipeline');
    }
  };

  // Update existing pipeline details
  const handleUpdatePipeline = async (e) => {
    e.preventDefault();
    if (!selectedPipeline) return;
    try {
      await axios.put(`http://localhost:5000/api/analytics/pipelines/${selectedPipeline.id}`, selectedPipeline);
      setSelectedPipeline(null);
      await fetchData();
      fetchPackets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating pipeline configuration');
    }
  };

  // Decommission/Delete pipeline
  const handleDeletePipeline = async (id) => {
    if (!window.confirm('Are you sure you want to decommission and delete this pipeline?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/analytics/pipelines/${id}`);
      setSelectedPipeline(null);
      await fetchData();
      fetchPackets();
    } catch (e) {
      alert('Delete failed');
    }
  };

  // Filtering packets based on search query
  const filteredPackets = packets.filter(p => {
    const searchLower = packetSearch.toLowerCase();
    return (
      (p.device_name && p.device_name.toLowerCase().includes(searchLower)) ||
      (p.gateway_name && p.gateway_name.toLowerCase().includes(searchLower)) ||
      (p.pipeline_name && p.pipeline_name.toLowerCase().includes(searchLower)) ||
      (p.payload && p.payload.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Metrics Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <Cloud size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Sim Ingestion Streams</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{pipelines.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configured Cloud Pipelines</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 animate-pulse">
              <CheckCircle size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Connected Nodes</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
            {pipelines.filter(p => p.status === 'connected').length} / {pipelines.length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Safe Ingress Pipelines</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-red-50 rounded-2xl text-red-600">
              <CloudOff size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Active Outages</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
            {pipelines.filter(p => p.status === 'disconnected').length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipelines Simulating Drops</div>
        </div>
      </div>

      {/* Controller bar: auto refresh adjustments and create trigger */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-3 rounded-2xl transition-all border ${
              isPaused 
                ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>

          {/* Refresh Intervals Selector */}
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            {[1000, 2000, 5000, 10000, 30000].map(val => (
              <button
                key={val}
                disabled={isPaused}
                onClick={() => setRefreshInterval(val)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-20 ${
                  refreshInterval === val && !isPaused
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
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
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-md active:scale-95 group"
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
          className="bg-white p-8 rounded-[2rem] border border-purple-200 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Cloud size={100} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-slate-900">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Plus size={18} />
            </div>
            Deploy Virtual Cloud Pipeline
          </h3>
          <form onSubmit={handleCreatePipeline} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pipeline Name</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Production Ingress"
                  value={newPipeline.name}
                  onChange={(e) => setNewPipeline({...newPipeline, name: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 placeholder:text-slate-400 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cloud Provider</label>
                <select
                  value={newPipeline.provider}
                  onChange={(e) => setNewPipeline({...newPipeline, provider: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm font-bold"
                >
                  <option value="AWS">AWS IoT Core</option>
                  <option value="Azure">Azure IoT Hub</option>
                  <option value="Custom">Custom MQTT Broker</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mapped Edge Gateway</label>
                <select
                  value={newPipeline.gateway_id}
                  onChange={(e) => setNewPipeline({...newPipeline, gateway_id: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm font-bold"
                  required
                >
                  <option value="">Select Gateway</option>
                  {gateways.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">MQTT Telemetry Topic</label>
                <input
                  type="text"
                  placeholder="e.g. gateway/telemetry"
                  value={newPipeline.topic}
                  onChange={(e) => setNewPipeline({...newPipeline, topic: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Broker Ingress Port</label>
                <input
                  type="number"
                  placeholder="e.g. 8883"
                  value={newPipeline.port}
                  onChange={(e) => setNewPipeline({...newPipeline, port: parseInt(e.target.value)})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quality of Service (QoS)</label>
                <select
                  value={newPipeline.qos}
                  onChange={(e) => setNewPipeline({...newPipeline, qos: parseInt(e.target.value)})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm font-bold"
                >
                  <option value="0">QoS 0 (At most once)</option>
                  <option value="1">QoS 1 (At least once)</option>
                  <option value="2">QoS 2 (Exactly once)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Protocol & Encryption</label>
                <select
                  value={newPipeline.encryption}
                  onChange={(e) => setNewPipeline({...newPipeline, encryption: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm font-bold"
                >
                  <option value="TLS 1.3">TLS 1.3 (Highly Secure)</option>
                  <option value="TLS 1.2">TLS 1.2 (Legacy Secure)</option>
                  <option value="Plaintext">Plaintext TCP (Insecure)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transmission Rate (ms)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={newPipeline.transmission_rate}
                  onChange={(e) => setNewPipeline({...newPipeline, transmission_rate: parseInt(e.target.value)})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-700 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-400 hover:text-slate-700 transition-colors font-bold text-sm">Cancel</button>
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">Commit Deployment</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Grid-based Pipelines Map */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Virtual Cloud Pipelines Map</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time edge to cloud transmission pathways</p>
          </div>
          <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-purple-100">Live Channels</span>
        </div>

        <div className="space-y-6">
          {pipelines.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic">
              No cloud pipelines deployed. Deploy a pipeline above to map transmissions.
            </div>
          ) : (
            pipelines.map((pl, idx) => {
              const isConnected = pl.status === 'connected';
              const isReconnecting = pl.status === 'reconnecting';
              const mappedGtw = gateways.find(g => g.id === pl.gateway_id);
              const reconnState = reconnectingStates[pl.id];

              return (
                <div key={pl.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/50 p-5 rounded-[2rem] border border-slate-200/80 hover:border-purple-300 hover:bg-white hover:shadow-md transition-all duration-300">
                  {/* 1. Edge Gateway Node */}
                  <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100 shrink-0">
                      <Server size={20} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-slate-900">{mappedGtw ? mappedGtw.name : 'Unmapped Node'}</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{pl.gateway_id || 'STANDBY'}</div>
                    </div>
                  </div>

                  {/* 2. Telemetry Pipeline Lane */}
                  <div className="col-span-12 md:col-span-4 relative h-12 flex items-center px-4">
                    {/* Connection pipeline line */}
                    <div className={`w-full h-1 rounded-full ${
                      isConnected 
                        ? 'bg-emerald-200 shadow-[0_0_8px_#34d399]' 
                        : isReconnecting 
                          ? 'border-t-2 border-dashed border-amber-400 h-0 animate-pulse' 
                          : 'bg-red-200 shadow-[0_0_8px_#ef4444]'
                    }`} />
                    
                    {/* Animated Packets */}
                    <PacketDot status={pl.status} />

                    {/* Status indicator badge overlay in center */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-slate-200 text-[8px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
                      {pl.encryption || 'TLS 1.3'}
                    </div>
                  </div>

                  {/* 3. Cloud Target System */}
                  <div 
                    onClick={() => setSelectedPipeline(pl)}
                    className={`col-span-12 md:col-span-4 relative p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 group shadow-sm bg-white ${
                      isConnected 
                        ? 'border-slate-200 hover:border-purple-300' 
                        : isReconnecting
                          ? 'border-amber-300 hover:border-amber-400 bg-amber-50/10'
                          : 'border-red-200 hover:border-red-300 bg-red-50/10'
                    }`}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className={`p-3 rounded-xl transition-all shrink-0 ${
                        isConnected 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : isReconnecting 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {isConnected ? (
                          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <Cloud size={20} />
                          </motion.div>
                        ) : isReconnecting ? (
                          <RotateCw size={20} className="animate-spin" />
                        ) : (
                          <CloudOff size={20} />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-800 group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                          {pl.name}
                          <Settings size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-purple-600" />
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                          {pl.provider} broker 
                          {reconnState && <span className="text-amber-600 font-bold ml-1">({reconnState.text})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 pl-2">
                      <div className="text-right">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate (PKT)</div>
                        <div className="text-xs font-black font-mono mt-0.5 text-slate-700">
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reconnection Retry Logs & Live Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Retry Log Panel (Console Style) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Terminal size={18} className="text-purple-600" />
              Diagnostic Handshake Log
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live authentication & network handshakes</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl font-mono text-[10px] text-slate-300 space-y-3 h-[100px] overflow-y-auto custom-scrollbar flex-1 shadow-inner relative">
            <div className="absolute top-2 right-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">Console Ingress</div>
            {retryLogs.length === 0 ? (
              <div className="text-slate-500 italic text-center py-20">Console standby. Initiate a reconnection trigger to log handshake frames.</div>
            ) : (
              retryLogs.map((log, index) => {
                const isSuccess = log.includes('[SUCCESS]') || log.includes('[AUTHORIZED]');
                const isWarning = log.includes('[RESOLVING]') || log.includes('[TCP_CONNECT]') || log.includes('[TLS_HANDSHAKE]') || log.includes('[TLS_CIPHER]');
                const isError = log.includes('[ERROR]') || log.includes('[FAILED]');
                
                let textColor = 'text-slate-300';
                if (isSuccess) textColor = 'text-emerald-400 font-bold';
                else if (isWarning) textColor = 'text-amber-400';
                else if (isError) textColor = 'text-red-400 font-bold';

                return (
                  <div key={index} className={`pb-2 last:pb-0 border-b border-slate-800 last:border-0 ${textColor}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Packet Telemetry Stream */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-purple-600" />
                Live Ingestion Packet Stream
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Millisecond-accurate MQTT cloud telemetries</p>
            </div>

            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              {/* Search filter */}
              <input
                type="text"
                placeholder="Search logs..."
                value={packetSearch}
                onChange={(e) => setPacketSearch(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-400 text-slate-700 w-full md:w-36 placeholder:text-slate-400"
              />

              {/* Time based filtering */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-400 text-slate-700 font-bold"
              >
                <option value="all">All Ingests</option>
                <option value="1m">Last 1 minute</option>
                <option value="5m">Last 5 minutes</option>
                <option value="15m">Last 15 minutes</option>
              </select>

              {/* Auto Scroll toggle */}
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  autoScroll 
                    ? 'bg-purple-50 border-purple-200 text-purple-600' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <Clock size={12} />
                {autoScroll ? 'Scroll Active' : 'Scroll Lock'}
              </button>
            </div>
          </div>

          <div ref={packetTableContainerRef} className="overflow-x-auto h-[100px] overflow-y-scroll custom-scrollbar flex-1 border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                  <th className="px-3 py-2">Packet Time</th>
                  <th className="px-3 py-2">Pipeline</th>
                  <th className="px-3 py-2">Gateway</th>
                  <th className="px-3 py-2">Source Device</th>
                  <th className="px-3 py-2">Payload Size</th>
                  <th className="px-3 py-2">Security</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPackets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-10 text-center text-slate-400 italic bg-white text-[10px]">
                      No matching packets detected in this timeline. Make sure gateways and pipelines are connected.
                    </td>
                  </tr>
                ) : (
                  filteredPackets.map(p => {
                    const pktTime = new Date(p.timestamp);
                    const formattedTime = pktTime.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(pktTime.getMilliseconds()).padStart(3, '0');
                    const isOk = p.status === 'success';

                    return (
                      <tr key={p.id} className="hover:bg-purple-50/30 transition-all font-mono text-[10px]">
                        <td className="px-3 py-1.5 whitespace-nowrap font-bold text-purple-700">{formattedTime}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap font-sans font-bold text-slate-900">{p.pipeline_name || 'Generic'}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap font-sans text-slate-500">{p.gateway_name || p.gateway_id}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap font-sans text-slate-600">{p.device_name || p.device_id}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-slate-500">{p.payload_size} B</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          {p.is_secure ? (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              <Shield size={9} /> TLS 1.3
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded border border-red-100 animate-pulse">
                              <ShieldAlert size={9} /> PLAIN
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            isOk 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 max-w-[200px] truncate text-slate-500" title={p.payload}>
                          {p.payload}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Configuration Details Modal */}
      <AnimatePresence>
        {selectedPipeline && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-purple-100">
                    Configuration Details
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
                    <Sliders size={20} className="text-purple-600" />
                    Configure Pipeline
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedPipeline(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdatePipeline} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Ingress Name</label>
                    <input
                      type="text"
                      value={selectedPipeline.name}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cloud Broker Provider</label>
                    <select
                      value={selectedPipeline.provider}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, provider: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm text-slate-800 font-bold"
                    >
                      <option value="AWS">AWS IoT Core</option>
                      <option value="Azure">Azure IoT Hub</option>
                      <option value="Custom">Custom MQTT Broker</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapped Gateway</label>
                    <select
                      value={selectedPipeline.gateway_id || ''}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, gateway_id: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm text-slate-800 font-bold"
                      required
                    >
                      <option value="">Unlinked Standby</option>
                      {gateways.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MQTT Topic Path</label>
                    <input
                      type="text"
                      value={selectedPipeline.topic || ''}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, topic: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingress Port</label>
                    <input
                      type="number"
                      value={selectedPipeline.port || ''}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, port: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm text-slate-800 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality of Service</label>
                    <select
                      value={selectedPipeline.qos || '0'}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, qos: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm text-slate-800 font-bold"
                    >
                      <option value="0">QoS 0 (At most once)</option>
                      <option value="1">QoS 1 (At least once)</option>
                      <option value="2">QoS 2 (Exactly once)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol / Cryptography</label>
                    <select
                      value={selectedPipeline.encryption || ''}
                      onChange={(e) => setSelectedPipeline({...selectedPipeline, encryption: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm text-slate-800 font-bold"
                    >
                      <option value="TLS 1.3">TLS 1.3 (Secure Handshake)</option>
                      <option value="TLS 1.2">TLS 1.2 (Legacy SSL)</option>
                      <option value="Plaintext">Plaintext TCP (Insecure)</option>
                    </select>
                  </div>
                </div>

                {/* Diagnostics Display */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Cpu size={12} /> Live Telemetry Readings
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Gateway Host Status:</span>
                    <span className="font-bold flex items-center gap-1">
                      {selectedPipeline.gateway_id ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online Ingress Mapped
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Standby (No Ingestion)
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Edge Tunnel Protection:</span>
                    <span className="font-bold">
                      {selectedPipeline.encryption === 'Plaintext' ? (
                        <span className="text-red-500 font-black tracking-wider uppercase text-[10px] flex items-center gap-1">
                          <ShieldAlert size={12} /> INSECURE (No TLS)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-black tracking-wider uppercase text-[10px] flex items-center gap-1">
                          <Shield size={12} /> ENCRYPTED ({selectedPipeline.encryption})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Network Encryption overhead:</span>
                    <span className="font-bold text-slate-700">
                      {selectedPipeline.encryption === 'TLS 1.3' ? '+90ms (TLS Handshake)' : selectedPipeline.encryption === 'TLS 1.2' ? '+130ms (Double handshake)' : 'None (Fast)'}
                    </span>
                  </div>
                </div>

                {/* Operations & Submission */}
                <div className="flex justify-between items-center gap-4 pt-2">
                  {user?.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeletePipeline(selectedPipeline.id)}
                      className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 p-3.5 rounded-xl border border-red-200 transition-all font-black"
                      title="Decommission and delete pipeline"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <div className="flex gap-3 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(selectedPipeline.id, selectedPipeline.status)}
                      className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        selectedPipeline.status === 'connected'
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-500 hover:text-white'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {selectedPipeline.status === 'connected' ? 'Simulate Disconnect' : 'Trigger Reconnect'}
                    </button>

                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CloudSimulation;
