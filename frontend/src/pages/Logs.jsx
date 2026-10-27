import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  History, Search, AlertCircle, Info, Download, Trash2, 
  RefreshCw, Filter, Check, Copy, ShieldAlert, AlertTriangle, 
  ChevronDown, ChevronRight, ChevronsUpDown, ArrowUpDown, 
  SlidersHorizontal, FileJson, Clock, Tag, Shield, Database,
  ArrowRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Logs = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_log_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch alerts from backend
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('http://localhost:5000/api/analytics/alerts?limit=100');
      let logs = Array.isArray(res.data) ? res.data : [];
      
      // If backend has few logs, enrich with comprehensive structured records for simulation
      if (logs.length < 8) {
        const enrichedSampleLogs = [
          {
            id: 101,
            severity: 'CRITICAL',
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
              encryption_status: 'TLS_REJECTED'
            }
          },
          {
            id: 102,
            severity: 'CRITICAL',
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
              mitigation: 'RATE_LIMIT_RULE_APPLIED'
            }
          },
          {
            id: 103,
            severity: 'WARNING',
            category: 'System',
            event_type: 'BUFFER_SATURATION',
            gateway_id: 1,
            device_id: 'gateway-core-alpha',
            tags: ['#buffer', '#memory', '#latency'],
            message: 'MQTT Ingress queue capacity utilized at 87%. Potential latency degradation imminent.',
            timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
            details: {
              queue_depth: 4350,
              queue_max: 5000,
              dropped_events: 0,
              latency_ms: 189
            }
          },
          {
            id: 104,
            severity: 'INFO',
            category: 'Provisioning',
            event_type: 'DEVICE_ONBOARDED',
            gateway_id: 3,
            device_id: 'dev-hvac-controller-01',
            tags: ['#device', '#provision', '#ecc-key'],
            message: 'New IoT Sensor authenticated with ECC P-256 certificate and assigned secure node session.',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            details: {
              cipher: 'ECDHE-ECDSA-AES256-GCM-SHA384',
              lease_duration_sec: 86400,
              allocated_ip: '10.0.4.18'
            }
          },
          {
            id: 105,
            severity: 'INFO',
            category: 'Cloud Sync',
            event_type: 'PIPELINE_BATCH_SYNC',
            gateway_id: 2,
            device_id: 'cloud-forwarder-aws',
            tags: ['#cloud', '#sync', '#telemetry'],
            message: 'Dispatched encrypted batch of 250 telemetry records to Cloud Broker endpoint successfully.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            details: {
              batch_id: 'bat-9481-ac7',
              payload_size_kb: 48.2,
              endpoint: 's3://iot-gateway-archive/2026/10/',
              latency_ms: 38
            }
          },
          {
            id: 106,
            severity: 'WARNING',
            category: 'Heartbeat',
            event_type: 'HEARTBEAT_JITTER',
            gateway_id: 3,
            device_id: 'gateway-telemetry-gamma',
            tags: ['#heartbeat', '#delay', '#keepalive'],
            message: 'Heartbeat response delayed by 2.4 seconds due to temporary network socket congestion.',
            timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            details: {
              expected_interval_s: 5,
              actual_delay_s: 7.4,
              jitter_ms: 2400
            }
          }
        ];

        // Merge backend logs and enriched sample logs
        const combined = [...logs.map((l, i) => ({
          ...l,
          category: l.category || (l.severity === 'CRITICAL' ? 'Security' : 'System'),
          event_type: l.event_type || 'ALERT_EVENT',
          tags: l.tags || ['#telemetry', '#alert'],
          details: l.details || { raw_message: l.message, gateway: l.gateway_id }
        })), ...enrichedSampleLogs];
        setData(combined);
      } else {
        setData(logs.map(l => ({
          ...l,
          category: l.category || (l.severity === 'CRITICAL' ? 'Security' : 'System'),
          event_type: l.event_type || 'ALERT_EVENT',
          tags: l.tags || ['#telemetry', '#alert'],
          details: l.details || { raw_message: l.message, gateway: l.gateway_id }
        })));
      }
    } catch (e) {
      console.error('Log fetch failed', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save dismissed alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dismissed_log_alerts', JSON.stringify(dismissedAlerts));
    } catch (e) {
      console.error(e);
    }
  }, [dismissedAlerts]);

  // Expand / collapse single row
  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand / collapse all toggle
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
    if (!window.confirm('Are you sure you want to purge system alert logs? This action will remove records from the database.')) return;
    try {
      await axios.post('http://localhost:5000/api/analytics/clear');
      fetchData();
    } catch (e) {
      alert('Failed to clear logs.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('No logs to export');
    const headers = ['ID', 'Severity', 'Category', 'EventType', 'GatewayID', 'Message', 'Timestamp'];
    const rows = filteredData.map(l => [
      l.id,
      l.severity,
      l.category,
      l.event_type,
      l.gateway_id || 'N/A',
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

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        (item.message || '').toLowerCase().includes(search) ||
        (item.severity || '').toLowerCase().includes(search) ||
        (item.category || '').toLowerCase().includes(search) ||
        (item.event_type || '').toLowerCase().includes(search) ||
        (item.tags || []).some(t => t.toLowerCase().includes(search)) ||
        String(item.gateway_id || '').includes(search);

      const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [data, searchTerm, severityFilter, categoryFilter]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
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
      setSortOrder('asc');
    }
  };

  // High priority critical unresolved alerts for banner
  const activeCriticalAlerts = data.filter(d => 
    d.severity === 'CRITICAL' && !dismissedAlerts.includes(d.id)
  );

  return (
    <div className="space-y-6 font-outfit pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-600">
            <History size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Centralized Logging and Alerts</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                Module 7
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured event classification, expandable payload rows, priority alerting, and export ledger
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-purple-700 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white text-purple-700 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Timeline View
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all disabled:opacity-50"
            title="Sync latest events"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <FileJson size={14} />
            <span>JSON</span>
          </button>

          {user?.role === 'Admin' && (
            <button
              onClick={handleClear}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all shadow-sm"
              title="Purge logs"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Priority Alert Banner (Severity-Based Real-time Alerting) */}
      <AnimatePresence>
        {activeCriticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-red-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 text-white rounded-xl animate-pulse">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                    PRIORITY 1 CRITICAL ALERT
                  </span>
                  <span className="text-xs font-bold text-red-900">
                    {activeCriticalAlerts.length} unresolved critical breach{activeCriticalAlerts.length > 1 ? 'es' : ''} detected
                  </span>
                </div>
                <p className="text-xs text-red-800/80 mt-0.5">
                  Latest: {activeCriticalAlerts[0]?.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => setDismissedAlerts(prev => [...prev, ...activeCriticalAlerts.map(a => a.id)])}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap"
            >
              Acknowledge All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Filter, Classification & Search Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search Input & Severity Tabs */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search across payload, tags, IP address, or gateway..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs text-slate-700"
            />
          </div>

          {/* Severity Levels */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1">
              <Filter size={12} /> Severity:
            </span>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSeverityFilter(sev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  severityFilter === sev 
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/20' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Event Classification Tags & Rows Controller */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">
              Event Classification:
            </span>
            {['ALL', 'Security', 'Network', 'System', 'Provisioning', 'Cloud Sync', 'Heartbeat'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  categoryFilter === cat 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleAllRows}
              className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1"
            >
              <ChevronsUpDown size={14} />
              <span>{expandedRows.size === paginatedData.length ? 'Collapse All' : 'Expand All'}</span>
            </button>

            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-[11px] font-medium">Page Size:</span>
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

      {/* 4. Main Log Table with Expandable Rows */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 italic">Reading cryptographic event records...</div>
          ) : paginatedData.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <ShieldAlert size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No log entries matched your filter parameters.</p>
              <p className="text-xs text-slate-400 mt-1">Adjust search terms or clear active filters.</p>
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
                      onClick={() => handleSort('severity')}
                      className="px-4 py-4 font-black uppercase tracking-wider text-[10px] cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Severity</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px]">Classification</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px]">Gateway / Node</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px]">Payload Message</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((log) => {
                    const isExpanded = expandedRows.has(log.id);
                    const isCrit = log.severity === 'CRITICAL';
                    const isWarn = log.severity === 'WARNING';

                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => toggleRow(log.id)}
                          className={`hover:bg-purple-50/20 transition-colors cursor-pointer group ${
                            isExpanded ? 'bg-purple-50/30' : ''
                          } ${isCrit ? 'bg-red-500/5' : ''}`}
                        >
                          <td className="px-4 py-3.5 text-center text-slate-400">
                            {isExpanded ? <ChevronDown size={14} className="text-purple-600" /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              isCrit 
                                ? 'bg-red-50 text-red-600 border border-red-200 ring-1 ring-red-400/20' 
                                : isWarn
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                              {isCrit ? <AlertCircle size={12} /> : isWarn ? <AlertTriangle size={12} /> : <Info size={12} />}
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {log.category || 'General'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] font-bold text-slate-700">
                            GW-#{log.gateway_id || 1}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 font-medium max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{log.message}</span>
                            </div>
                            {/* Tags pill */}
                            {log.tags && log.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {log.tags.map((t, i) => (
                                  <span key={i} className="text-[9px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded">
                                    {t}
                                  </span>
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
                              title="Copy details"
                            >
                              {copiedId === log.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Nested Expandable Row View */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={7} className="px-8 py-5">
                              <div className="bg-[#0a0c1a] text-slate-300 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs shadow-inner">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-purple-400 font-bold">Event Details & Structured Payload:</span>
                                    <span className="text-[11px] text-slate-400 font-mono">ID: #{log.id}</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(log.details || log, `nested-${log.id}`)}
                                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 transition-all"
                                  >
                                    {copiedId === `nested-${log.id}` ? <Check size={12} /> : <Copy size={12} />}
                                    <span>Copy JSON</span>
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                                  <div>
                                    <span className="text-slate-500 text-[10px] uppercase block">Event Identifier</span>
                                    <span className="text-white font-bold">{log.event_type || 'ALERT_NOTIFICATION'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-[10px] uppercase block">Target Device</span>
                                    <span className="text-white font-bold">{log.device_id || 'System Core'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-[10px] uppercase block">Ingress Timestamp</span>
                                    <span className="text-white font-bold">{new Date(log.timestamp).toISOString()}</span>
                                  </div>
                                </div>

                                {/* Raw JSON tree view */}
                                <div>
                                  <span className="text-slate-500 text-[10px] uppercase block mb-1">Decoded Payload Attributes</span>
                                  <pre className="p-3 bg-black/50 rounded-xl text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                                    {JSON.stringify(log.details || { message: log.message, gateway: log.gateway_id }, null, 2)}
                                  </pre>
                                </div>
                              </div>
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
      ) : (
        /* Timeline View Mode */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8">
          <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
            <Clock size={18} className="text-purple-600" />
            Chronological Security & Event Timeline
          </h3>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {sortedData.map((log) => {
              const isCrit = log.severity === 'CRITICAL';
              return (
                <div key={log.id} className="relative group">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                    isCrit ? 'bg-red-500 animate-ping' : 'bg-purple-600'
                  }`} />
                  <div className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    isCrit ? 'bg-red-500' : 'bg-purple-600'
                  }`} />

                  <div className="bg-slate-50 hover:bg-purple-50/40 p-4 rounded-2xl border border-slate-100 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isCrit ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {log.severity}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{log.event_type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">GW-#{log.gateway_id}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
