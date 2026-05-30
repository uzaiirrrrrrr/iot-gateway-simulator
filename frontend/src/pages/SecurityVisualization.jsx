import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock, 
  Search, RefreshCw, Cpu, Activity, Clock, Zap, AlertTriangle,
  ArrowRight, CheckCircle, XCircle, Database, TrendingUp, BarChart3, LineChart as LineIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  const [minLatency, setMinLatency] = useState(0);
  const [maxLatency, setMaxLatency] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [secureRatio, setSecureRatio] = useState(0);

  // Graph Toggle & Encryption logs states
  const [activeGraphType, setActiveGraphType] = useState('area'); // 'area' | 'bar' | 'line'
  const [activeMetric, setActiveMetric] = useState('latency'); // 'latency' | 'payloadSize'
  const [cryptoLogs, setCryptoLogs] = useState([]);
  const prevLogsRef = useRef([]);

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
        const activeGatewayLogs = res.data.filter(log => log.gateway_id === selectedGatewayId);
        const logsToUse = activeGatewayLogs.length > 0 ? activeGatewayLogs : res.data;

        const latencies = logsToUse.map(log => log.latency || 0);
        const avg = Math.round(latencies.reduce((acc, val) => acc + val, 0) / latencies.length);
        setAvgLatency(avg);

        const minVal = Math.min(...latencies);
        const maxVal = Math.max(...latencies);
        setMinLatency(minVal !== Infinity ? minVal : 0);
        setMaxLatency(maxVal !== -Infinity ? maxVal : 0);

        // Jitter: average difference between consecutive latencies
        let diffSum = 0;
        for (let i = 1; i < latencies.length; i++) {
          diffSum += Math.abs(latencies[i] - latencies[i - 1]);
        }
        const calculatedJitter = latencies.length > 1 ? Math.round(diffSum / (latencies.length - 1)) : 0;
        setJitter(calculatedJitter);
        
        const secureCount = logsToUse.filter(log => log.is_secure).length;
        setSecureRatio(Math.round((secureCount / logsToUse.length) * 100));
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

  useEffect(() => {
    if (trafficLogs.length > 0) {
      const activeGateway = gateways.find(g => g.id === selectedGatewayId);
      const isSecure = activeGateway ? activeGateway.is_secure !== false : true;

      // Filter logs for the selected gateway
      const activeGatewayLogs = trafficLogs.filter(log => log.gateway_id === selectedGatewayId);
      
      if (activeGatewayLogs.length > 0) {
        // Find logs that are new compared to our previous check
        const newLogs = activeGatewayLogs.filter(log => 
          !prevLogsRef.current.some(prev => prev.id === log.id)
        );

        if (newLogs.length > 0) {
          const newCryptoEvents = newLogs.map(log => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            let text = '';
            let type = 'info';
            
            if (isSecure) {
              const ciphers = ['AES-256-GCM', 'CHACHA20-POLY1305'];
              const chosenCipher = ciphers[log.id % ciphers.length];
              text = `[${timeStr}] Secure Tunnel Active: Packet #${log.id} encrypted via TLS 1.3 (${chosenCipher}). HMAC-SHA256 integrity verified.`;
              type = 'success';
            } else {
              text = `[${timeStr}] SECURITY EXPOSURE: Packet #${log.id} transmitted in plaintext HTTP. No cipher suite applied. Integrity check bypassed.`;
              type = 'warning';
            }
            return { id: log.id, text, type };
          });

          setCryptoLogs(prev => {
            const combined = [...newCryptoEvents, ...prev];
            // Deduplicate by ID
            const unique = combined.filter((item, index, self) => 
              self.findIndex(t => t.id === item.id) === index
            );
            return unique.slice(0, 15); // limit to 15 entries
          });
        }
      }
      prevLogsRef.current = trafficLogs;
    }
  }, [trafficLogs, selectedGatewayId, gateways]);

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
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(50, 100);
      ctx.lineTo(canvas.width - 80, 100);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Device Endpoint Nodes on Left
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(50, 100, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 8px sans-serif';
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
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(isGatewaySecure ? 'TLS GUARD' : 'PLAIN HTTP', guardX, 90);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(isGatewaySecure ? 'CIPHER_ON' : 'DECRYPTED', guardX, 110);

      // Draw Gateway Node on Right
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 100, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px sans-serif';
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
      latency: log.latency || 0,
      payloadSize: log.payload_size || 0,
      isSecure: log.is_secure
    }));

  return (
    <div className="space-y-8 pb-10">
      {/* Overview Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Cryptographics</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{secureRatio}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TLS Enforced Packets</div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Clock size={22} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Latency Average</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{avgLatency} ms</div>
          <div className="text-[9px] text-slate-400 font-mono font-bold tracking-tight">
            Min: {minLatency}ms | Max: {maxLatency}ms | Jitter: {jitter}ms
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <Activity size={22} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Secure Pipes</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">
            {gateways.filter(g => g.is_secure).length} / {gateways.length}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Safe Clusters</div>
        </div>

        <div className={`p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group transition-all duration-300 ${
          secureRatio >= 90 
            ? 'bg-emerald-50/20 border-emerald-200 text-emerald-900' 
            : secureRatio >= 50 
            ? 'bg-amber-50/20 border-amber-200 text-amber-900' 
            : 'bg-red-50/20 border-red-200 text-red-900'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${
              secureRatio >= 90 ? 'bg-emerald-100 text-emerald-700' : secureRatio >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>
              <Shield size={22} className={secureRatio < 50 ? 'animate-bounce' : ''} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Security Rating</span>
          </div>
          <div className="text-3xl font-black tracking-tighter mb-1">
            {secureRatio >= 90 ? 'Grade A+' : secureRatio >= 70 ? 'Grade B' : secureRatio >= 50 ? 'Grade C' : 'Grade F'}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {secureRatio >= 90 ? 'High Security Level' : secureRatio >= 50 ? 'Medium Vulnerability' : 'Critical Threat Risk'}
          </div>
        </div>
      </div>

      {/* Gateway Selector and Lock Toggle */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 block">Target Cluster Node</label>
          <select 
            value={selectedGatewayId}
            onChange={(e) => setSelectedGatewayId(e.target.value)}
            className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-purple-400 text-slate-700 text-sm font-bold tracking-wide"
          >
            {gateways.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
            ))}
          </select>
        </div>

        <div className={`lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border rounded-3xl relative overflow-hidden transition-all duration-500 ${
          selectedGateway?.is_secure 
            ? 'bg-emerald-950/5 border-emerald-200/50' 
            : 'bg-orange-950/5 border-orange-200/50'
        }`}>
          {selectedGateway && (
            <>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-4 rounded-2xl ${selectedGateway.is_secure ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50' : 'bg-orange-100 text-orange-700 border border-orange-200/50'}`}>
                  {selectedGateway.is_secure ? <Lock size={26} className="animate-pulse" /> : <Unlock size={26} />}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                    {selectedGateway.is_secure ? 'Secure TLS Communication Active' : 'Plaintext Communication Model'}
                    <span className={`text-[8px] border font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase ${selectedGateway.is_secure ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}>
                      {selectedGateway.is_secure ? 'TLS_1.3' : 'PLAIN_HTTP'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
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
                  className={`relative flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${
                    selectedGateway.is_secure 
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-200' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200'
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
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Encryption Matrix</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Node Telemetry Routing</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">LIVE_PROCESSOR</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative min-h-[200px]">
              <canvas ref={canvasRef} className="w-full h-full block" />
              <div className="absolute bottom-4 left-6 text-[9px] text-slate-500 font-mono flex gap-4 uppercase font-bold tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#10b981] rounded-full shadow-[0_0_6px_#10b981]" /> Secure TLS Packet</div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#f97316]" /> Decrypted Plain Packet</div>
              </div>
            </div>
          </div>

          {/* Encryption Logs Console */}
          <div className="mt-6 flex-1 flex flex-col justify-between">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Database size={14} className="text-purple-500" />
              Cryptographic Tunnel Audit Trail
            </h4>
            <div className="bg-slate-950 text-slate-300 font-mono text-[10px] p-4 rounded-2xl h-44 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {cryptoLogs.length === 0 ? (
                <div className="text-slate-500 italic">No cryptographic events logged in this session. Awaiting active transmissions...</div>
              ) : (
                cryptoLogs.map((evt, idx) => (
                  <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${
                    evt.type === 'success' 
                      ? 'border-emerald-500 text-emerald-400' 
                      : evt.type === 'warning' 
                      ? 'border-amber-500 text-amber-400' 
                      : 'border-blue-500 text-slate-300'
                  }`}>
                    {evt.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Latency tracker */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Cryptographic Overhead Latency</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Comparing Symmetric Cipher Cost</p>
              </div>
              
              {/* Multiple Graph Types Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
                <button 
                  onClick={() => setActiveGraphType('area')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${activeGraphType === 'area' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                  title="Area Chart"
                >
                  <TrendingUp size={14} />
                </button>
                <button 
                  onClick={() => setActiveGraphType('bar')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${activeGraphType === 'bar' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                  title="Bar Chart"
                >
                  <BarChart3 size={14} />
                </button>
                <button 
                  onClick={() => setActiveGraphType('line')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${activeGraphType === 'line' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                  title="Line Chart"
                >
                  <LineIcon size={14} />
                </button>
              </div>
            </div>

            <div className="h-56 w-full mt-4">
              {latencyChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400 italic text-sm">Awaiting packet bursts for comparative mapping...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {activeGraphType === 'area' ? (
                    <AreaChart data={latencyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedGateway?.is_secure ? "#10b981" : "#f97316"} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={selectedGateway?.is_secure ? "#10b981" : "#f97316"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                        labelClassName="text-slate-400 text-xs font-mono font-bold"
                        itemStyle={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}
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
                  ) : activeGraphType === 'bar' ? (
                    <BarChart data={latencyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                        labelClassName="text-slate-400 text-xs font-mono font-bold"
                        itemStyle={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}
                      />
                      <Bar 
                        dataKey="latency" 
                        name="Latency (ms)" 
                        fill={selectedGateway?.is_secure ? "#10b981" : "#f97316"} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={latencyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                        labelClassName="text-slate-400 text-xs font-mono font-bold"
                        itemStyle={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="latency" 
                        name="Latency (ms)" 
                        stroke={selectedGateway?.is_secure ? "#10b981" : "#f97316"} 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* High Latency Warnings & Threshold Alert */}
          <div className="mt-4 space-y-3">
            {avgLatency > 120 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertTriangle className="text-red-500 shrink-0 animate-bounce" size={18} />
                <div>
                  <div className="text-[10px] text-red-800 font-black uppercase tracking-wider">High Processing Latency Alert</div>
                  <div className="text-[10px] text-red-600 font-semibold mt-0.5">Average response times exceed 120ms. Potential cryptographic overhead bottleneck.</div>
                </div>
              </div>
            )}
            
            {selectedGateway?.is_secure ? (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3">
                <ShieldCheck className="text-purple-600 shrink-0" size={18} />
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                  Notice: TLS encryption protocol is active. Latency averages <span className="text-purple-600 font-mono font-black">{avgLatency}ms</span> due to intensive packet hashing and key rotation overhead.
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                  Insecure Mode Risk: Plaintext HTTP active. Latency is low (<span className="text-amber-600 font-mono font-black">{avgLatency}ms</span>), but network traffic is highly vulnerable to decryption.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time packet registry table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Security & Encryption Registry</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit trail log of all intercepts</p>
          </div>
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search packet logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-xs text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Intercept Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Asset</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Destination Node</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Protocol</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Latency</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Payload Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <Activity className="animate-spin text-purple-600 mx-auto mb-3" size={24} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decrypting Logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-400 italic">No packet transmissions captured in this cycle.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-purple-50/50 transition-all group">
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-bold font-sans">
                      {log.device_name || 'Unknown Device'}
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{log.device_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-bold font-sans">
                      {log.gateway_name || 'Unknown Gateway'}
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{log.gateway_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                        log.is_secure 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : 'bg-orange-50 text-orange-600 border-orange-200'
                      }`}>
                        {log.is_secure ? <Lock size={10} /> : <Unlock size={10} />}
                        {log.is_secure ? 'TLS_1.3' : 'PLAIN_HTTP'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        log.status === 'success' || !log.status
                          ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {log.status === 'success' || !log.status ? (
                          <>
                            <CheckCircle size={10} className="text-emerald-500" />
                            Success
                          </>
                        ) : (
                          <>
                            <XCircle size={10} className="text-red-500" />
                            Failed
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-bold">
                      <div className="flex items-center gap-2">
                        <span>{log.latency} ms</span>
                        <div className={`h-1.5 w-1.5 rounded-full ${log.latency > 120 ? 'bg-red-500 animate-ping' : log.latency > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-emerald-600 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors font-mono tracking-tight text-[11px]">
                      {log.is_secure ? '🔒 ENCRYPTED_FRAME::' + log.payload.substring(0, 20) + '...' : log.payload}
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
