import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, Zap, Clock, Server, ArrowUpRight, 
  AlertOctagon, Download, Sliders, Calendar, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid, Legend, ReferenceLine
} from 'recharts';

const TrafficAnalytics = () => {
  const [timeRange, setTimeRange] = useState('1h'); // '1h', '24h', '7d'
  const [chartData, setChartData] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [trafficLogs, setTrafficLogs] = useState([]);
  const [spikeThreshold, setSpikeThreshold] = useState(20); // adjustable threshold
  const [loading, setLoading] = useState(true);
  const [gatewayFilter, setGatewayFilter] = useState('all');

  const fetchData = async () => {
    try {
      // 1. Fetch traffic statistics
      const statsRes = await axios.get(`http://localhost:5000/api/analytics/traffic?timeRange=${timeRange}`);
      
      // Adapt statistics for charting
      const formattedStats = statsRes.data.map(item => ({
        time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bytes: Math.round(item.total_bytes / 1024), // convert to KB
        packets: parseInt(item.packets),
        rawTime: item.time
      }));
      setChartData(formattedStats);

      // 2. Fetch gateways to group load
      const gtwRes = await axios.get('http://localhost:5000/api/gateways');
      setGateways(gtwRes.data);

      // 3. Fetch latest traffic logs for drilldown
      const logsRes = await axios.get('http://localhost:5000/api/analytics/traffic-logs?limit=50');
      setTrafficLogs(logsRes.data);
    } catch (e) {
      console.error('Failed to fetch analytics data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Compute stats
  const totalPackets = chartData.reduce((acc, curr) => acc + curr.packets, 0);
  const totalBandwidth = chartData.reduce((acc, curr) => acc + curr.bytes, 0); // in KB
  const avgPacketsPerMinute = chartData.length > 0 ? Math.round(totalPackets / chartData.length) : 0;
  
  // Dynamic spike detection
  const detectedSpikes = chartData.filter(d => d.packets > spikeThreshold);

  // Group traffic per gateway
  const gatewayTraffic = gateways.map(gw => {
    const logs = trafficLogs.filter(l => l.gateway_id === gw.id);
    const bytes = logs.reduce((acc, curr) => acc + (curr.payload_size || 0), 0);
    const count = logs.length;
    return {
      name: gw.name,
      id: gw.id,
      bytes: Math.round(bytes / 1024), // KB
      packets: count
    };
  });

  const handleExportCSV = () => {
    if (trafficLogs.length === 0) return alert('No data to export.');
    
    const headers = ['Log ID', 'Timestamp', 'Device ID', 'Device Name', 'Gateway ID', 'Gateway Name', 'Payload Size (bytes)', 'Security Mode', 'Latency (ms)', 'Status'];
    const csvRows = [
      headers.join(','),
      ...trafficLogs.map(log => [
        log.id,
        new Date(log.timestamp).toISOString(),
        log.device_id,
        `"${(log.device_name || '').replace(/"/g, '""')}"`,
        log.gateway_id,
        `"${(log.gateway_name || '').replace(/"/g, '""')}"`,
        log.payload_size,
        log.is_secure ? 'TLS/HTTPS' : 'HTTP',
        log.latency,
        log.status
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IoT_Nexus_Traffic_Logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = trafficLogs.filter(log => {
    return gatewayFilter === 'all' || log.gateway_id === gatewayFilter;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Top statistics summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
              <Zap size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Packets Aggregate</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{totalPackets}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sim Signals Ingested</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Throughput Rate</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
            {totalBandwidth > 1024 ? `${(totalBandwidth / 1024).toFixed(2)} MB` : `${totalBandwidth} KB`}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payload Volume Transfer</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
              <Activity size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Mean Ingestion</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{avgPacketsPerMinute} pkt/m</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Ingestion Frequency</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-red-50 rounded-2xl text-red-600">
              <AlertOctagon size={24} />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Spike Incidents</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{detectedSpikes.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anomalies Above Threshold</div>
        </div>
      </div>

      {/* Control panel: time selector, threshold adjustor, report downloads */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-full xl:w-auto">
          {[
            { id: '1h', label: '1 Hour Window' },
            { id: '24h', label: '24 Hours Analysis' },
            { id: '7d', label: '7 Days Ledger' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTimeRange(opt.id)}
              className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === opt.id ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Spike threshold slider */}
        <div className="flex items-center gap-6 bg-slate-50 p-4 px-6 rounded-2xl border border-slate-200 flex-1 w-full xl:w-auto">
          <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">
            <Sliders className="text-purple-600" size={16} />
            Spike Trigger Limit:
          </div>
          <input 
            type="range" min="1" max="200" 
            value={spikeThreshold} 
            onChange={(e) => setSpikeThreshold(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="font-mono text-purple-600 font-black text-sm shrink-0">{spikeThreshold} PKTS</div>
        </div>

        {/* Exporter button */}
        <button
          onClick={handleExportCSV}
          className="w-full xl:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-md shrink-0"
        >
          <Download size={16} /> Download CSV Audit Sheet
        </button>
      </div>

      {/* Main Charts: Bandwidth Over Time & Gateway Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time ingestion charts */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Virtual Network Throughput</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Symmetrical ingestion rates & spikes detection</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest">Active Pipeline</span>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400 italic text-sm">Synchronizing stats matrices...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bytesGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                    labelClassName="text-slate-400 text-xs font-mono font-bold"
                    itemStyle={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}
                  />
                  <ReferenceLine y={spikeThreshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SPIKE TRIGGER', position: 'top', fill: '#ef4444', fontSize: 8, fontWeight: 'bold' }} />
                  <Area 
                    type="monotone" 
                    dataKey="packets" 
                    name="Ingestion Packets"
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#bytesGlow)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gateway Wise comparative chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Gateway Balancing View</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Drilldown bandwidth distribution</p>
            </div>
            <div className="text-[9px] font-mono text-slate-400 font-black uppercase tracking-widest">Balanced Load</div>
          </div>

          <div className="h-64 w-full mt-4">
            {gatewayTraffic.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400 italic text-sm">Parsing load weights...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gatewayTraffic} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                    labelClassName="text-slate-400 text-xs font-mono font-bold"
                    itemStyle={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}
                  />
                  <Bar dataKey="bytes" name="Load (KB)" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Traffic incident spikes panel & detailed raw telemetry logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incident register */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Anomalous Spike Register</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Incidents exceeding the spike trigger limit</p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar flex-1 pr-2">
            {detectedSpikes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs">No threshold breach events detected in this window. Safe load status.</div>
            ) : (
              detectedSpikes.map((sp, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 rounded-xl text-red-600">
                      <AlertOctagon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-red-900 uppercase tracking-wide">SPIKE_BREACH</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{sp.time} — Ingest Window</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-red-600">{sp.packets} Pkts</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate (PKT/M)</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Log list view */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Drill-Down Telemetry</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Historical packet ingestion breakdown</p>
            </div>
            
            {/* Gateway Filter selector */}
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold tracking-wide outline-none focus:border-purple-400"
            >
              <option value="all">All Gateways</option>
              {gateways.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar flex-1 border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400">
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.25em]">Asset</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.25em]">Gateway</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.25em]">Volume</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.25em]">Overhead</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.25em] text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No packet logs found matching filters.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-purple-50/50 transition-all text-slate-700">
                      <td className="px-6 py-3 text-slate-900 font-bold font-sans">{log.device_name}</td>
                      <td className="px-6 py-3 font-sans text-slate-500">{log.gateway_name}</td>
                      <td className="px-6 py-3 font-bold text-purple-600">{log.payload_size} B</td>
                      <td className="px-6 py-3">{log.latency} ms</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          log.status === 'success' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                        }`}>
                          {log.status}
                        </span>
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

export default TrafficAnalytics;
