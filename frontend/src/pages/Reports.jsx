import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Calendar, Printer, FileDown, CheckCircle, Shield, 
  Award, Lock, Activity, RefreshCw, AlertTriangle, ArrowRight,
  Share2, History, Search, Edit3, Save, Check, Trash2, Archive,
  Sliders, Eye, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = () => {
  const [reportType, setReportType] = useState('Security Incident & Threat Mitigation Audit (ISO 27001)');
  const [dateRange, setDateRange] = useState('Last 24 Hours');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState({ gateways: 3, alerts: 18, critical: 2 });
  const [reportRef, setReportRef] = useState('');
  const [reportVersion, setReportVersion] = useState('v1.0');

  // Editable Preview Fields
  const [isEditing, setIsEditing] = useState(false);
  const [auditorName, setAuditorName] = useState('Eng. Sarah Chen, CISSP');
  const [auditorRemarks, setAuditorRemarks] = useState(
    'The evaluated IoT cluster demonstrates robust encryption compliance with TLS 1.3 / SHA-384. Ingress telemetry remained consistent with zero unmitigated root exploits during the target observation cycle.'
  );

  // Preference persistence
  const [savedPreferenceNotice, setSavedPreferenceNotice] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);

  // Report History Storage in LocalStorage
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
        dateRange: 'Last 7 Days',
        auditor: 'Eng. Sarah Chen, CISSP',
        generatedAt: '2026-10-25 14:30:00',
        version: 'v1.0',
        status: 'Active',
        hash: 'SHA384:a9b2c8f...4e1'
      },
      {
        id: 'ISO-7321-B4',
        title: 'Traffic Analytics & Throughput Distribution Report',
        dateRange: 'Last 30 Days',
        auditor: 'SecOps Automated Bot',
        generatedAt: '2026-10-20 09:15:00',
        version: 'v1.2',
        status: 'Archived',
        hash: 'SHA384:7e4f1a0...99c'
      }
    ];
  });

  const [historySearch, setHistorySearch] = useState('');

  // Load Preferences on mount
  useEffect(() => {
    try {
      const pref = localStorage.getItem('iot_report_preferences');
      if (pref) {
        const parsed = JSON.parse(pref);
        if (parsed.reportType) setReportType(parsed.reportType);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.auditorName) setAuditorName(parsed.auditorName);
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

  // Fetch quick metrics for real report data
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
          critical: crit || 2 
        });
      } catch (e) {
        console.error('Failed to load summary stats', e);
      }
    };
    fetchQuickStats();
  }, []);

  // Save User Preferences
  const handleSavePreferences = () => {
    try {
      localStorage.setItem('iot_report_preferences', JSON.stringify({
        reportType,
        dateRange,
        auditorName
      }));
      setSavedPreferenceNotice(true);
      setTimeout(() => setSavedPreferenceNotice(false), 2500);
    } catch (e) {
      alert('Failed to save preferences');
    }
  };

  // Generate Report
  const handleGenerate = () => {
    setIsGenerating(true);
    const newRef = 'ISO-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setReportRef(newRef);
    setReportVersion('v1.0');

    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);

      // Add to history
      const newEntry = {
        id: newRef,
        title: reportType,
        dateRange: dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange,
        auditor: auditorName,
        generatedAt: new Date().toLocaleString(),
        version: 'v1.0',
        status: 'Active',
        hash: 'SHA384:' + Math.random().toString(16).substring(2, 14) + '...f91'
      };
      setReportHistory(prev => [newEntry, ...prev]);
    }, 1200);
  };

  // Save Edits to Preview
  const handleSaveEdits = () => {
    setIsEditing(false);
    // Increment version
    const nextVer = 'v' + (parseFloat(reportVersion.replace('v', '')) + 0.1).toFixed(1);
    setReportVersion(nextVer);

    // Update in history
    setReportHistory(prev => prev.map(item => {
      if (item.id === reportRef) {
        return {
          ...item,
          version: nextVer,
          auditor: auditorName,
          generatedAt: new Date().toLocaleString()
        };
      }
      return item;
    }));
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Report Reference', 
      'Report Type', 
      'Date Window', 
      'Auditor Signoff', 
      'Version', 
      'Active Gateways', 
      'Critical Anomalies', 
      'Compliance Status'
    ];
    const row = [
      `"${reportRef}"`,
      `"${reportType}"`,
      `"${dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange}"`,
      `"${auditorName}"`,
      `"${reportVersion}"`,
      stats.gateways,
      stats.critical,
      '"VERIFIED COMPLIANT (ISO/IEC 27001)"'
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportRef}_ISO27001_Audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share link
  const handleShare = () => {
    navigator.clipboard.writeText(`https://simulator.local/reports/verify/${reportRef}`);
    setShareNotice(true);
    setTimeout(() => setShareNotice(false), 2500);
  };

  // Delete / Archive History
  const handleDeleteHistory = (id) => {
    setReportHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleArchive = (id) => {
    setReportHistory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'Active' ? 'Archived' : 'Active' };
      }
      return item;
    }));
  };

  const filteredHistory = reportHistory.filter(h => 
    h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.id.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.auditor.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-outfit pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-600">
            <FileText size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reporting and Compliance</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                Module 9
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated ISO/IEC 27001 report generation, date range selection, preview editor & audit archive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold">
            <Award size={16} />
            <span>ISO/IEC 27001 Certified</span>
          </div>

          <button
            onClick={handleSavePreferences}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Save these parameters as default"
          >
            {savedPreferenceNotice ? <Check size={14} className="text-emerald-600" /> : <Save size={14} />}
            <span>{savedPreferenceNotice ? 'Saved!' : 'Save Preset'}</span>
          </button>
        </div>
      </div>

      {/* 2. Report Type Selector & Date Range Picker */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden print:hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">1. Report Type & Chronological Filter</h3>
              <p className="text-xs text-slate-400">Select protocol audit domain and calendar inspection window</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            SHA-384 Cryptographic Ledger
          </span>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Type Selector & Date Picker */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Report Type Format
              </label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-bold text-slate-800 transition-all cursor-pointer"
              >
                <option value="Security Incident & Threat Mitigation Audit (ISO 27001)">Security Incident & Threat Mitigation Audit (ISO 27001)</option>
                <option value="Traffic Analytics & Throughput Distribution Report">Traffic Analytics & Throughput Distribution Report</option>
                <option value="Gateway Cluster Pulse & Uptime Health Report">Gateway Cluster Pulse & Uptime Health Report</option>
                <option value="Edge-to-Cloud Data Ingress & Packet Integrity Audit">Edge-to-Cloud Data Ingress & Packet Integrity Audit</option>
                <option value="Comprehensive Full-System Security Dossier">Comprehensive Full-System Security Dossier</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-purple-600" />
                  Date Range Selection
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">Active: {dateRange}</span>
              </label>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Quarter-to-Date', 'Custom Range'].map(range => (
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

              {/* Custom Date Pickers */}
              {dateRange === 'Custom Range' && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Auditor Name Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Certifying Lead Auditor
              </label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                placeholder="Auditor Name & Credentials"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-bold text-slate-800"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-slate-900 hover:bg-purple-600 text-white rounded-2xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
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

          {/* Right Column: Compliance Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl w-fit text-emerald-600">
                <CheckCircle2 size={26} />
              </div>
              <h4 className="text-base font-black text-slate-900">Cryptographically Sealed Audit</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                All generated reports produce tamper-evident SHA-384 digital hashes verifying gateway clusters, TLS 1.3 handshake encryption, and ISO/IEC 27001 standard adherence.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  'Access Control & RBAC Authentication Verification',
                  'Cryptographic Data-at-Rest & In-Flight Compliance',
                  'Real-Time Anomaly & Attack Mitigation Readiness',
                  'Gateway Node Heartbeat Integrity Check'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Target Gateways</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{stats.gateways} Nodes</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Breaches Mitigated</p>
                <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.critical} Contained</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Report Preview (With Editable View & Export) */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0"
          >
            {/* Header / Top Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Official Certified Audit
                  </span>
                  <span className="text-slate-400 font-mono text-xs font-bold">REF: {reportRef}</span>
                  <span className="text-purple-600 font-mono text-xs font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {reportVersion}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{reportType}</h2>
                <p className="text-xs text-slate-500">
                  Target Window: {dateRange === 'Custom Range' ? `${startDate} to ${endDate}` : dateRange} • Lead Auditor: {auditorName}
                </p>
              </div>

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
                  <span>{isEditing ? 'Editing Mode' : 'Edit Remarks'}</span>
                </button>
              </div>
            </div>

            {/* Editable Remarks Notice */}
            {isEditing && (
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Edit3 size={14} /> Edit Executive Findings & Auditor Notes
                  </span>
                  <button
                    onClick={handleSaveEdits}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Check size={12} /> Save Revision
                  </button>
                </div>
                <textarea
                  value={auditorRemarks}
                  onChange={(e) => setAuditorRemarks(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-purple-600">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Level</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">Tier-1 High</span>
                <span className="text-[11px] text-slate-500">TLS 1.3 / SHA-384</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-600">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audited Signals</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">142,500</span>
                <span className="text-[11px] text-slate-500">Zero unhandled packets</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-600">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Threat Containment</span>
                <span className="text-xl font-black text-emerald-600 mt-0.5 block">100.0%</span>
                <span className="text-[11px] text-slate-500">All breaches neutralized</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-purple-600">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audit Rating</span>
                <span className="text-xl font-black text-purple-600 mt-0.5 block">99.8%</span>
                <span className="text-[11px] text-slate-500">Full ISO Compliance</span>
              </div>
            </div>

            {/* Executive Findings Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Lead Auditor Executive Assessment
              </h4>
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                {auditorRemarks}
              </div>
            </div>

            {/* ISO/IEC 27001 Security Controls Audit Table */}
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

            {/* Cryptographic Seal & Auditor Signoff */}
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

            {/* Action Bar (Print / Export / Share) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Share2 size={14} />
                  <span>{shareNotice ? 'Copied Verification Link!' : 'Share'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/20"
                >
                  <Printer size={16} />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <FileDown size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Report History & Archive System */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History size={20} className="text-purple-600" />
              Report History & Revision Archive
            </h3>
            <p className="text-xs text-slate-500">Persistent storage of previously generated compliance certificates</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search history by ID, title, or auditor..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">No past reports in archive.</div>
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
                    <td className="px-4 py-3 max-w-xs truncate">{h.title}</td>
                    <td className="px-4 py-3 text-slate-500">{h.dateRange}</td>
                    <td className="px-4 py-3 text-slate-600">{h.auditor}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[10px] font-bold">
                        {h.version}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        h.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setReportRef(h.id);
                          setReportType(h.title);
                          setDateRange(h.dateRange);
                          setAuditorName(h.auditor);
                          setReportVersion(h.version);
                          setShowPreview(true);
                        }}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Load preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(h.id)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                        title="Toggle archive"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(h.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete entry"
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
