import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  History, Search, AlertCircle, AlertOctagon, AlertTriangle, Info, 
  Download, Trash2, RefreshCw, Filter, Check, Copy, ShieldAlert, 
  ChevronDown, ChevronRight, ChevronsUpDown, ArrowUpDown, 
  SlidersHorizontal, FileJson, Clock, Tag, Shield, Database,
  ArrowRight, ExternalLink, FileText, Terminal, Sliders, X, 
  Radio, Sparkles, Layers, ListFilter, CheckCircle2, Zap, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Seed sample records for comprehensive simulated logging
const SEED_LOGS = [
  {
    id: 101,
    severity: 'CRITICAL',
    priority: 'P1 - Urgent',
    category: 'Security',
    event_type: 'AUTH_BRUTE_FORCE',
    gateway_id: 1,
    device_id: 'dev-sensor-44a',
    tags: ['#security', '#brute-force', '#auth-fail'],
    message: 'Repeated authentication failures (12 attempts within 30s) from unverified IP: 198.51.100.42',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    details: {
      source_ip: '198.51.100.42',
      user_agent: 'CustomPython/3.11-Requests',
      attempts: 12,
      firewall_action: 'IP_TEMPORARY_QUARANTINE',
      packet_bytes: 4096,
      encryption_status: 'TLS_REJECTED',
      remediation: 'Block subnet CIDR and invalidate existing session nonce.'
    }
  },
  {
    id: 102,
    severity: 'CRITICAL',
    priority: 'P1 - Urgent',
    category: 'Network',
    event_type: 'DDOS_FLOOD_SUSPECT',
    gateway_id: 2,
    device_id: 'dev-power-meter-09',
    tags: ['#ddos', '#udp-flood', '#high-traffic'],
    message: 'Inbound UDP packet volume spike detected on port 1883 exceeding normal baseline by 450%',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    details: {
      source_ip: '203.0.113.88',
      protocol: 'UDP',
      ingress_rate_pkts: 18450,
      drop_ratio: 0.88,
      mitigation: 'RATE_LIMIT_RULE_APPLIED',
      remediation: 'Enable Edge rate-limiting filters on Gateway #2.'
    }
  },
  {
    id: 103,
    severity: 'WARNING',
    priority: 'P2 - High',
    category: 'System',
    event_type: 'BUFFER_SATURATION',
    gateway_id: 1,
    device_id: 'gateway-core-alpha',
    tags: ['#buffer', '#memory', '#latency'],
    message: 'MQTT Ingress queue capacity utilized at 87%. Potential packet latency degradation imminent.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    details: {
      queue_depth: 4350,
      queue_max: 5000,
      dropped_events: 0,
      latency_ms: 189,
      memory_usage_mb: 840,
      remediation: 'Flush worker threads or scale broker replica.'
    }
  },
  {
    id: 104,
    severity: 'WARNING',
    priority: 'P2 - High',
    category: 'Heartbeat',
    event_type: 'HEARTBEAT_JITTER',
    gateway_id: 3,
    device_id: 'gateway-telemetry-gamma',
    tags: ['#heartbeat', '#delay', '#keepalive'],
    message: 'Heartbeat response delayed by 2.4 seconds due to temporary network socket congestion.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: {
      expected_interval_s: 5,
      actual_delay_s: 7.4,
      jitter_ms: 2400,
      socket_state: 'TIME_WAIT'
    }
  },
  {
    id: 105,
    severity: 'INFO',
    priority: 'P3 - Normal',
    category: 'Provisioning',
    event_type: 'DEVICE_ONBOARDED',
    gateway_id: 3,
    device_id: 'dev-hvac-controller-01',
    tags: ['#device', '#provision', '#ecc-key'],
    message: 'New IoT Sensor authenticated with ECC P-256 certificate and assigned secure node session.',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    details: {
      cipher: 'ECDHE-ECDSA-AES256-GCM-SHA384',
      lease_duration_sec: 86400,
      allocated_ip: '10.0.4.18',
      mac_address: '4A:7B:99:12:DF:01'
    }
  },
  {
    id: 106,
    severity: 'INFO',
    priority: 'P3 - Normal',
    category: 'Cloud Sync',
    event_type: 'PIPELINE_BATCH_SYNC',
    gateway_id: 2,
    device_id: 'cloud-forwarder-aws',
    tags: ['#cloud', '#sync', '#telemetry'],
    message: 'Dispatched encrypted batch of 250 telemetry records to Cloud Broker endpoint successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    details: {
      batch_id: 'bat-9481-ac7',
      payload_size_kb: 48.2,
      endpoint: 's3://iot-gateway-archive/2026/10/',
      latency_ms: 38,
      sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }
  },
  {
    id: 107,
    severity: 'DEBUG',
    priority: 'P4 - Low',
    category: 'System',
    event_type: 'TCP_SOCKET_KEEPALIVE',
    gateway_id: 1,
    device_id: 'edge-controller-node',
    tags: ['#debug', '#tcp', '#socket'],
    message: 'TCP keepalive probe received and acknowledged on socket descriptor #14.',
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    details: {
      socket_fd: 14,
      round_trip_ms: 3,
      window_size_bytes: 65535
    }
  }
];

