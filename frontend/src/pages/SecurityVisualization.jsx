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
  const [activeMetric, setActiveMetric] = useState('latency'); // 'latency' | 'payloadSize' | 'throughput'
  const [cryptoLogs, setCryptoLogs] = useState([]);
  const [filterProtocol, setFilterProtocol] = useState('all'); // 'all' | 'secure' | 'insecure'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'success' | 'failed'
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
          const newCryptoEvents = [];
          
          newLogs.forEach(log => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            
            if (isSecure) {
              const ciphers = ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'];
              const chosenCipher = ciphers[log.id % ciphers.length];
              
              // Simulate TLS handshake and key rotation logs
              if (log.id % 4 === 0) {
                newCryptoEvents.push({
                  id: `handshake-${log.id}`,
                  text: `[${timeStr}] 🤝 TLS 1.3 Handshake Initiated: ClientHello -> ServerHello. Server cert validated. ECDH Ephemeral Key exchange complete.`,
                  type: 'info'
                });
              }
              if (log.id % 6 === 0) {
                newCryptoEvents.push({
                  id: `rotate-${log.id}`,
                  text: `[${timeStr}] 🔄 Perfect Forward Secrecy: Ephemeral session key rotated. Old keys shredded from memory.`,
                  type: 'info'
                });
              }
              
              newCryptoEvents.push({
                id: log.id,
                text: `[${timeStr}] 🔒 Secure Tunnel Transmission: Packet #${log.id} encrypted via ${chosenCipher}. Integrity tag HMAC-SHA384: OK.`,
                type: 'success'
              });
            } else {
              newCryptoEvents.push({
                id: log.id,
                text: `[${timeStr}] ⚠️ SECURITY EXPOSURE: Packet #${log.id} routed over plaintext HTTP. No cipher suite active. Interception risk: CRITICAL!`,
                type: 'warning'
              });
            }
          });

          setCryptoLogs(prev => {
            const combined = [...newCryptoEvents, ...prev];
            // Deduplicate by ID
            const unique = combined.filter((item, index, self) => 
              self.findIndex(t => t.id === item.id) === index
            );
            return unique.slice(0, 30); // limit to 30 entries
          });
        }
      }
      prevLogsRef.current = trafficLogs;
    }
  }, [trafficLogs, selectedGatewayId, gateways]);

  const handleToggleSecure = async (id, currentSecure) => {
    if (user?.role === 'Viewer') return alert('Access Denied: Viewers cannot toggle security settings.');
    
    // Optimistic Update for instant effect
    setGateways(prev => prev.map(g => g.id === id ? { ...g, is_secure: !currentSecure } : g));
    
    const timeStr = new Date().toLocaleTimeString();
    const configLog = {
      id: `config-${Date.now()}`,
      text: `[${timeStr}] ⚙️ CONFIG_CHANGE: Security status toggled to ${!currentSecure ? 'SECURE_TLS' : 'INSECURE_HTTP'}. Re-negotiating cluster policies...`,
      type: 'info'
    };
    setCryptoLogs(prev => [configLog, ...prev]);

    setTogglingId(id);
    try {
      await axios.patch(`http://localhost:5000/api/gateways/${id}/secure`, { is_secure: !currentSecure });
      await fetchGateways();
      await fetchTrafficLogs();
    } catch (e) {
      // Revert on failure
      setGateways(prev => prev.map(g => g.id === id ? { ...g, is_secure: currentSecure } : g));
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
      constructor(sourceY, deviceLabel) {
        this.startX = 60;
        this.startY = sourceY;
        this.x = this.startX;
        this.y = this.startY;
        this.targetX = canvas.width - 80;
        this.targetY = 100;
        this.speed = 1.2 + Math.random() * 1.5;
        this.size = isGatewaySecure ? 5 : 6;
        this.isSecure = isGatewaySecure;
        this.progress = 0;
        this.color = this.isSecure ? '#10b981' : '#f97316'; // Emerald vs Orange
        this.deviceLabel = deviceLabel;
      }

      update() {
        this.progress += 0.008 * this.speed;
        this.x = this.startX + (this.targetX - this.startX) * this.progress;
        
        // Bezier/sinusoidal interpolation for realistic curve
        const t = this.progress;
        // Cubic interpolation for vertical flow merging
        this.y = this.startY * (1 - t) * (1 - t) + 100 * 2 * (1 - t) * t + this.targetY * t * t;
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        if (this.isSecure) {
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#10b981';
          ctx.fill();
          
          // Draw tiny lock icon above particle
          ctx.fillStyle = '#10b981';
          ctx.font = '9px sans-serif';
          ctx.fillText('🔒', this.x - 4, this.y - 8);
        } else {
          ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 0;
          ctx.fill();
          
          // Draw tiny warning/unlock above particle
          ctx.fillStyle = '#f97316';
          ctx.font = '9px sans-serif';
          ctx.fillText('⚠️', this.x - 4, this.y - 8);
        }
        ctx.restore();
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 0;

      const deviceNodes = [
        { label: 'DEV-A', y: 50 },
        { label: 'DEV-B', y: 100 },
        { label: 'DEV-C', y: 150 }
      ];

      // Draw background layout flow lines from the 3 devices to the gateway
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      deviceNodes.forEach(dev => {
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(60, dev.y);
        ctx.quadraticCurveTo(canvas.width / 2, 100, canvas.width - 80, 100);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw the 3 device nodes
      deviceNodes.forEach(dev => {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(60, dev.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dev.label, 60, dev.y + 3);
      });

      // Draw Cryptographic Guard in Center
      const guardX = canvas.width / 2;
      ctx.fillStyle = isGatewaySecure ? 'rgba(16, 185, 129, 0.05)' : 'rgba(249, 115, 22, 0.05)';
      ctx.strokeStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(guardX - 45, 45, 90, 110);
      ctx.fill();
      ctx.stroke();

      // Guard pulse animation
      ctx.fillStyle = isGatewaySecure ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)';
      ctx.lineWidth = 1;
      const pulseSize = (Math.sin(Date.now() / 200) * 4) + 2;
      ctx.strokeRect(guardX - 45 - pulseSize, 45 - pulseSize, 90 + pulseSize * 2, 110 + pulseSize * 2);

      ctx.fillStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isGatewaySecure ? '🛡️ TLS GUARD' : '🔓 PLAINTEXT', guardX, 85);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(isGatewaySecure ? 'TLS_1.3_ACTIVE' : 'HTTP_VULNERABLE', guardX, 105);
      ctx.font = '6px monospace';
      ctx.fillText(isGatewaySecure ? 'AES-256-GCM' : 'NO_CIPHER', guardX, 120);

      // Draw Gateway Node on Right
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = isGatewaySecure ? '#10b981' : '#f97316';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 100, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('GATEWAY', canvas.width - 80, 103);

      // Spawn particles randomly from any of the 3 devices
      if (Math.random() < 0.12) {
        const sourceDev = deviceNodes[Math.floor(Math.random() * deviceNodes.length)];
        particles.push(new PacketParticle(sourceDev.y, sourceDev.label));
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
      log.device_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.payload?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id?.toString().includes(searchTerm);
      
    const matchesProtocol = 
      filterProtocol === 'all' || 
      (filterProtocol === 'secure' && log.is_secure) || 
      (filterProtocol === 'insecure' && !log.is_secure);
      
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'success' && (log.status === 'success' || !log.status)) || 
      (filterStatus === 'failed' && log.status === 'failed');
      
    return matchesSearch && matchesProtocol && matchesStatus;
  });

  // Latest packet properties for live ticker
  const latestPacket = activeLogs[0];
  const lastLatency = latestPacket ? latestPacket.latency : 0;
  const lastPayloadSize = latestPacket ? latestPacket.payload_size : 0;
  const lastStatus = latestPacket ? latestPacket.status || 'success' : 'N/A';

  // Chart data: map latest logs to charting coordinates
  const latencyChartData = [...activeLogs]
    .reverse()
    .slice(-15)
    .map((log, index) => {
      // Calculate throughput: Payload bytes per millisecond
      const throughputVal = log.latency > 0 ? Math.round((log.payload_size || 0) * 1000 / log.latency) : 0;
      // Calculate cryptographic overhead: simulated base latency comparison
      const overheadVal = log.is_secure ? Math.max(0, log.latency - 25) : 0;
      return {
        name: `Pkt ${index + 1}`,
        latency: log.latency || 0,
        payloadSize: log.payload_size || 0,
        throughput: throughputVal,
        overhead: overheadVal,
        isSecure: log.is_secure
      };
    });

  return (
    <div className="space-y-8 pb-10">
      {/* Overview Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: TLS Ratio */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ShieldCheck size={22} className="animate-pulse" />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Cryptographics</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{secureRatio}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TLS Enforced Packets</div>
        </div>

        {/* Metric 2: Live Latency Display */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Clock size={22} />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Response Time</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-2 w-2 rounded-full ${lastLatency > 120 ? 'bg-red-500 animate-ping' : lastLatency > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold font-mono text-slate-800">Live: {lastLatency}ms</span>
              </div>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{avgLatency} ms <span className="text-xs text-slate-400 font-semibold font-sans">(Avg)</span></div>
          <div className="text-[9px] text-slate-400 font-mono font-bold tracking-tight">
            Min: {minLatency}ms | Max: {maxLatency}ms | Jitter: {jitter}ms
          </div>
        </div>

        {/* Metric 3: Safe Pipe Clusters */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
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

        {/* Metric 4: Security rating and visual badge */}
        <div className={`p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md ${
          secureRatio >= 90 
            ? 'bg-emerald-50/20 border-emerald-200 text-emerald-950' 
            : secureRatio >= 50 
            ? 'bg-amber-50/20 border-amber-200 text-amber-950' 
            : 'bg-red-50/20 border-red-200 text-red-950'
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${secureRatio >= 90 ? 'bg-emerald-500' : secureRatio >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
            {secureRatio >= 90 ? 'High Security Level' : secureRatio >= 50 ? 'Medium Vulnerability' : 'Critical Threat Risk'}
          </div>
        </div>
      </div>

      {/* Gateway Selector and Lock Toggle Control Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 block">Target Gateway Node</label>
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
            ? 'bg-emerald-50/30 border-emerald-200/60' 
            : 'bg-orange-50/30 border-orange-200/60'
        }`}>
          {selectedGateway && (
            <>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  selectedGateway.is_secure 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' 
                    : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  {selectedGateway.is_secure ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Lock size={26} />
                    </motion.div>
                  ) : (
                    <Unlock size={26} />
                  )}
                </div>
                <div>
                  <h4 className="text-md font-black text-slate-900 tracking-tight flex items-center flex-wrap gap-2">
                    <span>{selectedGateway.is_secure ? 'Secure TLS Tunnel Enforced' : 'Plaintext HTTP Routing Active'}</span>
                    <span className={`text-[9px] border font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase ${
                      selectedGateway.is_secure 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-orange-100 text-orange-800 border-orange-300'
                    }`}>
                      {selectedGateway.is_secure ? 'TLS_1.3' : 'PLAIN_HTTP'}
                    </span>
                    <span className={`text-[9px] border font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase ${
                      selectedGateway.is_secure 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    }`}>
                      {selectedGateway.is_secure ? 'Encrypted' : 'Vulnerable'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                    {selectedGateway.is_secure 
                      ? 'Secure Socket Layer wraps all payloads. Automatic protection against spoofing & sniffing attacks. Cipher: TLS_AES_256_GCM_SHA384.' 
                      : 'WARNING: Telemetry transmits in unencrypted format. Prone to MITM packet interception and data eavesdropping.'
                    }
                  </p>
                </div>
              </div>

              {/* Secure/Insecure iOS Toggle + Button Action */}
              <div className="flex flex-col items-end gap-3 shrink-0 relative z-10">
                {/* Switch Toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${selectedGateway.is_secure ? 'text-slate-400' : 'text-orange-600'}`}>
                    Plaintext
                  </span>
                  <button
                    role="switch"
                    aria-checked={selectedGateway.is_secure}
                    disabled={togglingId === selectedGateway.id}
                    onClick={() => handleToggleSecure(selectedGateway.id, selectedGateway.is_secure)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                      selectedGateway.is_secure ? 'bg-emerald-600' : 'bg-orange-500'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                        selectedGateway.is_secure ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${selectedGateway.is_secure ? 'text-emerald-600' : 'text-slate-400'}`}>
                    TLS Enforce
                  </span>
                </div>

                <button
                  disabled={togglingId === selectedGateway.id}
                  onClick={() => handleToggleSecure(selectedGateway.id, selectedGateway.is_secure)}
                  className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-md ${
                    selectedGateway.is_secure 
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-100' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-100'
                  }`}
                >
                  {togglingId === selectedGateway.id ? (
                    <RefreshCw className="animate-spin" size={12} />
                  ) : selectedGateway.is_secure ? (
                    <>
                      <Unlock size={12} /> Downgrade to HTTP
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> Enforce TLS 1.3
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

        {/* Latency, Payload Size & Throughput tracker */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Real-Time Telemetry Analytics</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live data plotting & cryptographic overhead cost</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Selector */}
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <button 
                    onClick={() => setActiveMetric('latency')}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      activeMetric === 'latency' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Latency
                  </button>
                  <button 
                    onClick={() => setActiveMetric('payloadSize')}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      activeMetric === 'payloadSize' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Payload Size
                  </button>
                  <button 
                    onClick={() => setActiveMetric('throughput')}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      activeMetric === 'throughput' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Throughput
                  </button>
                </div>

                {/* Multiple Graph Types Selector */}
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <button 
                    onClick={() => setActiveGraphType('area')}
                    className={`p-1.5 rounded-lg text-xs transition-all ${activeGraphType === 'area' ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-950'}`}
                    title="Area Chart"
                  >
                    <TrendingUp size={14} />
                  </button>
                  <button 
                    onClick={() => setActiveGraphType('bar')}
                    className={`p-1.5 rounded-lg text-xs transition-all ${activeGraphType === 'bar' ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-950'}`}
                    title="Bar Chart"
                  >
                    <BarChart3 size={14} />
                  </button>
                  <button 
                    onClick={() => setActiveGraphType('line')}
                    className={`p-1.5 rounded-lg text-xs transition-all ${activeGraphType === 'line' ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-950'}`}
                    title="Line Chart"
                  >
                    <LineIcon size={14} />
                  </button>
                </div>
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
                        <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedGateway?.is_secure ? "#10b981" : "#f97316"} stopOpacity={0.25}/>
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
                        dataKey={activeMetric} 
                        name={activeMetric === 'latency' ? 'Latency (ms)' : activeMetric === 'payloadSize' ? 'Payload Size (Bytes)' : 'Throughput (Bytes/ms)'}
                        stroke={selectedGateway?.is_secure ? "#10b981" : "#f97316"} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#glowColor)" 
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
                        dataKey={activeMetric} 
                        name={activeMetric === 'latency' ? 'Latency (ms)' : activeMetric === 'payloadSize' ? 'Payload Size (Bytes)' : 'Throughput (Bytes/ms)'}
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
                        dataKey={activeMetric} 
                        name={activeMetric === 'latency' ? 'Latency (ms)' : activeMetric === 'payloadSize' ? 'Payload Size (Bytes)' : 'Throughput (Bytes/ms)'}
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
            {lastLatency > 120 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertTriangle className="text-red-500 shrink-0 animate-bounce" size={18} />
                <div>
                  <div className="text-[10px] text-red-800 font-black uppercase tracking-wider">High Processing Latency Alert</div>
                  <div className="text-[10px] text-red-600 font-semibold mt-0.5">Response time spike of {lastLatency}ms detected! Potential cryptographic overhead bottleneck.</div>
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
        <div className="p-8 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Security & Encryption Registry</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit trail log of all intercepts</p>
          </div>
          
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 xl:max-w-4xl w-full">
            {/* Protocol Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-2">Protocol:</span>
              {['all', 'secure', 'insecure'].map((proto) => (
                <button
                  key={proto}
                  onClick={() => setFilterProtocol(proto)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    filterProtocol === proto 
                      ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  {proto === 'all' ? 'All' : proto === 'secure' ? 'TLS 1.3' : 'HTTP'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-2">Status:</span>
              {['all', 'success', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    filterStatus === st 
                      ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'success' ? 'Success' : 'Failed'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative group w-full md:flex-1 md:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search packets (Device, Payload, ID)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-xs text-slate-700 placeholder:text-slate-400"
              />
            </div>
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
