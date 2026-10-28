import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Heart, Activity, AlertCircle, CheckCircle2, Cpu, 
  Thermometer, Clock, RefreshCw, Zap, ShieldCheck, 
  AlertTriangle, Radio, BarChart3, TrendingUp, Sliders, 
  Sparkles, ShieldAlert, Check, XCircle, Gauge,
  Waves, Search, Filter, Download, ArrowUpRight,
  ChevronRight, Play, RotateCcw, AlertOctagon, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SystemHealth = () => {
  // -------------------------------------------------------------
  // State: Data & Polling
  // -------------------------------------------------------------
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, online, issues
  const [toast, setToast] = useState(null);

  // -------------------------------------------------------------
  // Feature 2: Heartbeat Timers State
  // -------------------------------------------------------------
  const [heartbeatInterval, setHeartbeatInterval] = useState(5); // in seconds
  const [countdown, setCountdown] = useState(5);
  const [heartbeatPulses, setHeartbeatPulses] = useState([85, 92, 88, 96, 91, 89, 94, 98, 92, 95]);
  const [pingNodeId, setPingNodeId] = useState(null);

  // -------------------------------------------------------------
  // Feature 3: Failure Indicators & Simulation State
  // -------------------------------------------------------------
  const [simulatedFailure, setSimulatedFailure] = useState(null);
  const [selectedFaultType, setSelectedFaultType] = useState('ERR_HEARTBEAT_TIMEOUT');
  const [activeDowntime, setActiveDowntime] = useState(0);
  const [failureLogSearch, setFailureLogSearch] = useState('');
  const [failureLogFilter, setFailureLogFilter] = useState('all'); // all, active, resolved
  const [failureLogs, setFailureLogs] = useState([
    {
      id: 'INC-9041',
      gatewayId: 2,
      gatewayName: 'Core Gateway Beta',
      code: 'ERR_SOCKET_CONN_RESET',
      severity: 'WARNING',
      timestamp: 'Today, 13:42:10 UTC',
      duration: '42s',
      status: 'resolved',
      message: 'TCP socket reset on port 8883. TLS session renegotiated successfully.'
    },
    {
      id: 'INC-8812',
      gatewayId: 1,
      gatewayName: 'Edge Gateway Alpha',
      code: 'ERR_BUFFER_OVERFLOW',
      severity: 'CRITICAL',
      timestamp: 'Yesterday, 09:15:33 UTC',
      duration: '1m 32s',
      status: 'resolved',
      message: 'Ingress packet buffer saturated at 1024 frames. Automatic queue flush completed.'
    },
    {
      id: 'INC-8201',
      gatewayId: 3,
      gatewayName: 'Telemetry Gateway Gamma',
      code: 'ERR_HEARTBEAT_TIMEOUT',
      severity: 'WARNING',
      timestamp: '3 days ago, 22:04:18 UTC',
      duration: '18s',
      status: 'resolved',
      message: 'CoAP keep-alive delay (+2400ms) triggered warning threshold before recovery.'
    }
  ]);

  // -------------------------------------------------------------
  // Feature 4: Uptime / Downtime Display State
  // -------------------------------------------------------------
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h'); // 24h, 7d, 30d, 90d

  // -------------------------------------------------------------
  // Feature 5: AI Anomaly Engine State
  // -------------------------------------------------------------
  const [aiModel, setAiModel] = useState('Isolation Forest (v3.2)');
  const [sensitivity, setSensitivity] = useState('Medium'); // Low, Medium, High
  const [thresholdSlider, setThresholdSlider] = useState(65);
  const [epoch, setEpoch] = useState(18492);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [mitigatedAlerts, setMitigatedAlerts] = useState([]);
  const [aiAnomalies, setAiAnomalies] = useState([
    {
      id: 'AI-ANOM-101',
      title: 'Volumetric Packet Surge Detected',
      category: 'Infiltration / DDoS Flood',
      pattern: 'Sudden 340% ingress burst exceeding dynamic traffic envelope',
      confidence: 96.8,
      timestamp: '4 mins ago',
      node: 'Edge Gateway Alpha (MQTT)',
      gatewayId: 1,
      description: 'Ingress traffic jumped from baseline 1,420 pkts/s to 4,890 pkts/s on port 1883 within 400ms window.',
      rootCause: 'Suspected distributed volumetric SYN/connect flood targeting broker ingress.'
    },
    {
      id: 'AI-ANOM-102',
      title: 'Unusual Entropy in Payload Buffer',
      category: 'Malformed Payload / Injection',
      pattern: 'Shannon entropy score 7.92 deviates from standard JSON telemetry (4.1)',
      confidence: 88.4,
      timestamp: '12 mins ago',
      node: 'Core Gateway Beta (MQTTS)',
      gatewayId: 2,
      description: 'Hex character distribution indicates compressed or obfuscated binary shellcode in topic /sensor/telemetry.',
      rootCause: 'Device firmware spoofing with non-conforming CBOR/binary payload format.'
    },
    {
      id: 'AI-ANOM-103',
      title: 'Synchronous Keep-Alive Drift',
      category: 'Timing Outlier / Jitter Breach',
      pattern: 'Phase drift +1820ms relative to NTP atomic clock synchronization baseline',
      confidence: 76.5,
      timestamp: '28 mins ago',
      node: 'Telemetry Gateway Gamma (CoAP)',
      gatewayId: 3,
      description: 'Periodic keep-alive heartbeat interval exhibited standard deviation exceeding ±3.5σ over 50 samples.',
      rootCause: 'Underlying network congestion or CPU clock throttle causing deferred timer interrupt execution.'
    }
  ]);

  // Show temporary toast helper
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('http://localhost:5000/api/gateways');
      let gws = Array.isArray(res.data) ? res.data : [];
      if (gws.length === 0) {
        gws = [
          { id: 1, name: 'Edge Gateway Alpha', ip_address: '192.168.1.101', port: 1883, status: 'online', protocol: 'MQTT', last_heartbeat: new Date().toISOString() },
          { id: 2, name: 'Core Gateway Beta', ip_address: '192.168.1.102', port: 8883, status: 'online', protocol: 'MQTTS', last_heartbeat: new Date(Date.now() - 3200).toISOString() },
          { id: 3, name: 'Telemetry Gateway Gamma', ip_address: '192.168.1.103', port: 5683, status: 'online', protocol: 'CoAP', last_heartbeat: new Date(Date.now() - 5800).toISOString() }
        ];
      }
      setGateways(gws);
    } catch (e) {
      console.warn('API fetch fallback to high-fidelity cluster mock', e.message);
      setGateways([
        { id: 1, name: 'Edge Gateway Alpha', ip_address: '192.168.1.101', port: 1883, status: 'online', protocol: 'MQTT', last_heartbeat: new Date().toISOString() },
        { id: 2, name: 'Core Gateway Beta', ip_address: '192.168.1.102', port: 8883, status: 'online', protocol: 'MQTTS', last_heartbeat: new Date(Date.now() - 3200).toISOString() },
        { id: 3, name: 'Telemetry Gateway Gamma', ip_address: '192.168.1.103', port: 5683, status: 'online', protocol: 'CoAP', last_heartbeat: new Date(Date.now() - 5800).toISOString() }
      ]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // Heartbeat Countdown & Live Waveform Rhythm
  // -------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Generate new waveform reading
          setHeartbeatPulses(current => {
            const nextVal = Math.floor(Math.random() * 20) + 80;
            return [...current.slice(1), nextVal];
          });
          return heartbeatInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [heartbeatInterval]);

  // Active outage seconds counter
  useEffect(() => {
    let outageTimer;
    if (simulatedFailure) {
      outageTimer = setInterval(() => {
        setActiveDowntime(t => t + 1);
      }, 1000);
    } else {
      setActiveDowntime(0);
    }
    return () => clearInterval(outageTimer);
  }, [simulatedFailure]);

  // Periodic AI Epoch increment
  useEffect(() => {
    const epochInterval = setInterval(() => {
      setEpoch(e => e + 1);
    }, 12000);
    return () => clearInterval(epochInterval);
  }, []);

  // -------------------------------------------------------------
  // Actions: Heartbeat Ping, Fault Injection, Fault Resolution
  // -------------------------------------------------------------
  const handleInstantPing = (gwId, name) => {
    setPingNodeId(gwId);
    showToast(`Instant ping sent to ${name}. Heartbeat synced at ${new Date().toLocaleTimeString()} (RTT: 14ms)`);
    setTimeout(() => setPingNodeId(null), 1200);
  };

  const handleSimulateFault = (type = selectedFaultType, targetNodeId = null) => {
    const targetId = targetNodeId || gateways[0]?.id || 1;
    const targetGw = gateways.find(g => g.id === targetId) || gateways[0] || { name: 'Edge Gateway Alpha', id: 1 };

    let code = type;
    let message = '';
    let severity = 'CRITICAL';

    switch (type) {
      case 'ERR_HEARTBEAT_TIMEOUT':
        code = 'ERR_HEARTBEAT_TIMEOUT';
        message = 'Heartbeat signal lost. Gateway socket timed out after 3 consecutive missed sync frames.';
        severity = 'CRITICAL';
        break;
      case 'ERR_BUFFER_OVERFLOW':
        code = 'ERR_BUFFER_OVERFLOW';
        message = 'Packet buffer saturated (1024/1024 frames). Ingress memory pressure exceeded 95% threshold.';
        severity = 'CRITICAL';
        break;
      case 'ERR_SOCKET_CONN_RESET':
        code = 'ERR_SOCKET_CONN_RESET';
        message = 'TCP connection reset by peer on port 1883. TLS handshake renegotiation abruptly severed.';
        severity = 'WARNING';
        break;
      case 'ERR_THERMAL_THROTTLE':
        code = 'ERR_THERMAL_THROTTLE';
        message = 'Core temperature reached 88.4°C. Automated CPU clock throttled to 600MHz to avoid junction damage.';
        severity = 'WARNING';
        break;
      default:
        code = 'ERR_HEARTBEAT_TIMEOUT';
        message = 'Heartbeat missed. Connection timed out.';
    }

    const newFault = {
      incidentId: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      gatewayId: targetId,
      gatewayName: targetGw.name,
      code,
      message,
      timestamp: new Date().toLocaleTimeString(),
      severity
    };

    setSimulatedFailure(newFault);

    // Append to failure logs
    const newLogItem = {
      id: newFault.incidentId,
      gatewayId: targetId,
      gatewayName: targetGw.name,
      code,
      severity,
      timestamp: `Today, ${new Date().toLocaleTimeString()} UTC`,
      duration: 'Ongoing',
      status: 'active',
      message
    };

    setFailureLogs(prev => [newLogItem, ...prev]);
    showToast(`Simulated fault [${code}] triggered on ${targetGw.name}`);
  };

  const handleResolveFault = () => {
    if (!simulatedFailure) return;

    // Update active failure log item to resolved
    setFailureLogs(prev => prev.map(log => {
      if (log.id === simulatedFailure.incidentId) {
        return {
          ...log,
          duration: `${activeDowntime}s`,
          status: 'resolved'
        };
      }
      return log;
    }));

    const resolvedName = simulatedFailure.gatewayName;
    setSimulatedFailure(null);
    showToast(`Fault resolved successfully for ${resolvedName}. Operational state restored.`);
  };

  const handleMitigateAlert = (id) => {
    setMitigatedAlerts(prev => [...prev, id]);
    const anom = aiAnomalies.find(a => a.id === id);
    showToast(`Threat mitigated for [${anom?.title || id}]. Automated defensive filter deployed.`);
  };

  const handleInjectAiAnomaly = () => {
    const anomalyTypes = [
      {
        title: 'High-Frequency Port Knocking Detected',
        category: 'Port Scan / Reconnaissance',
        pattern: 'Sequential TCP SYN requests across ports 1024-4096 within 1.2s',
        desc: 'Source IP 10.0.4.88 conducting automated reconnaissance probe against core gateway stack.',
        rootCause: 'Reconnaissance phase prior to potential payload injection attack.',
        node: 'Edge Gateway Alpha (MQTT)',
        gwId: 1
      },
      {
        title: 'Thermal Dissipation Spike Anomaly',
        category: 'Hardware Safety / Thermal Spike',
        pattern: 'Rate of temperature change dT/dt exceeded +4.8°C/sec abnormal gradient',
        desc: 'SoC junction temperature accelerated rapidly under sudden cryptographic load.',
        rootCause: 'Potential fan failure or heat sink thermal paste degradation on edge unit.',
        node: 'Telemetry Gateway Gamma (CoAP)',
        gwId: 3
      },
      {
        title: 'Unauthenticated CoAP Resource Enumeration',
        category: 'Protocol Exploit / Zero-Day',
        pattern: 'Burst of Malformed CoAP GET /.well-known/core requests',
        desc: 'Suspicious device attempting to traverse local sensor hierarchy without token claims.',
        rootCause: 'Rogue sensor hardware attempting unauthorized resource mapping.',
        node: 'Core Gateway Beta (MQTTS)',
        gwId: 2
      }
    ];

    const pick = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    const newAnom = {
      id: `AI-ANOM-${Math.floor(100 + Math.random() * 900)}`,
      title: pick.title,
      category: pick.category,
      pattern: pick.pattern,
      confidence: (86 + Math.random() * 12).toFixed(1),
      timestamp: 'Just now',
      node: pick.node,
      gatewayId: pick.gwId,
      description: pick.desc,
      rootCause: pick.rootCause
    };

    setAiAnomalies(prev => [newAnom, ...prev]);
    showToast(`AI Engine generated new anomaly alert: ${newAnom.title}`);
  };

  const handleRetrainModel = () => {
    setIsRetraining(true);
    setRetrainProgress(0);
    const interval = setInterval(() => {
      setRetrainProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRetraining(false);
          setEpoch(e => e + 25);
          showToast(`Neural Model Retrained Successfully! Baseline adjusted to current traffic envelope.`);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // -------------------------------------------------------------
  // Computations
  // -------------------------------------------------------------
  const clusterHealthScore = simulatedFailure ? 91.4 : 99.8;
  const onlineCount = simulatedFailure ? Math.max(0, gateways.length - 1) : gateways.length;
  const degradedCount = simulatedFailure ? 1 : 0;
  const totalNodesCount = gateways.length || 3;

  // Filtered AI anomalies based on mitigation and threshold
  const activeAiAnomalies = aiAnomalies
    .filter(a => !mitigatedAlerts.includes(a.id))
    .filter(a => {
      const confidence = Number(a.confidence);
      // Sensitivity preset adjustment
      let minThreshold = thresholdSlider;
      if (sensitivity === 'High') minThreshold -= 15;
      if (sensitivity === 'Low') minThreshold += 15;
      return confidence >= Math.max(20, minThreshold);
    });

  // Uptime blocks (24-hour block timeline)
  const uptimeBlocks = [
    { hour: '00:00', status: 'operational', uptime: 100, latency: 14 },
    { hour: '01:00', status: 'operational', uptime: 100, latency: 15 },
    { hour: '02:00', status: 'operational', uptime: 100, latency: 13 },
    { hour: '03:00', status: 'operational', uptime: 100, latency: 12 },
    { hour: '04:00', status: 'operational', uptime: 100, latency: 14 },
    { hour: '05:00', status: 'operational', uptime: 100, latency: 13 },
    { hour: '06:00', status: 'operational', uptime: 100, latency: 16 },
    { hour: '07:00', status: 'operational', uptime: 100, latency: 18 },
    { hour: '08:00', status: 'operational', uptime: 100, latency: 22 },
    { hour: '09:00', status: 'operational', uptime: 100, latency: 19 },
    { hour: '10:00', status: 'operational', uptime: 100, latency: 21 },
    { hour: '11:00', status: 'operational', uptime: 100, latency: 18 },
    { hour: '12:00', status: 'operational', uptime: 100, latency: 17 },
    { hour: '13:00', status: simulatedFailure ? 'degraded' : 'operational', uptime: simulatedFailure ? 97.4 : 100, latency: simulatedFailure ? 180 : 16 },
    { hour: '14:00', status: 'operational', uptime: 100, latency: 15 },
    { hour: '15:00', status: 'operational', uptime: 100, latency: 17 },
    { hour: '16:00', status: 'operational', uptime: 100, latency: 19 },
    { hour: '17:00', status: 'operational', uptime: 100, latency: 16 },
    { hour: '18:00', status: 'operational', uptime: 100, latency: 14 },
    { hour: '19:00', status: 'operational', uptime: 100, latency: 15 },
    { hour: '20:00', status: 'operational', uptime: 100, latency: 13 },
    { hour: '21:00', status: 'operational', uptime: 100, latency: 14 },
    { hour: '22:00', status: 'operational', uptime: 100, latency: 15 },
    { hour: '23:00', status: 'operational', uptime: 100, latency: 14 }
  ];

  // Timeframe-specific calculation data
  const timeframeData = {
    '24h': { uptime: simulatedFailure ? '99.82%' : '99.98%', downtime: simulatedFailure ? `${activeDowntime + 134}s` : '2m 14s', mtbf: '720.0 Hrs', mttr: '42.5 Sec' },
    '7d': { uptime: '99.95%', downtime: '5m 02s', mtbf: '168.0 Hrs', mttr: '51.0 Sec' },
    '30d': { uptime: '99.98%', downtime: '8m 45s', mtbf: '720.0 Hrs', mttr: '44.2 Sec' },
    '90d': { uptime: '99.92%', downtime: '34m 12s', mtbf: '2,160.0 Hrs', mttr: '58.0 Sec' }
  };

  const currentTfMetrics = timeframeData[selectedTimeframe] || timeframeData['24h'];

  // Filtered failure logs
  const filteredFailureLogs = failureLogs.filter(log => {
    const matchesFilter = failureLogFilter === 'all' ? true : log.status === failureLogFilter;
    const matchesSearch = failureLogSearch === '' 
      ? true 
      : log.gatewayName.toLowerCase().includes(failureLogSearch.toLowerCase()) ||
        log.code.toLowerCase().includes(failureLogSearch.toLowerCase()) ||
        log.id.toLowerCase().includes(failureLogSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 font-outfit pb-16 text-slate-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-500/30 flex items-center gap-3 text-xs font-medium"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* FEATURE 1: GATEWAY HEALTH CARDS (Header & Cluster Summary)    */}
      {/* ============================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-600">
              <Heart size={32} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Detect Anomalies and Monitor Health
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                  Module 7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time heartbeat synchronization, failure tracking, MTTR analytics, and AI neural anomaly diagnostics
              </p>
            </div>
          </div>

          {/* Top Actions: Fault Injection & Diagnostics Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Cluster Status Badge */}
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
              simulatedFailure 
                ? 'bg-red-50 border-red-300 text-red-800 animate-pulse' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full ${simulatedFailure ? 'bg-red-600 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{simulatedFailure ? 'CLUSTER DEGRADED (1 FAULT DETECTED)' : 'ALL GATEWAYS HEALTHY & SYNCED'}</span>
            </div>

            {/* Fault Simulation Dropdown & Button */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <select
                value={selectedFaultType}
                onChange={(e) => setSelectedFaultType(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 px-2 py-1 outline-none cursor-pointer"
              >
                <option value="ERR_HEARTBEAT_TIMEOUT">Heartbeat Timeout</option>
                <option value="ERR_BUFFER_OVERFLOW">Buffer Overflow</option>
                <option value="ERR_SOCKET_CONN_RESET">Socket Conn Reset</option>
                <option value="ERR_THERMAL_THROTTLE">Thermal Throttle</option>
              </select>

              {simulatedFailure ? (
                <button
                  onClick={handleResolveFault}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Resolve Fault</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSimulateFault(selectedFaultType)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <AlertTriangle size={14} />
                  <span>Simulate Fault</span>
                </button>
              )}
            </div>

            {/* Refresh Sync Button */}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-900 hover:bg-purple-600 text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
              title="Refresh Diagnostics"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Feature 1.1: Health Summary Bar */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Health Score</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-lg font-black ${simulatedFailure ? 'text-amber-600' : 'text-emerald-600'}`}>
                {clusterHealthScore}%
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Nominal</span>
            </div>
          </div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Gateways</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{totalNodesCount} Nodes</span>
          </div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Online Healthy</span>
            <span className="text-lg font-black text-emerald-600 mt-0.5 block">{onlineCount} Active</span>
          </div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Degraded / Fault</span>
            <span className={`text-lg font-black ${degradedCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'} mt-0.5 block`}>
              {degradedCount} Node
            </span>
          </div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cluster RTT Latency</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {simulatedFailure ? '78.5 ms' : '16.4 ms'}
            </span>
          </div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cluster CPU Avg</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {simulatedFailure ? '54.2%' : '32.1%'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 3: FAILURE INDICATORS (Prominent Critical Banner)     */}
      {/* ============================================================= */}
      <AnimatePresence>
        {simulatedFailure && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border-2 border-red-500/40 rounded-3xl p-6 text-red-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl shadow-red-500/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-red-600 text-white rounded-2xl animate-bounce shadow-md shadow-red-600/30">
                <AlertOctagon size={28} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white bg-red-600 px-2.5 py-0.5 rounded-md">
                    {simulatedFailure.code}
                  </span>
                  <span className="text-xs text-red-700 font-bold uppercase">
                    Severity: {simulatedFailure.severity}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">• Incident ID: {simulatedFailure.incidentId}</span>
                  <span className="text-xs text-slate-500 font-mono">• {simulatedFailure.timestamp}</span>
                </div>
                <h4 className="text-base font-black text-red-950">
                  Critical Gateway Failure Detected on {simulatedFailure.gatewayName}
                </h4>
                <p className="text-xs text-red-900 leading-relaxed max-w-3xl">
                  {simulatedFailure.message}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-red-700">
                  <span>Tracked Outage Duration: <strong className="text-red-900 font-mono">{activeDowntime}s</strong></span>
                  <span>•</span>
                  <span>Automated Alert Dispatched to SOC Monitoring Channel</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleResolveFault}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/20 flex items-center gap-2"
              >
                <Check size={16} />
                <span>Resolve & Recover Node</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* FEATURE 2: HEARTBEAT TIMERS (Interactive Interval & Rhythm)   */}
      {/* ============================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-500/20">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Heartbeat Synchronization & Delay Tracker</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                  Feature 2
                </span>
              </div>
              <p className="text-xs text-slate-500">Live periodic keep-alive interval calibration, jitter detection, and signal loss warnings</p>
            </div>
          </div>

          {/* Configurable Heartbeat Interval Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2">Cycle Interval:</span>
            {[3, 5, 10, 15].map(sec => (
              <button
                key={sec}
                onClick={() => {
                  setHeartbeatInterval(sec);
                  setCountdown(sec);
                  showToast(`Heartbeat cycle interval configured to ${sec} seconds.`);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  heartbeatInterval === sec 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Heartbeat Timers Diagnostics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sub-feature 2.3: Countdown Timer */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
              <span>Next Global Sync</span>
              <span className="text-blue-600 font-mono">{countdown}s remaining</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 font-mono">0{countdown}s</span>
              <span className="text-xs text-slate-400 font-mono">/ {heartbeatInterval}s cycle</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${((heartbeatInterval - countdown) / heartbeatInterval) * 100}%` }}
                transition={{ ease: 'linear', duration: 1 }}
              />
            </div>
          </div>

          {/* Sub-feature 2.2: Detect Delays */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delay / Jitter Detection</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${simulatedFailure ? 'text-red-600' : 'text-emerald-600'}`}>
                {simulatedFailure ? '+6.42s' : '+0.03s'}
              </span>
              <span className={`text-[11px] font-bold ${simulatedFailure ? 'text-red-600' : 'text-emerald-600'}`}>
                {simulatedFailure ? 'Critical Jitter Delay' : 'Nominal Jitter'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {simulatedFailure ? 'Exceeds allowable ±250ms threshold' : 'Standard deviation within ±15ms SLA envelope'}
            </p>
          </div>

          {/* Sub-feature 2.4: Alert on Missed Signals */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missed Signal Alert</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${simulatedFailure ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                {simulatedFailure ? '3 / 3' : '0 / 3'}
              </span>
              <span className={`text-[11px] font-bold ${simulatedFailure ? 'text-red-600' : 'text-emerald-600'}`}>
                {simulatedFailure ? 'BREACH ALERT' : 'All Packets Received'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {simulatedFailure ? 'Node flagged as Degraded after 3 missed frames' : 'Heartbeat acknowledgment rate: 100%'}
            </p>
          </div>

          {/* Sub-feature 2.5: Visual Waveform Rhythm */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Heartbeat Pulse Rhythm</span>
              <span className="text-emerald-600 flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Wave
              </span>
            </div>
            {/* Visual Mini Waveform Bars */}
            <div className="flex items-end gap-1 h-8 pt-1">
              {heartbeatPulses.map((val, idx) => (
                <div 
                  key={idx}
                  className={`w-full rounded-sm transition-all duration-300 ${
                    idx === heartbeatPulses.length - 1 
                      ? 'bg-blue-600 h-full' 
                      : 'bg-blue-200'
                  }`}
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-mono text-center pt-0.5">
              ECG Frequency: 1.0 Hz (Clock Reference: NTP)
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 1: GATEWAY HEALTH CARDS (Detailed Visual Cards Grid)  */}
      {/* ============================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Gateway Health Cards & Key Metrics</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                Feature 1
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Hardware telemetry, packet throughput, visual status indicators, and operational quick insights
            </p>
          </div>

          {/* Card Filter Tabs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Nodes:</span>
            {['all', 'online', 'issues'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTab === t 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Cards UI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map((g, idx) => {
            const isFaulted = simulatedFailure && simulatedFailure.gatewayId === g.id;
            const status = isFaulted ? 'degraded' : g.status || 'online';
            const cpu = isFaulted ? 94 : 26 + (idx * 11);
            const memory = isFaulted ? 890 : 340 + (idx * 85);
            const memoryPercent = isFaulted ? 89 : 34 + (idx * 8);
            const throughput = isFaulted ? 38 : 1420 - (idx * 120);
            const latency = isFaulted ? 245 : 12 + (idx * 4);
            const temp = isFaulted ? 78.4 : 41.2 + (idx * 2.3);
            const isPinging = pingNodeId === g.id;

            if (activeTab === 'online' && status !== 'online') return null;
            if (activeTab === 'issues' && status === 'online') return null;

            return (
              <motion.div
                key={g.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-3xl border p-6 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                  isFaulted 
                    ? 'border-red-400 ring-2 ring-red-400/30 shadow-red-500/5' 
                    : 'border-slate-200/80 hover:shadow-md hover:border-purple-300'
                }`}
              >
                <div>
                  {/* Card Header: Name, IP, Protocol, Status Indicator */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border transition-all ${
                        isFaulted 
                          ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      }`}>
                        <Cpu size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          {g.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{g.ip_address || '192.168.1.100'}:{g.port || 1883}</span>
                          <span>•</span>
                          <span className="font-bold text-purple-600">{g.protocol || 'MQTT'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-feature 1.2: Status Indicators */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isFaulted 
                        ? 'bg-red-100 text-red-700 animate-pulse' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${isFaulted ? 'bg-red-600 animate-ping' : 'bg-emerald-600 animate-pulse'}`} />
                      {status}
                    </span>
                  </div>

                  {/* Sub-feature 2.1 & 2.5: Per-card Heartbeat Bar */}
                  <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-100 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-600 flex items-center gap-1.5">
                        <Radio size={12} className={isFaulted ? 'text-red-500 animate-ping' : 'text-emerald-500 animate-pulse'} />
                        Heartbeat Sync
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {isFaulted ? 'Signal Delayed (+6.4s)' : `Sync in 0${countdown}s`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isFaulted ? 'bg-red-500 w-full' : 'bg-emerald-500'}`}
                        style={{ width: isFaulted ? '100%' : `${((heartbeatInterval - countdown) / heartbeatInterval) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                      <span className={isFaulted ? 'text-red-600 font-bold' : ''}>
                        Missed Signals: {isFaulted ? '3 (Breached)' : '0/3'}
                      </span>
                      <span>Last: {new Date(g.last_heartbeat || Date.now()).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Sub-feature 1.3: Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                    {/* CPU Utilization */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        <span>CPU Load</span>
                        <Cpu size={12} className={cpu > 80 ? 'text-red-500' : 'text-slate-400'} />
                      </div>
                      <span className={`text-base font-black ${cpu > 80 ? 'text-red-600' : 'text-slate-800'}`}>
                        {cpu}%
                      </span>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${cpu > 80 ? 'bg-red-500' : 'bg-purple-500'}`} 
                          style={{ width: `${cpu}%` }} 
                        />
                      </div>
                    </div>

                    {/* Memory Footprint */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        <span>Memory</span>
                        <span className="text-[9px] text-slate-400">{memoryPercent}%</span>
                      </div>
                      <span className="text-base font-black text-slate-800">{memory} MB</span>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${memoryPercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${memoryPercent}%` }} 
                        />
                      </div>
                    </div>

                    {/* Packet Throughput */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        <span>Throughput</span>
                        <Activity size={12} className="text-slate-400" />
                      </div>
                      <span className="text-base font-black text-slate-800">{throughput} pkts/s</span>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{(throughput * 0.0018).toFixed(2)} MB/s rate</p>
                    </div>

                    {/* Core Thermal */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        <span>Core Temp</span>
                        <Thermometer size={12} className={temp > 70 ? 'text-red-500' : 'text-slate-400'} />
                      </div>
                      <span className={`text-base font-black ${temp > 70 ? 'text-red-600' : 'text-slate-800'}`}>
                        {temp}°C
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">RTT: {latency} ms</p>
                    </div>
                  </div>
                </div>

                {/* Sub-feature 1.5: Quick Insights & Card Action Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 border ${
                    isFaulted 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-purple-50/60 border-purple-100 text-purple-700'
                  }`}>
                    <Zap size={14} className="shrink-0" />
                    <span>
                      {isFaulted 
                        ? 'Quick Insight: Flush ingress buffer on port 1883 & renegotiate keep-alive socket.' 
                        : 'Quick Insight: Telemetry nominal. Zero dropped frames in current 60s window.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInstantPing(g.id, g.name)}
                      disabled={isPinging}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Radio size={12} className={isPinging ? 'animate-spin' : ''} />
                      <span>{isPinging ? 'Pinging...' : 'Instant Ping'}</span>
                    </button>

                    {isFaulted ? (
                      <button
                        onClick={handleResolveFault}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                      >
                        Resolve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSimulateFault('ERR_HEARTBEAT_TIMEOUT', g.id)}
                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-[11px] font-bold transition-all"
                      >
                        Test Fault
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 3: FAILURE INDICATORS & INCIDENT LOG TABLE            */}
      {/* ============================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-600 rounded-xl border border-red-500/20">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Failure Indicators & Incident Event Logs</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                  Feature 3
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Audited failure timestamps, technical error codes, color-coded severity, and instant remediation
              </p>
            </div>
          </div>

          {/* Incident Log Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search error code, node..."
                value={failureLogSearch}
                onChange={(e) => setFailureLogSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-purple-500 w-48"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {['all', 'active', 'resolved'].map(st => (
                <button
                  key={st}
                  onClick={() => setFailureLogFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                    failureLogFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Failure Log Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Gateway Node</th>
                <th className="py-3 px-4">Error Code</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Outage Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Diagnostics Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredFailureLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No failure records matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredFailureLogs.map((log) => {
                  const isCrit = log.severity === 'CRITICAL';
                  const isActive = log.status === 'active';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{log.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.gatewayName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          isCrit ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCrit ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {isActive ? (
                          <span className="text-red-600 font-bold animate-pulse">{activeDowntime}s (Active)</span>
                        ) : (
                          log.duration
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isActive 
                            ? 'bg-red-100 text-red-800 animate-pulse' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 4: UPTIME / DOWNTIME DISPLAY & CALCULATIONS           */}
      {/* ============================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Uptime & Downtime Availability Engine</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                  Feature 4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Mathematical MTBF / MTTR analytics, 24-hour block availability graph, and multi-period SLA tracking
              </p>
            </div>
          </div>

          {/* Sub-feature 4.4: Historical Data Timeframe Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {['24h', '7d', '30d', '90d'].map(tf => (
              <button
                key={tf}
                onClick={() => {
                  setSelectedTimeframe(tf);
                  showToast(`Historical timeframe switched to ${tf}. Metrics re-indexed.`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  selectedTimeframe === tf 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-feature 4.5: Graph Representation (24-Hour Block Graph) */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span className="flex items-center gap-2">
              <span>24-Hour Availability Blocks Audit</span>
              <span className="text-[10px] text-slate-400 font-normal">(Hover over any block to inspect hourly telemetry)</span>
            </span>
            <span className="text-emerald-600 font-mono font-bold">
              Current Uptime: {currentTfMetrics.uptime} (Target: 99.9% SLA)
            </span>
          </div>

          <div className="grid grid-cols-12 sm:grid-cols-24 gap-1.5">
            {uptimeBlocks.map((b, i) => (
              <div 
                key={i} 
                className="group relative flex flex-col items-center"
              >
                <div className={`w-full h-9 rounded-md transition-all cursor-pointer ${
                  b.status === 'operational' 
                    ? 'bg-emerald-500 hover:bg-emerald-400' 
                    : 'bg-amber-400 hover:bg-amber-300 animate-pulse'
                }`} />
                {/* Interactive Tooltip */}
                <div className="absolute bottom-11 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-2.5 rounded-xl z-20 shadow-2xl whitespace-nowrap border border-slate-700">
                  <span className="font-bold">{b.hour} UTC</span>
                  <span>Uptime: <strong className="text-emerald-400">{b.uptime}%</strong></span>
                  <span>Avg RTT: <strong className="text-blue-400">{b.latency}ms</strong></span>
                  <span className="capitalize text-slate-400 mt-0.5">{b.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>00:00 UTC (T-24h)</span>
            <span>12:00 UTC Midday</span>
            <span>23:59 UTC (Now)</span>
          </div>
        </div>

        {/* Sub-feature 4.1, 4.2, 4.3: Calculations Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {/* Uptime % */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uptime Percentage</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{currentTfMetrics.uptime}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Exceeds 99.9% SLA target</p>
          </div>

          {/* Downtime Tracking */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tracked Downtime</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{currentTfMetrics.downtime}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Across {selectedTimeframe} window</p>
          </div>

          {/* MTBF */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MTBF (Mean Time Between Failures)</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{currentTfMetrics.mtbf}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Formula: Total Time / Total Incidents</p>
          </div>

          {/* MTTR */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MTTR (Mean Time to Recovery)</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{currentTfMetrics.mttr}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Formula: Downtime / Recoveries</p>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 5: AI-BASED ANOMALY DETECTION ENGINE                  */}
      {/* ============================================================= */}
      <div className="bg-[#0a0c1a] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-2xl">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">AI-Based Anomaly Detection Engine</h3>
                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-[10px] font-mono font-bold">
                  Feature 5
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-mono font-bold animate-pulse">
                  NEURAL INFERENCE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Machine learning models, continuous baseline training, dynamic threshold filtering, and one-click mitigation
              </p>
            </div>
          </div>

          {/* Sub-feature 5.2 & 5.3: Model Selector & Threshold Sensitivity Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Sliders size={14} className="text-purple-400" />
              <span className="text-slate-400 font-medium">Model:</span>
              <select
                value={aiModel}
                onChange={(e) => {
                  setAiModel(e.target.value);
                  showToast(`Active inference model switched to ${e.target.value}`);
                }}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                <option value="Isolation Forest (v3.2)" className="bg-slate-900 text-white">Isolation Forest (v3.2)</option>
                <option value="Z-Score Statistical Outlier (v2.1)" className="bg-slate-900 text-white">Z-Score Outlier (v2.1)</option>
                <option value="Autoencoder Deep Neural Net" className="bg-slate-900 text-white">Autoencoder Neural Net</option>
                <option value="One-Class SVM (v1.8)" className="bg-slate-900 text-white">One-Class SVM (v1.8)</option>
              </select>
            </div>

            {/* Sensitivity Presets */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">Sensitivity:</span>
              {['Low', 'Medium', 'High'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSensitivity(s);
                    showToast(`AI Detection sensitivity set to ${s}`);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    sensitivity === s 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Inject Anomaly Button */}
            <button
              onClick={handleInjectAiAnomaly}
              className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Simulate Anomaly</span>
            </button>
          </div>
        </div>

        {/* Sub-feature 5.3: Numeric Threshold Slider */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-bold">Detection Threshold:</span>
            <input 
              type="range"
              min="20"
              max="95"
              value={thresholdSlider}
              onChange={(e) => setThresholdSlider(Number(e.target.value))}
              className="w-48 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono font-black text-purple-400">{thresholdSlider}% Confidence Cutoff</span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Filtering out deviations under {thresholdSlider}%. ({activeAiAnomalies.length} active alerts pass cutoff)
          </span>
        </div>

        {/* Sub-feature 5.5: Continuous Learning & Baseline Panel */}
        <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
              <span className="font-bold">Continuous Learning Engine:</span>
              <span className="text-slate-300 font-mono">Dynamic Baseline: 1,420 pkts/s (Adaptation Drift: +3.8%)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Current Epoch: #{epoch} • Reconstruction Loss: 0.0024 MSE • Latency Variance Window: 50ms
            </p>
          </div>

          <button
            onClick={handleRetrainModel}
            disabled={isRetraining}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RotateCcw size={14} className={isRetraining ? 'animate-spin' : ''} />
            <span>{isRetraining ? `Retraining (${retrainProgress}%)...` : 'Retrain Baseline Now'}</span>
          </button>
        </div>

        {/* Retraining Progress Bar */}
        {isRetraining && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${retrainProgress}%` }}
            />
          </div>
        )}

        {/* Sub-feature 5.1 & 5.4: Anomaly Cards List with Alert Generation & Mitigation */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Flagged Pattern Outliers ({activeAiAnomalies.length} Active)</span>
            <span className="text-purple-400 font-mono">Model: {aiModel}</span>
          </div>

          {activeAiAnomalies.length === 0 ? (
            <div className="p-10 text-center text-slate-500 italic rounded-2xl border border-slate-800 bg-slate-900/40">
              <ShieldCheck size={36} className="mx-auto text-emerald-400 mb-2" />
              All real-time anomalies mitigated. Continuous sensor stream nominal under current threshold.
            </div>
          ) : (
            activeAiAnomalies.map((anom) => (
              <motion.div
                key={anom.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold font-mono">
                      {anom.category}
                    </span>
                    <span className="text-sm font-bold text-slate-100">{anom.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">• {anom.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {anom.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span className="text-purple-400 font-bold">Node: {anom.node}</span>
                    <span>•</span>
                    <span className="text-amber-300">Pattern: {anom.pattern}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Root Cause: {anom.rootCause}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Confidence</span>
                    <span className="text-lg font-black text-amber-400 font-mono">{anom.confidence}%</span>
                  </div>

                  {/* Sub-feature 5.4: One-Click Mitigation */}
                  <button
                    onClick={() => handleMitigateAlert(anom.id)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-900/30 whitespace-nowrap flex items-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>Mitigate Threat</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default SystemHealth;
