import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock, 
  Search, RefreshCw, Cpu, Activity, Clock, Zap, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const SecurityVisualization = () => {
  const { user } = useContext(AuthContext);
  const [gateways, setGateways] = useState([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [trafficLogs, setTrafficLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  
  // Stats
  const [avgLatency, setAvgLatency] = useState(0);
  const [secureRatio, setSecureRatio] = useState(0);

  const canvasRef = useRef(null);

  const fetchGateways = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/gateways');
      setGateways(res.data);
      if (res.data.length > 0 && !selectedGatewayId) {
        setSelectedGatewayId(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch gateways', e);
    }
  };

  const fetchTrafficLogs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/analytics/traffic-logs?limit=50');
      setTrafficLogs(res.data);
      
      // Compute statistics
      if (res.data.length > 0) {
        const avg = Math.round(res.data.reduce((acc, log) => acc + log.latency, 0) / res.data.length);
        setAvgLatency(avg);
        
        const secureCount = res.data.filter(log => log.is_secure).length;
        setSecureRatio(Math.round((secureCount / res.data.length) * 100));
      }
    } catch (e) {
      console.error('Failed to fetch traffic logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
    fetchTrafficLogs();

    const interval = setInterval(() => {
      fetchGateways();
      fetchTrafficLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleSecure = async (id, currentSecure) => {
    if (user?.role === 'Viewer') return alert('Access Denied: Viewers cannot toggle security settings.');
    setTogglingId(id);
    try {
      await axios.patch(`http://localhost:5000/api/gateways/${id}/secure`, { is_secure: !currentSecure });
      await fetchGateways();
      await fetchTrafficLogs();
    } catch (e) {
      alert('Security override failed');
    } finally {
      setTogglingId(null);
    }
  };

  // Canvas Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 200;

    const activeGateway = gateways.find(g => g.id === selectedGatewayId);
    const isGatewaySecure = activeGateway ? activeGateway.is_secure !== false : true;

    // Particles array
    let particles = [];

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
      }
    };
    window.addEventListener('resize', handleResize);

    class PacketParticle {
      constructor() {
        this.x = 50; // Source position (Device)
        this.y = 50 + Math.random() * 100;
        this.targetX = canvas.width - 80; // Target (Gateway / Ingress)
        this.targetY = 100;
        this.speed = 1.5 + Math.random() * 2;
        this.size = isGatewaySecure ? 5 : 6;
        this.isSecure = isGatewaySecure;
        this.progress = 0;
        this.color = this.isSecure ? '#10b981' : '#f97316'; // Emerald vs Orange
      }

      update() {
        this.progress += 0.01 * this.speed;
        this.x = 50 + (this.targetX - 50) * this.progress;
        
        // Curve trajectory slightly
        this.y = (50 + Math.random() * 100) * (1 - this.progress) + this.targetY * this.progress;
      }

      draw() {
        ctx.beginPath();
        if (this.isSecure) {
          // Draw circular glowing particle
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
        } else {
          // Draw plain square unshielded packet
          ctx.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.closePath();
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 0; // Reset shadow

      // Draw background layout lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(50, 100);
      ctx.lineTo(canvas.width - 80, 100);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Device Endpoint Nodes on Left
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(50, 100, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEVS', 50, 103);

      // Draw Cryptographic Guard in Center
      const guardX = canvas.width / 2;
      ctx.fillStyle = isGatewaySecure ? 'rgba(16, 185, 129, 0.05)' : 'rgba(249, 115, 22, 0.05)';
      ctx.strokeStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(guardX - 35, 60, 70, 80);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(isGatewaySecure ? 'TLS GUARD' : 'PLAIN HTTP', guardX, 90);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(isGatewaySecure ? 'CIPHER_ON' : 'DECRYPTED', guardX, 110);

      // Draw Gateway Node on Right
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 100, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('GATEWAY', canvas.width - 80, 103);

      // Spawn particles
      if (Math.random() < 0.1) {
        particles.push(new PacketParticle());
      }

      // Update and draw particles
      particles = particles.filter(p => p.progress < 1);
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedGatewayId, gateways]);

  const selectedGateway = gateways.find(g => g.id === selectedGatewayId);
  const activeLogs = trafficLogs.filter(log => log.gateway_id === selectedGatewayId);

  const filteredLogs = activeLogs.filter(log => {
    const matchesSearch = 
      log.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.payload?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id?.toString().includes(searchTerm);
    return matchesSearch;
  });

  // Chart data: map latest logs to charting coordinates
  const latencyChartData = [...activeLogs]
    .reverse()
    .slice(-15)
    .map((log, index) => ({
      name: `Pkt ${index + 1}`,
      latency: log.latency,
      isSecure: log.is_secure
    }));

  return (
    <div className="space-y-8 pb-10">
      {/* Overview Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <ShieldCheck size={26} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Cryptographics</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">{secureRatio}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TLS Enforced Packets</div>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
              <Clock size={26} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Latency Average</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">{avgLatency} ms</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Response Overload</div>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400">
              <Activity size={26} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Secure Pipes</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {gateways.filter(g => g.is_secure).length} / {gateways.length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Safe Clusters</div>
        </div>
      </div>

      {/* Gateway Selector and Lock Toggle */}
      <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 block">Target Cluster Node</label>
          <select 
            value={selectedGatewayId}
            onChange={(e) => setSelectedGatewayId(e.target.value)}
            className="w-full pl-5 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl outline-none focus:border-purple-500/50 text-slate-300 text-sm font-bold tracking-wide"
          >
            {gateways.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-950/60 border border-slate-800/50 rounded-3xl relative overflow-hidden">
          {selectedGateway && (
            <>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-4 rounded-2xl ${selectedGateway.is_secure ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {selectedGateway.is_secure ? <Lock size={26} /> : <Unlock size={26} />}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                    {selectedGateway.is_secure ? 'Secure TLS Communication Active' : 'Plaintext Communication Model'}
                    <span className={`text-[8px] border font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase ${selectedGateway.is_secure ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                      {selectedGateway.is_secure ? 'TLS_1.3' : 'UNENCRYPTED'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {selectedGateway.is_secure 
                      ? 'Secure Socket Layer wraps all payloads. Automatic protection against spoofing attacks.' 
                      : 'WARNING: Telemetry transmits in unencrypted format. Prone to MITM packet interception.'
                    }
                  </p>
                </div>
              </div>

              <div className="shrink-0 relative z-10">
                <button
                  disabled={togglingId === selectedGateway.id}
                  onClick={() => handleToggleSecure(selectedGateway.id, selectedGateway.is_secure)}
                  className={`relative flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                    selectedGateway.is_secure 
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/20' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                  }`}
                >
                  {togglingId === selectedGateway.id ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : selectedGateway.is_secure ? (
                    <>
                      <Unlock size={16} /> Disable Encryption
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Force TLS Enforce
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* HTML Canvas Real-time Stream & Latency Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Real-time packet flow */}
        <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-8 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Active Encryption Matrix</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Node Telemetry Routing</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">LIVE_PROCESSOR</span>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-3xl border border-slate-800/50 overflow-hidden relative min-h-[200px]">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute bottom-4 left-6 text-[9px] text-slate-600 font-mono flex gap-4 uppercase font-bold tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#10b981] rounded-full shadow-[0_0_6px_#10b981]" /> Secure TLS Packet</div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#f97316]" /> Decrypted Plain Packet</div>
            </div>
          </div>
        </div>

        {/* Latency tracker */}
        <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-8 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Cryptographic Overhead Latency</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Comparing Symmetric Cipher Cost</p>
            </div>
            <div className="text-[9px] font-mono text-slate-500 font-black uppercase tracking-widest">Tuned Metrics</div>
          </div>

          <div className="h-56 w-full mt-4">
            {latencyChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-600 italic text-sm">Awaiting packet bursts for comparative mapping...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={selectedGateway?.is_secure ? "#10b981" : "#f97316"} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={selectedGateway?.is_secure ? "#10b981" : "#f97316"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0c1a', border: '1px solid #334155', borderRadius: '12px' }}
                    labelClassName="text-slate-500 text-xs font-mono font-bold"
                    itemStyle={{ color: '#f8fafc', fontFamily: 'monospace', fontSize: '11px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    name="Latency (ms)"
                    stroke={selectedGateway?.is_secure ? "#10b981" : "#f97316"} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#latencyGlow)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {selectedGateway?.is_secure && (
            <div className="mt-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 flex items-center gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                Notice: Secure mode active. Processing latency averages <span className="text-amber-400 font-mono">~70-180ms</span> due to intensive handshakes and packet payload hashing.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time packet registry table */}
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="p-8 border-b border-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Security & Encryption Registry</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Audit trail log of all intercepts</p>
          </div>
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search packet logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all text-xs text-slate-300 placeholder:text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/50">
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Intercept Timestamp</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Source Asset</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Security Protocol</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Overhead Latency</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Payload Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center">
                    <Activity className="animate-spin text-purple-500 mx-auto mb-3" size={24} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Decrypting Logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-600 italic">No packet transmissions captured in this cycle.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-purple-500/5 transition-all group">
                    <td className="px-8 py-5 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-8 py-5 text-slate-200 font-bold font-sans">
                      {log.device_name}
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{log.device_id}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                        log.is_secure 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {log.is_secure ? <Lock size={10} /> : <Unlock size={10} />}
                        {log.is_secure ? 'TLS_1.3' : 'PLAIN_HTTP'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-300 font-bold">
                      <div className="flex items-center gap-2">
                        <span>{log.latency} ms</span>
                        <div className={`h-1.5 w-1.5 rounded-full ${log.latency > 150 ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
                      </div>
                    </td>
                    <td className="px-8 py-5 max-w-sm truncate text-emerald-500 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors font-mono tracking-tight text-[11px]">
                      {log.is_secure ? '🔒 ENCRYPTED_FRAME::' + log.payload.substring(0, 30) + '...' : log.payload}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityVisualization;
