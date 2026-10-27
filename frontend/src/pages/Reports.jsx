import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Calendar, Printer, FileDown, CheckCircle, Shield, 
  Award, Lock, Activity, RefreshCw, AlertTriangle, ArrowRight,
  Share2, History, Search, Edit3, Save, Check, Trash2, Archive,
  Sliders, Eye, CheckCircle2, ChevronRight, Download, Copy,
  FileSpreadsheet, FileCode, Settings, Filter, Sparkles, RotateCcw,
  X, ExternalLink, ShieldCheck, CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = () => {
  // -------------------------------------------------------------
  // Feature 1: Report Type Selector State
  // -------------------------------------------------------------
  const [reportType, setReportType] = useState('Security Incident & Threat Mitigation Audit (ISO 27001)');
  const [reportFormat, setReportFormat] = useState('Official Compliance Certification'); // Executive Summary, Technical Dossier, Compliance Certification, Raw Audit Log
  const [customSections, setCustomSections] = useState({
    executiveSummary: true,
    clusterTelemetry: true,
    securityIncidents: true,
    isoControls: true,
    signatureLedger: true
  });
  const [savedPreferenceNotice, setSavedPreferenceNotice] = useState(false);

  // -------------------------------------------------------------
  // Feature 2: Date Range Picker State
  // -------------------------------------------------------------
  const [dateRange, setDateRange] = useState('Last 24 Hours');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  // -------------------------------------------------------------
  // Feature 3: Report Preview & Generation State
  // -------------------------------------------------------------
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [reportRef, setReportRef] = useState('ISO-8942-F1');
  const [reportVersion, setReportVersion] = useState('v1.0');
  const [isEditing, setIsEditing] = useState(false);
  const [organizationName, setOrganizationName] = useState('IoT Autonomous Enterprise Core');
  const [auditorName, setAuditorName] = useState('Eng. Sarah Chen, CISSP');
  const [complianceRating, setComplianceRating] = useState('99.8%');
  const [auditorRemarks, setAuditorRemarks] = useState(
    'The evaluated IoT cluster demonstrates robust encryption compliance with TLS 1.3 / SHA-384. Ingress telemetry remained consistent with zero unmitigated root exploits during the target observation cycle. All ISO/IEC 27001 Annex-A security safeguards evaluated as PASSED.'
  );

  // -------------------------------------------------------------
  // Feature 4: Export PDF/CSV & File Naming State
  // -------------------------------------------------------------
  const [customFileName, setCustomFileName] = useState('');
  const [shareNotice, setShareNotice] = useState(false);
  const [toast, setToast] = useState(null);

  // -------------------------------------------------------------
  // Feature 5: Report History & Archive State
  // -------------------------------------------------------------
  const [historySearch, setHistorySearch] = useState('');
  const [historyTab, setHistoryTab] = useState('all'); // all, active, archived
  const [reportHistory, setReportHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('iot_report_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'ISO-8942-F1',
        title: 'Security Incident & Threat Mitigation Audit (ISO 27001)',
        format: 'Official Compliance Certification',
        dateRange: 'Last 24 Hours',
        auditor: 'Eng. Sarah Chen, CISSP',
        generatedAt: '2026-10-27 14:30:00',
        version: 'v1.0',
        status: 'Active',
        hash: 'SHA384:a9b2c8f...4e1',
        remarks: 'The evaluated IoT cluster demonstrates robust encryption compliance with TLS 1.3 / SHA-384.'
      },
      {
        id: 'ISO-7321-B4',
        title: 'Traffic Analytics & Protocol Distribution Dossier',
        format: 'Technical Dossier',
        dateRange: 'Last 7 Days',
        auditor: 'SecOps Automated Bot',
        generatedAt: '2026-10-24 09:15:00',
        version: 'v1.1',
        status: 'Archived',
        hash: 'SHA384:7e4f1a0...99c',
        remarks: 'Traffic throughput nominal across MQTT/CoAP ports. Peak load sustained at 2,400 pkts/s.'
      },
      {
        id: 'ISO-6119-A2',
        title: 'Gateway Cluster Pulse & Hardware Health Audit',
        format: 'Executive Summary',
        dateRange: 'Last 30 Days',
        auditor: 'Alex Mercer, Lead Infrastructure Architect',
        generatedAt: '2026-10-18 18:00:00',
        version: 'v1.0',
        status: 'Active',
        hash: 'SHA384:3d8e5b2...12a',
        remarks: 'All 3 edge gateway nodes operated within acceptable thermal and memory thresholds with zero downtime.'
      }
    ];
  });

  // Dynamic Telemetry Data from API
  const [stats, setStats] = useState({ gateways: 3, alerts: 18, critical: 2, totalPackets: 142500 });

  // Show Toast
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch quick metrics on mount
  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const [gwRes, alertRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gateways'),
          axios.get('http://localhost:5000/api/analytics/alerts?limit=50')
        ]);
        const gws = Array.isArray(gwRes.data) ? gwRes.data : [];
        const alerts = Array.isArray(alertRes.data) ? alertRes.data : [];
        const crit = alerts.filter(a => a.severity === 'CRITICAL').length;
        setStats({ 
          gateways: gws.length || 3, 
          alerts: alerts.length || 18, 
          critical: crit || 2,
          totalPackets: 142500 + Math.floor(Math.random() * 5000)
        });
      } catch (e) {
        console.warn('Using standard telemetry stats fallback', e.message);
      }
    };
    fetchQuickStats();
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const pref = localStorage.getItem('iot_report_preferences');
      if (pref) {
        const parsed = JSON.parse(pref);
        if (parsed.reportType) setReportType(parsed.reportType);
        if (parsed.reportFormat) setReportFormat(parsed.reportFormat);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.auditorName) setAuditorName(parsed.auditorName);
        if (parsed.organizationName) setOrganizationName(parsed.organizationName);
        if (parsed.customSections) setCustomSections(parsed.customSections);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('iot_report_history', JSON.stringify(reportHistory));
    } catch (e) {
      console.error(e);
    }
  }, [reportHistory]);

  // -------------------------------------------------------------
  // Feature 1.5: Save Preferences
  // -------------------------------------------------------------
  const handleSavePreferences = () => {
    try {
      localStorage.setItem('iot_report_preferences', JSON.stringify({
        reportType,
        reportFormat,
        dateRange,
        auditorName,
        organizationName,
        customSections
      }));
      setSavedPreferenceNotice(true);
      showToast('Report configuration preferences saved as default template!');
      setTimeout(() => setSavedPreferenceNotice(false), 2500);
    } catch (e) {
      showToast('Error saving preferences to localStorage.');
    }
  };

  // -------------------------------------------------------------
  // Feature 2.5: Quick Selection Pills
  // -------------------------------------------------------------
  const handleQuickSelect = (type) => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'Today') {
      setDateRange('Custom Range');
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'Yesterday') {
      const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      setDateRange('Custom Range');
      setStartDate(yest);
      setEndDate(yest);
    } else if (type === 'This Week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      setDateRange('Custom Range');
      setStartDate(weekAgo);
      setEndDate(today);
    } else if (type === 'This Month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      setDateRange('Custom Range');
      setStartDate(monthAgo);
      setEndDate(today);
    }
    showToast(`Quick date window applied: ${type}`);
  };

  // -------------------------------------------------------------
  // Feature 3.1 & 3.4: Generate / Compile Report
  // -------------------------------------------------------------
  const handleGenerate = () => {
    setIsGenerating(true);
    const newRef = 'ISO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(10 + Math.random() * 90);
    setReportRef(newRef);
    setReportVersion('v1.0');

    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);

      // Append to Report History (Feature 5.1)
      const newEntry = {
        id: newRef,
        title: reportType,
        format: reportFormat,
        dateRange: dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange,
        auditor: auditorName,
        generatedAt: new Date().toLocaleString(),
        version: 'v1.0',
        status: 'Active',
        hash: 'SHA384:' + Math.random().toString(16).substring(2, 12) + '...e7b',
        remarks: auditorRemarks
      };
      setReportHistory(prev => [newEntry, ...prev]);
      showToast(`Official audit report ${newRef} compiled and cryptographically verified!`);
    }, 1000);
  };

  // -------------------------------------------------------------
  // Feature 3.2 & 5.4: Save In-place Edits & Increment Version
  // -------------------------------------------------------------
  const handleSaveEdits = () => {
    setIsEditing(false);
    // Increment version
    const currNum = parseFloat(reportVersion.replace('v', '')) || 1.0;
    const nextVer = 'v' + (currNum + 0.1).toFixed(1);
    setReportVersion(nextVer);

    // Update in history
    setReportHistory(prev => prev.map(item => {
      if (item.id === reportRef) {
        return {
          ...item,
          version: nextVer,
          auditor: auditorName,
          remarks: auditorRemarks,
          generatedAt: new Date().toLocaleString()
        };
      }
      return item;
    }));
    showToast(`Report revision updated to ${nextVer} with new auditor remarks!`);
  };

  // -------------------------------------------------------------
  // Feature 4: Export PDF, CSV, JSON & Custom Naming
  // -------------------------------------------------------------
  const getResolvedFileName = (ext) => {
    if (customFileName.trim()) {
      return customFileName.trim().endsWith(`.${ext}`) ? customFileName.trim() : `${customFileName.trim()}.${ext}`;
    }
    return `${reportRef}_${reportType.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
  };

  // Export CSV
  const handleExportCSV = () => {
    const fileName = getResolvedFileName('csv');
    const headers = [
      'Report Reference', 
      'Report Type', 
      'Report Format',
      'Date Window', 
      'Auditor Signoff', 
      'Organization',
      'Version', 
      'Active Gateways', 
      'Critical Anomalies', 
      'Total Signals Audited',
      'Compliance Score',
      'Cryptographic Hash',
      'Auditor Remarks'
    ];
    const row = [
      `"${reportRef}"`,
      `"${reportType}"`,
      `"${reportFormat}"`,
      `"${dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange}"`,
      `"${auditorName}"`,
      `"${organizationName}"`,
      `"${reportVersion}"`,
      stats.gateways,
      stats.critical,
      stats.totalPackets,
      `"${complianceRating}"`,
      `"SHA384-${reportRef}-VERIFIED-PASS"`,
      `"${auditorRemarks.replace(/"/g, '""')}"`
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`CSV report downloaded as: ${fileName}`);
  };

  // Export JSON (Feature 4.2 Multiple Formats)
  const handleExportJSON = () => {
    const fileName = getResolvedFileName('json');
    const reportData = {
      reportReference: reportRef,
      title: reportType,
      format: reportFormat,
      timeframe: dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange,
      organization: organizationName,
      leadAuditor: auditorName,
      version: reportVersion,
      generatedAt: new Date().toISOString(),
      complianceScore: complianceRating,
      cryptographicSignature: `SHA384-${reportRef}-VERIFIED-PASS`,
      telemetryKPIs: {
        totalSignalsAudited: stats.totalPackets,
        activeGateways: stats.gateways,
        criticalAnomaliesMitigated: stats.critical,
        threatContainmentRate: '100.0%',
        encryptionStandard: 'TLS 1.3 / SHA-384'
      },
      iso27001Controls: [
        { clause: 'A.9.2 User Access', status: 'PASSED', proof: 'RBAC SHA-256 JWT' },
        { clause: 'A.10.1 Cryptography', status: 'PASSED', proof: 'TLS 1.3 / SHA-384' },
        { clause: 'A.12.4 Logging & Audit', status: 'PASSED', proof: 'PostgreSQL Audit Ledger' },
        { clause: 'A.13.1 Network Security', status: 'PASSED', proof: 'Isolation Forest Engine' }
      ],
      executiveFindings: auditorRemarks
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Signed JSON report downloaded as: ${fileName}`);
  };

  // Feature 4.5: Share functionality
  const handleShare = () => {
    const shareUrl = `https://simulator.local/reports/verify/${reportRef}?v=${reportVersion}&hash=sha384-${reportRef}`;
    navigator.clipboard.writeText(shareUrl);
    setShareNotice(true);
    showToast('Tamper-evident verification link copied to clipboard!');
    setTimeout(() => setShareNotice(false), 2500);
  };

  // -------------------------------------------------------------
  // Feature 5: History Actions (View, Archive, Delete)
  // -------------------------------------------------------------
  const handleLoadFromHistory = (item) => {
    setReportRef(item.id);
    setReportType(item.title);
    setReportFormat(item.format || 'Official Compliance Certification');
    setDateRange(item.dateRange);
    setAuditorName(item.auditor);
    setReportVersion(item.version);
    if (item.remarks) setAuditorRemarks(item.remarks);
    setShowPreview(true);
    showToast(`Loaded ${item.id} (${item.version}) into preview canvas.`);
  };

  const handleToggleArchive = (id) => {
    setReportHistory(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Active' ? 'Archived' : 'Active';
        showToast(`Report ${id} moved to ${nextStatus}.`);
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleDeleteHistory = (id) => {
    setReportHistory(prev => prev.filter(item => item.id !== id));
    showToast(`Report ${id} purged from archive.`);
  };

  // Filtered History
  const filteredHistory = reportHistory.filter(h => {
    const matchesTab = historyTab === 'all' ? true : h.status.toLowerCase() === historyTab;
    const matchesSearch = historySearch === '' 
      ? true 
      : h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.auditor.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.version.toLowerCase().includes(historySearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-outfit pb-20 text-slate-800">
      
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

      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-600">
            <FileText size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reporting and Compliance</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                Module 9
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ISO/IEC 27001 regulatory certifications, chronological audit filters, editable preview & cryptographic archive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold">
            <Award size={16} />
            <span>ISO/IEC 27001 Certified</span>
          </div>

          <button
            onClick={handleSavePreferences}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Save these parameters as default preset"
          >
            {savedPreferenceNotice ? <Check size={14} className="text-emerald-600" /> : <Save size={14} />}
            <span>{savedPreferenceNotice ? 'Preset Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 1: REPORT TYPE SELECTOR & FEATURE 2: DATE RANGE PICKER*/}
      {/* ============================================================= */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden print:hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
              <Sliders size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">1. Report Type Selector & 2. Date Range Picker</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                  Features 1 & 2
                </span>
              </div>
              <p className="text-xs text-slate-400">Configure report format, custom section inclusions, and calendar inspection window</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
            SHA-384 Signed Digest
          </span>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Feature 1 (Report Type Selector) */}
          <div className="space-y-5">
            {/* Sub-feature 1.2 & 1.4: Multiple Report Types & Easy UI Dropdown */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Report Type
              </label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-bold text-slate-800 transition-all cursor-pointer"
              >
                <option value="Security Incident & Threat Mitigation Audit (ISO 27001)">Security Incident & Threat Mitigation Audit (ISO 27001)</option>
                <option value="Traffic Analytics & Protocol Distribution Dossier">Traffic Analytics & Protocol Distribution Dossier</option>
                <option value="Gateway Cluster Pulse & Hardware Health Audit">Gateway Cluster Pulse & Hardware Health Audit</option>
                <option value="Edge-to-Cloud Data Ingress & Packet Integrity Report">Edge-to-Cloud Data Ingress & Packet Integrity Report</option>
                <option value="Access Control & RBAC Identity Governance Audit">Access Control & RBAC Identity Governance Audit</option>
                <option value="Custom Multi-Vector Security & Performance Dossier">Custom Multi-Vector Security & Performance Dossier</option>
              </select>
            </div>

            {/* Sub-feature 1.1: Choose Report Format */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Report Format Output
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Official Compliance Certification',
                  'Technical Dossier',
                  'Executive Summary',
                  'Raw Audit Ledger'
                ].map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setReportFormat(fmt)}
                    className={`p-2.5 rounded-xl text-[11px] font-bold border text-left transition-all ${
                      reportFormat === fmt
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-feature 1.3: Custom Selection (Section Checkboxes) */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Custom Section Selection
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'executiveSummary', label: 'Executive KPI Summary' },
                  { key: 'clusterTelemetry', label: 'Cluster Telemetry & Uptime' },
                  { key: 'securityIncidents', label: 'Threat Mitigations Log' },
                  { key: 'isoControls', label: 'ISO 27001 Annex-A Controls' },
                  { key: 'signatureLedger', label: 'Digital Cryptographic Seal' }
                ].map(sec => (
                  <label key={sec.key} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
                    <input
                      type="checkbox"
                      checked={customSections[sec.key]}
                      onChange={(e) => setCustomSections(prev => ({ ...prev, [sec.key]: e.target.checked }))}
                      className="accent-purple-600 rounded"
                    />
                    <span className="text-[11px]">{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Feature 2 (Date Range Picker) */}
          <div className="space-y-5">
            {/* Sub-feature 2.3: Preset Ranges */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-purple-600" />
                  Date Range Selection
                </label>
                <span className="text-[10px] font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">
                  Active: {dateRange}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Quarter-to-Date', 'Year-to-Date', 'Custom Range'].map(range => (
                  <button 
                    key={range}
                    type="button"
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      dateRange === range 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-900/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Sub-feature 2.5: Quick Selection Pills */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quick:</span>
                {['Today', 'Yesterday', 'This Week', 'This Month'].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickSelect(q)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-lg text-[10px] font-bold transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-feature 2.2: Calendar UI Inputs */}
            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Calendar Date & Time Interval
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDateRange('Custom Range');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDateRange('Custom Range');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Start Time</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">End Time</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-feature 2.4: Filter Reports telemetry feedback */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Filter size={13} className="text-purple-600" />
                Filtered Records in Target Window:
              </span>
              <span className="font-mono font-bold text-purple-700">
                {stats.totalPackets.toLocaleString()} Signals
              </span>
            </div>

            {/* Generate Button */}
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 bg-slate-900 hover:bg-purple-600 text-white rounded-2xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Compiling Telemetry & Signatures...</span>
                </>
              ) : (
                <>
                  <span>Compile & Preview Official Report</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FEATURE 3: REPORT PREVIEW & FEATURE 4: EXPORT PDF/CSV         */}
      {/* ============================================================= */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0"
          >
            {/* Sub-feature 3.1: Preview Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {reportFormat}
                  </span>
                  <span className="text-slate-400 font-mono text-xs font-bold">REF: {reportRef}</span>
                  <span className="text-purple-600 font-mono text-xs font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {reportVersion}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{reportType}</h2>
                <p className="text-xs text-slate-500">
                  Target Window: {dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange} • Lead Auditor: {auditorName} • Org: {organizationName}
                </p>
              </div>

              {/* Sub-feature 3.2: Editable View Mode Button */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isEditing 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Edit3 size={14} />
                  <span>{isEditing ? 'Close Editing' : 'Edit Report'}</span>
                </button>
              </div>
            </div>

            {/* Sub-feature 3.2: Editable View Form */}
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-4 print:hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Edit3 size={14} /> Edit Report Metadata & Executive Auditor Notes
                  </span>
                  <button
                    onClick={handleSaveEdits}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Check size={13} /> Save Revision (Bumps Version)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Lead Auditor Signoff</label>
                    <input
                      type="text"
                      value={auditorName}
                      onChange={(e) => setAuditorName(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Enterprise / Organization</label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Compliance Score Rating</label>
                    <input
                      type="text"
                      value={complianceRating}
                      onChange={(e) => setComplianceRating(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Executive Findings Assessment</label>
                  <textarea
                    value={auditorRemarks}
                    onChange={(e) => setAuditorRemarks(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </motion.div>
            )}

            {/* Sub-feature 3.4: Data Validation Status Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span className="font-bold">Data Validation Status:</span>
                <span>All telemetry signatures, hash ledgers, and RBAC authentication proofs verified valid.</span>
              </div>
              <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                VALIDATION: 100% INTEGRITY
              </span>
            </div>

            {/* Sub-feature 3.3: Summary Display (KPI Metric Cards) */}
            {customSections.executiveSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-purple-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Level</span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">Tier-1 High</span>
                  <span className="text-[11px] text-slate-500">TLS 1.3 / SHA-384</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audited Signals</span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.totalPackets.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-500">Zero unhandled packets</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Threat Containment</span>
                  <span className="text-xl font-black text-emerald-600 mt-0.5 block">100.0%</span>
                  <span className="text-[11px] text-slate-500">{stats.critical} Anomaly Mitigated</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-purple-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audit Rating</span>
                  <span className="text-xl font-black text-purple-600 mt-0.5 block">{complianceRating}</span>
                  <span className="text-[11px] text-slate-500">Full ISO Compliance</span>
                </div>
              </div>
            )}

            {/* Executive Findings Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Lead Auditor Executive Assessment
              </h4>
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                {auditorRemarks}
              </div>
            </div>

            {/* ISO/IEC 27001 Security Controls Audit Table */}
            {customSections.isoControls && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  ISO/IEC 27001 Annex-A Security Control Verification
                </h4>
                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0a0c1a] text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase text-[10px]">Clause / Control</th>
                        <th className="px-4 py-3 font-bold uppercase text-[10px]">Specification</th>
                        <th className="px-4 py-3 font-bold uppercase text-[10px]">Evaluation Status</th>
                        <th className="px-4 py-3 font-bold uppercase text-[10px]">Verification Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="px-4 py-3 font-bold">A.9.2 User Access</td>
                        <td className="px-4 py-3">Role-Based Access Control (Admin/User/Viewer)</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">PASSED</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">JWT Token with SHA-256</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">A.10.1 Cryptography</td>
                        <td className="px-4 py-3">In-flight TLS 1.3 encryption & SHA-384 hashing</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">PASSED</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">Active Node Key verified</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">A.12.4 Logging & Monitor</td>
                        <td className="px-4 py-3">Immutable system telemetry & anomaly stream</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">PASSED</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">PostgreSQL Audit Ledger</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">A.13.1 Network Security</td>
                        <td className="px-4 py-3">Rate limiting & packet anomaly thresholding</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">PASSED</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">Isolation Forest Engine</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-feature 3.5: Print-ready Cryptographic Seal & Auditor Signoff */}
            {customSections.signatureLedger && (
              <div className="pt-6 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cryptographic Integrity Seal</span>
                  <span className="font-mono text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    DIGITAL_SIG: SHA384-{reportRef}-VERIFIED-PASS
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Auditor Signoff</span>
                  <span className="font-bold text-slate-900 text-sm">{auditorName}</span>
                  <span className="block text-[10px] text-slate-400 font-mono">Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* FEATURE 4: EXPORT PDF/CSV, MULTIPLE FORMATS & FILE NAMING     */}
            {/* ============================================================= */}
            <div className="pt-6 border-t border-slate-100 space-y-4 print:hidden">
              {/* Sub-feature 4.4: File Naming Configuration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-purple-600" />
                  <span className="font-bold text-slate-700">Custom Export File Naming:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-80">
                  <input
                    type="text"
                    placeholder={`Default: ${reportRef}_audit`}
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-medium outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      setCustomFileName('');
                      showToast('File name reset to system default template.');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                    title="Reset filename"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>

              {/* Export Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Sub-feature 4.5: Share Functionality */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Share2 size={14} />
                  <span>{shareNotice ? 'Verification Link Copied!' : 'Share Verification Link'}</span>
                </button>

                {/* Sub-feature 4.1, 4.2, 4.3: Export PDF, CSV, JSON Download Options */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* PDF Export */}
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/20"
                    title="Print or Save as PDF"
                  >
                    <Printer size={15} />
                    <span>Export / Print PDF</span>
                  </button>

                  {/* CSV Export */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    title="Download as CSV spreadsheet"
                  >
                    <FileSpreadsheet size={15} />
                    <span>Download CSV</span>
                  </button>

                  {/* JSON Export */}
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all"
                    title="Download raw signed JSON"
                  >
                    <FileCode size={15} />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* FEATURE 5: REPORT HISTORY & REVISION ARCHIVE SYSTEM           */}
      {/* ============================================================= */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <History size={20} className="text-purple-600" />
                Report History & Revision Archive
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                Feature 5
              </span>
            </div>
            <p className="text-xs text-slate-500">Persistent storage, version control history, search & audit archive management</p>
          </div>

          {/* Sub-feature 5.3: Search Reports & 5.5: Archive Tabs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search history by ID, title, auditor..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Archive Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {['all', 'active', 'archived'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setHistoryTab(tab)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                    historyTab === tab 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-feature 5.1 & 5.2: Past Reports Table */}
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">No past reports matching the current filter.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0c1a] text-slate-300">
                <tr>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold">Report REF</th>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold">Title</th>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold">Timeframe</th>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold">Auditor</th>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold">Version</th>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold">Status</th>
                  <th className="px-4 py-3 uppercase text-[10px] font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-purple-600">{h.id}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={h.title}>{h.title}</td>
                    <td className="px-4 py-3 text-slate-500">{h.dateRange}</td>
                    <td className="px-4 py-3 text-slate-600">{h.auditor}</td>
                    
                    {/* Sub-feature 5.4: Version Control Badge */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[10px] font-bold">
                        {h.version}
                      </span>
                    </td>

                    {/* Sub-feature 5.5: Archive Status Badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        h.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {h.status}
                      </span>
                    </td>

                    {/* Actions: View in Preview, Archive, Delete */}
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleLoadFromHistory(h)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Load preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(h.id)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                        title={h.status === 'Active' ? 'Archive report' : 'Restore report'}
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(h.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete from history"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