const Logs = () => {
  const { user } = useContext(AuthContext);

  // Persistent Alert History Storage in localStorage
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('iot_persistent_alerts_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading persistent alert history:', e);
    }
    return SEED_LOGS;
  });

  // Recent Search History Storage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('iot_recent_searches');
      return saved ? JSON.parse(saved) : ['#security', '#ddos', '198.51.100.42'];
    } catch {
      return ['#security', '#ddos', '198.51.100.42'];
    }
  });

  // Filtering, Searching, Sorting, and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState('timestamp'); // 'timestamp', 'priority', 'severity', 'event_type', 'gateway_id'
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set([101])); // expand first critical alert by default
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // View Modes: 'table' (Log Table), 'timeline' (Alert Timeline), 'structured' (Structured Raw Stream)
  const [viewMode, setViewMode] = useState('table');

  // Dismissed Priority Alerts for banner
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_log_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist alert data to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('iot_persistent_alerts_history', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [data]);

  // Persist recent searches
  useEffect(() => {
    try {
      localStorage.setItem('iot_recent_searches', JSON.stringify(recentSearches));
    } catch (e) {
      console.error(e);
    }
  }, [recentSearches]);

  // Persist dismissed alerts
  useEffect(() => {
    try {
      localStorage.setItem('dismissed_log_alerts', JSON.stringify(dismissedAlerts));
    } catch (e) {
      console.error(e);
    }
  }, [dismissedAlerts]);

  // Fetch alerts from backend API and combine with persistent store
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('http://localhost:5000/api/analytics/alerts?limit=100');
      const backendLogs = Array.isArray(res.data) ? res.data : [];

      if (backendLogs.length > 0) {
        // Map backend logs into enriched schema
        const mappedBackend = backendLogs.map((l) => ({
          id: l.id,
          severity: l.severity || 'INFO',
          priority: l.severity === 'CRITICAL' ? 'P1 - Urgent' : l.severity === 'WARNING' ? 'P2 - High' : 'P3 - Normal',
          category: l.category || (l.severity === 'CRITICAL' ? 'Security' : 'System'),
          event_type: l.event_type || (l.severity === 'CRITICAL' ? 'BREACH_ALERT' : 'TELEMETRY_LOG'),
          gateway_id: l.gateway_id || 1,
          device_id: l.device_id || `dev-node-${l.gateway_id || 1}`,
          tags: l.tags || ['#system', '#telemetry'],
          message: l.message,
          timestamp: l.timestamp || new Date().toISOString(),
          details: l.details || {
            source_gateway: l.gateway_id,
            raw_message: l.message,
            timestamp: l.timestamp
          }
        }));

        // Merge without duplicate IDs
        setData(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = mappedBackend.filter(m => !existingIds.has(m.id));
          return [...newItems, ...prev];
        });
      }
    } catch (e) {
      console.error('Backend alert fetch error:', e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save a search term to recent searches
  const handleSaveSearch = (query) => {
    if (!query || query.trim() === '') return;
    const trimmed = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 6);
    });
  };

  const applySearch = (query) => {
    setSearchTerm(query);
    handleSaveSearch(query);
    setCurrentPage(1);
  };

  // Expand / collapse single row
  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand / collapse all rows
  const toggleAllRows = () => {
    if (expandedRows.size === paginatedData.length) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(paginatedData.map(d => d.id)));
    }
  };

  // Copy to clipboard
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Purge / clear logs
  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to purge all system alert logs? This will clean persistent local and server records.')) return;
    try {
      await axios.post('http://localhost:5000/api/analytics/clear');
    } catch (e) {
      console.warn('Backend clear non-blocking', e);
    }
    setData([]);
    localStorage.removeItem('iot_persistent_alerts_history');
  };

  // Reset to seed defaults
  const handleRestoreDefaults = () => {
    setData(SEED_LOGS);
    localStorage.setItem('iot_persistent_alerts_history', JSON.stringify(SEED_LOGS));
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('No logs to export');
    const headers = ['ID', 'Priority', 'Severity', 'Category', 'EventType', 'GatewayID', 'DeviceID', 'Message', 'Timestamp'];
    const rows = filteredData.map(l => [
      l.id,
      `"${l.priority || 'P3'}"`,
      l.severity,
      l.category,
      l.event_type,
      l.gateway_id || 'N/A',
      l.device_id || 'N/A',
      `"${(l.message || '').replace(/"/g, '""')}"`,
      new Date(l.timestamp).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (filteredData.length === 0) return alert('No logs to export');
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `system_logs_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Event Simulator
  const handleSimulateLiveEvent = (type) => {
    let newEvent;
    const now = new Date().toISOString();
    const newId = Date.now();

    if (type === 'DDoS') {
      newEvent = {
        id: newId,
        severity: 'CRITICAL',
        priority: 'P1 - Urgent',
        category: 'Network',
        event_type: 'DDOS_FLOOD_SUSPECT',
        gateway_id: 1,
        device_id: 'edge-gw-01',
        tags: ['#ddos', '#live-sim', '#critical'],
        message: 'SIMULATED: Massive UDP flood detected on port 1883. Ingress packet rate spiked to 22,000 pkts/s.',
        timestamp: now,
        details: {
          vector: 'UDP Flood Ingress',
          rate_spike: '+520%',
          ports_targeted: [1883, 8883],
          source_ips: ['198.51.100.99', '198.51.100.100'],
          action_recommended: 'Activate edge rate limiters immediately.'
        }
      };
    } else if (type === 'Auth') {
      newEvent = {
        id: newId,
        severity: 'CRITICAL',
        priority: 'P1 - Urgent',
        category: 'Security',
        event_type: 'AUTH_BRUTE_FORCE',
        gateway_id: 2,
        device_id: 'auth-broker',
        tags: ['#auth-fail', '#brute-force', '#security'],
        message: 'SIMULATED: Automated credential stuffing detected against node broker accounts.',
        timestamp: now,
        details: {
          attempts: 25,
          time_window_sec: 15,
          failed_accounts: ['admin', 'supervisor', 'root'],
          action_recommended: 'Enforce MFA / IP block.'
        }
      };
    } else {
      newEvent = {
        id: newId,
        severity: 'WARNING',
        priority: 'P2 - High',
        category: 'System',
        event_type: 'BUFFER_SATURATION',
        gateway_id: 3,
        device_id: 'telemetry-buffer-03',
        tags: ['#buffer', '#memory', '#live-sim'],
        message: 'SIMULATED: Gateway buffer allocation crossed 90% threshold. Queued frames rising.',
        timestamp: now,
        details: {
          buffer_capacity_mb: 512,
          allocated_mb: 468,
          action_recommended: 'Drain telemetry queues to Cloud bucket.'
        }
      };
    }

    setData(prev => [newEvent, ...prev]);
    // also expand the newly simulated item
    setExpandedRows(prev => new Set([newEvent.id, ...prev]));
  };

  // Distinct Event Types list for dropdown filter
  const availableEventTypes = useMemo(() => {
    const set = new Set(data.map(d => d.event_type).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [data]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        (item.message || '').toLowerCase().includes(search) ||
        (item.severity || '').toLowerCase().includes(search) ||
        (item.category || '').toLowerCase().includes(search) ||
        (item.event_type || '').toLowerCase().includes(search) ||
        (item.priority || '').toLowerCase().includes(search) ||
        (item.device_id || '').toLowerCase().includes(search) ||
        (item.tags || []).some(t => t.toLowerCase().includes(search)) ||
        String(item.gateway_id || '').includes(search) ||
        JSON.stringify(item.details || {}).toLowerCase().includes(search);

      const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesEventType = eventTypeFilter === 'ALL' || item.event_type === eventTypeFilter;

      return matchesSearch && matchesSeverity && matchesCategory && matchesEventType;
    });
  }, [data, searchTerm, severityFilter, categoryFilter, eventTypeFilter]);

  // Priority scoring helper for sorting
  const getPriorityWeight = (item) => {
    if (item.severity === 'CRITICAL' || item.priority?.includes('P1')) return 4;
    if (item.severity === 'WARNING' || item.priority?.includes('P2')) return 3;
    if (item.severity === 'INFO' || item.priority?.includes('P3')) return 2;
    return 1; // DEBUG / P4
  };

  // Sorting Logic
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField === 'priority') {
        const weightA = getPriorityWeight(a);
        const weightB = getPriorityWeight(b);
        return sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
      }

      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Active Unresolved Critical Alerts for Real-time Alerting Banner
  const activeCriticalAlerts = data.filter(d => 
    d.severity === 'CRITICAL' && !dismissedAlerts.includes(d.id)
  );

  return (
    <div className="space-y-6 font-outfit pb-16">
      {/* 1. Module Header & Action Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-600">
            <History size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">View Centralized Logs and Alerts</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                Module 8
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured event classification, expandable payload rows, severity prioritization, and persistent alert storage
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Tabs: Table, Timeline, Structured Stream */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-purple-700 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>Log Table</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline' ? 'bg-white text-purple-700 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Clock size={13} />
              <span>Alert Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('structured')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'structured' ? 'bg-white text-purple-700 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Terminal size={13} />
              <span>Structured Stream</span>
            </button>
          </div>

          {/* Simulate Live Event Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
              <Zap size={14} className="animate-pulse" />
              <span>Simulate Event</span>
              <ChevronDown size={12} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#0a0c1a] border border-slate-800 text-slate-200 rounded-2xl p-2 w-52 shadow-2xl z-30 space-y-1">
              <button
                onClick={() => handleSimulateLiveEvent('DDoS')}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <AlertOctagon size={14} className="text-red-500" />
                <span>Simulate DDoS Surge (P1)</span>
              </button>
              <button
                onClick={() => handleSimulateLiveEvent('Auth')}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <ShieldAlert size={14} className="text-red-500" />
                <span>Simulate Brute Force (P1)</span>
              </button>
              <button
                onClick={() => handleSimulateLiveEvent('Buffer')}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 hover:text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <AlertTriangle size={14} className="text-amber-500" />
                <span>Simulate Buffer Saturation (P2)</span>
              </button>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all disabled:opacity-50"
            title="Poll latest events"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Export CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Export JSON"
          >
            <FileJson size={13} />
            <span>JSON</span>
          </button>

          {/* Admin Purge & Restore */}
          <button
            onClick={handleClear}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all shadow-sm"
            title="Purge logs"
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={handleRestoreDefaults}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[11px] font-bold"
            title="Restore seed logs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. Severity-Based Real-time Alerting Banner */}
      <AnimatePresence>
        {activeCriticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-5 text-red-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-red-500/5 ring-2 ring-red-500/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-900/30 animate-pulse">
                <AlertOctagon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                    PRIORITY 1 CRITICAL ALERT
                  </span>
                  <span className="text-xs font-bold text-red-900">
                    {activeCriticalAlerts.length} Active Security Incident{activeCriticalAlerts.length > 1 ? 's' : ''} Requiring Investigation
                  </span>
                </div>
                <h4 className="text-sm font-black text-red-950 mt-1">
                  {activeCriticalAlerts[0]?.message}
                </h4>
                <p className="text-[11px] text-red-800/80 mt-0.5 font-mono">
                  Affected Node: GW-#{activeCriticalAlerts[0]?.gateway_id} • Device: {activeCriticalAlerts[0]?.device_id} • Time: {new Date(activeCriticalAlerts[0]?.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setSearchTerm(activeCriticalAlerts[0]?.event_type || '');
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold rounded-xl transition-all"
              >
                Inspect Event
              </button>
              <button
                onClick={() => setDismissedAlerts(prev => [...prev, ...activeCriticalAlerts.map(a => a.id)])}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-900/20 whitespace-nowrap"
              >
                Acknowledge All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Search, Severity Filters, Classification & Recent Searches */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search Bar + Severity Pills + Sort Dropdown */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Real-time search with clear button */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search across payload, IP, event tags, or gateway..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSearch(searchTerm);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-medium text-slate-800 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Severity-Based Level Filter Pills */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1">
              <Filter size={12} /> Severity:
            </span>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO', 'DEBUG'].map((sev) => {
              const active = severityFilter === sev;
              const count = sev === 'ALL' ? data.length : data.filter(d => d.severity === sev).length;

              return (
                <button
                  key={sev}
                  onClick={() => {
                    setSeverityFilter(sev);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active 
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/20' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{sev}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono ${
                    active ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Controller */}
          <div className="flex items-center gap-2 self-end lg:self-auto text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <select
              value={sortField}
              onChange={(e) => handleSort(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="timestamp">Timestamp ({sortOrder.toUpperCase()})</option>
              <option value="priority">Alert Priority (P1 → P4)</option>
              <option value="severity">Severity Level</option>
              <option value="event_type">Event Type (A-Z)</option>
              <option value="gateway_id">Gateway ID</option>
            </select>
          </div>
        </div>

        {/* Event Classification Categories & Event Type Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">
              Category:
            </span>
            {['ALL', 'Security', 'Network', 'System', 'Provisioning', 'Cloud Sync', 'Heartbeat'].map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    active 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Event Type:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[180px] truncate"
            >
              {availableEventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recent Search Queries Bar (Search History) & Tagging system */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Clock size={11} /> Recent Searches:
            </span>
            {recentSearches.map((q, idx) => (
              <button
                key={idx}
                onClick={() => applySearch(q)}
                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-mono font-bold transition-all border border-purple-200"
              >
                {q}
              </button>
            ))}
            {recentSearches.length > 0 && (
              <button
                onClick={() => setRecentSearches([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 ml-1 underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleAllRows}
              className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <ChevronsUpDown size={14} />
              <span>{expandedRows.size === paginatedData.length ? 'Collapse All' : 'Expand All'}</span>
            </button>

            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-[11px] font-medium">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main View Display: Log Table OR Alert Timeline OR Structured Stream */}
      {viewMode === 'table' ? (
        /* Log Table with Filters & Expandable Rows */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 italic">Reading cryptographic event stream...</div>
          ) : paginatedData.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <ShieldAlert size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No log entries matched your filter parameters.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting search terms or clicking a category filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0a0c1a] text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="w-10 px-4 py-4"></th>
                    <th 
                      onClick={() => handleSort('timestamp')}
                      className="px-4 py-4 font-black uppercase tracking-wider text-[10px] cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Timestamp</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('priority')}
                      className="px-4 py-4 font-black uppercase tracking-wider text-[10px] cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Severity / Priority</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px]">Classification</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px]">Gateway & Node</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px]">Payload Message & Tags</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((log) => {
                    const isExpanded = expandedRows.has(log.id);
                    const isCrit = log.severity === 'CRITICAL';
                    const isWarn = log.severity === 'WARNING';
                    const isDebug = log.severity === 'DEBUG';

                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => toggleRow(log.id)}
                          className={`hover:bg-purple-50/20 transition-colors cursor-pointer group ${
                            isExpanded ? 'bg-purple-50/30' : ''
                          } ${isCrit ? 'bg-red-500/5' : ''}`}
                        >
                          <td className="px-4 py-3.5 text-center text-slate-400">
                            {isExpanded ? (
                              <ChevronDown size={15} className="text-purple-600" />
                            ) : (
                              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                            <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit ${
                                isCrit 
                                  ? 'bg-red-50 text-red-600 border border-red-200 ring-2 ring-red-400/20' 
                                  : isWarn
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : isDebug
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                              }`}>
                                {isCrit ? <AlertOctagon size={11} /> : isWarn ? <AlertTriangle size={11} /> : isDebug ? <Terminal size={11} /> : <Info size={11} />}
                                {log.severity}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 font-bold">
                                {log.priority || (isCrit ? 'P1 - Urgent' : isWarn ? 'P2 - High' : 'P3 - Normal')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                                {log.category || 'General'}
                              </span>
                              <div className="text-[10px] font-mono text-purple-600 font-bold truncate max-w-[120px]">
                                {log.event_type}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              GW-#{log.gateway_id || 1}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[110px]">
                              {log.device_id || 'core-sensor'}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 font-medium max-w-md">
                            <p className="line-clamp-2 leading-relaxed text-xs">{log.message}</p>
                            {/* Clickable Tagging System */}
                            {log.tags && log.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {log.tags.map((t, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applySearch(t);
                                    }}
                                    className="text-[9px] font-mono text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors"
                                    title={`Filter by tag ${t}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(log.details || log.message, log.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                              title="Copy log details"
                            >
                              {copiedId === log.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Log Rows: Detailed Info & Nested Data View */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={7} className="px-8 py-5">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#0a0c1a] text-slate-300 rounded-3xl p-6 border border-slate-800 space-y-4 font-mono text-xs shadow-2xl"
                              >
                                {/* Nested Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Terminal size={16} className="text-purple-400" />
                                    <span className="text-white font-bold">Nested Telemetry Payload & Diagnostic Trace</span>
                                    <span className="text-[10px] text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                      ID: #{log.id}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleCopy(log.details || log, `nested-${log.id}`)}
                                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold font-sans flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      {copiedId === `nested-${log.id}` ? <Check size={12} /> : <Copy size={12} />}
                                      <span>{copiedId === `nested-${log.id}` ? 'Copied JSON' : 'Copy JSON'}</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Key Diagnostic Attributes Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Event Signature</span>
                                    <span className="text-purple-300 font-bold">{log.event_type}</span>
                                  </div>
                                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Target Device ID</span>
                                    <span className="text-emerald-400 font-bold">{log.device_id}</span>
                                  </div>
                                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Severity Priority</span>
                                    <span className={`font-bold ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-blue-400'}`}>
                                      {log.priority || log.severity}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Ingress Timestamp</span>
                                    <span className="text-slate-300">{new Date(log.timestamp).toISOString()}</span>
                                  </div>
                                </div>

                                {/* Decoded Structured JSON View */}
                                <div>
                                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1.5">
                                    <span>Decoded Ingress Parameters (Structured JSON):</span>
                                    <span className="text-slate-600">RFC 5424 Structured Log Standard</span>
                                  </div>
                                  <pre className="p-4 bg-black/60 rounded-2xl text-emerald-400 overflow-x-auto text-[11px] leading-relaxed border border-slate-800/80 custom-scrollbar font-mono">
                                    {JSON.stringify(log.details || { message: log.message, gateway: log.gateway_id }, null, 2)}
                                  </pre>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{Math.min(sortedData.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
              <strong className="text-slate-800">{Math.min(sortedData.length, currentPage * pageSize)}</strong> of{' '}
              <strong className="text-slate-800">{sortedData.length}</strong> event entries
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1 font-mono text-xs">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`h-7 w-7 rounded-lg font-bold transition-all ${
                      currentPage === idx + 1 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Feature 5: Alert Timeline & History Storage */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-purple-600" />
                Alert Timeline & Historical Activity Storage
              </h3>
              <p className="text-xs text-slate-500">
                Persistent event chronological sequence stored in local ledger (Total records: {data.length})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                Persistent Storage: Active (LocalStorage)
              </span>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {sortedData.map((log) => {
              const isCrit = log.severity === 'CRITICAL';
              const isWarn = log.severity === 'WARNING';

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline bullet beacon */}
                  <div className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                    isCrit ? 'bg-red-500 animate-ping' : isWarn ? 'bg-amber-500' : 'bg-purple-600'
                  }`} />
                  <div className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-purple-600'
                  }`} />

                  <div className="bg-slate-50 hover:bg-purple-50/40 p-4 rounded-2xl border border-slate-100 transition-all space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isCrit ? 'bg-red-100 text-red-700' : isWarn ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {log.priority || log.severity}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{log.event_type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">GW-#{log.gateway_id}</span>
                        <span className="text-[10px] text-purple-600 font-mono bg-purple-50 px-1.5 rounded">
                          {log.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {log.message}
                    </p>

                    {log.details && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-xl border border-slate-200/60 truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Feature 3: Structured Logging Stream View */
        <div className="bg-[#0a0c1a] text-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Live Structured Logging Stream</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Raw NDJSON format with event classification tags and key-value mapping
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopy(filteredData, 'structured-all')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 font-sans"
            >
              <Copy size={13} />
              <span>{copiedId === 'structured-all' ? 'Copied Full Stream' : 'Copy All Stream'}</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {filteredData.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-black/60 rounded-xl border border-slate-800/80 text-[11px] leading-relaxed hover:border-purple-500/40 transition-colors"
              >
                <span className="text-slate-500">[{new Date(log.timestamp).toISOString()}]</span>{' '}
                <span className={`font-bold ${
                  log.severity === 'CRITICAL' ? 'text-red-400' : log.severity === 'WARNING' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  [{log.severity}]
                </span>{' '}
                <span className="text-purple-400 font-bold">[{log.category}]</span>{' '}
                <span className="text-emerald-400 font-bold">[{log.event_type}]</span>{' '}
                <span className="text-slate-300">{log.message}</span>{' '}
                <span className="text-slate-500 font-mono">attributes={JSON.stringify(log.details || {})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
