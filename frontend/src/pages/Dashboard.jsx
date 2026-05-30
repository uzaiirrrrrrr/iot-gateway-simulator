import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Server, AlertTriangle, Shield, Database, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const [trafficData, setTrafficData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [gateways, setGateways] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trafficRes, alertsRes, gwRes] = await Promise.all([
          axios.get('http://localhost:5000/api/analytics/traffic?timeRange=1h'),
          axios.get('http://localhost:5000/api/analytics/alerts'),
          axios.get('http://localhost:5000/api/gateways')
        ]);
        setTrafficData(trafficRes.data);
        setAlerts(alertsRes.data.slice(0, 5)); // Last 5
        setGateways(gwRes.data);
      } catch (e) {
        console.error('Error fetching dashboard data', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: trafficData.map(d => new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        fill: true,
        label: 'Network Throughput (Bytes)',
        data: trafficData.map(d => d.total_bytes),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const onlineGWs = gateways.filter(g => g.status === 'online').length;

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in pb-12 relative">
      {/* Premium Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Network Nodes', value: gateways.length, sub: 'Hardware segments', icon: Server, color: 'purple', trend: 'STABLE' },
          { label: 'Active Signals', value: onlineGWs, sub: 'Real-time heartbeats', icon: Activity, color: 'emerald', trend: '+12%' },
          { label: 'Threat Alerts', value: alerts.length, sub: 'System anomalies', icon: AlertTriangle, color: 'red', trend: 'LOW' },
          { label: 'Global Traffic', value: trafficData.length > 0 ? (Math.max(...trafficData.map(d => d.packets || 0))) : 0, sub: 'Packets/min', icon: Shield, color: 'blue', trend: 'ACTIVE' }
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900/40 backdrop-blur-md rounded-[2rem] shadow-2xl border border-slate-800/50 p-8 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
             <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <stat.icon size={100} />
             </div>
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`p-4 bg-slate-800 text-${stat.color === 'purple' ? 'purple-400' : stat.color === 'emerald' ? 'emerald-400' : stat.color === 'red' ? 'red-400' : 'blue-400'} rounded-2xl shadow-inner`}>
                   <stat.icon size={26} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-950/50 border border-slate-800 text-slate-400`}>
                   {stat.trend}
                </span>
             </div>
             <div className="text-4xl font-black text-white mb-1 relative z-10 tracking-tight">{stat.value}</div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">{stat.label}</div>
             <div className="text-[10px] text-slate-600 font-bold italic mt-3 relative z-10">[{stat.sub}]</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Analytics Hub */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-[#0a0c1a] rounded-[3rem] shadow-2xl p-12 border border-slate-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
                <Activity size={180} className="text-purple-600" />
            </div>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Signal Throughput Analytics</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Core Processor / Real-time spectral analysis</p>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Master Node Linked</span>
              </div>
            </div>
            <div className="h-96 relative z-10">
              <Line 
                data={chartData} 
                options={{
                  ...options, 
                  scales: { 
                    y: { 
                      ...options.scales?.y, 
                      grid: { color: 'rgba(255,255,255,0.03)' }, 
                      ticks: { color: '#475569', font: { weight: 'bold' } }, 
                      border: { display: false } 
                    }, 
                    x: { 
                      grid: { display: false }, 
                      ticks: { color: '#475569', font: { weight: 'bold' } }, 
                      border: { display: false } 
                    } 
                  } 
                }} 
              />
            </div>
          </div>

          {/* Quick Action Map (Visual context) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20">
                <div className="relative z-10">
                   <h4 className="text-2xl font-black mb-3 tracking-tight">Protocol Shield</h4>
                   <p className="text-sm text-purple-100 mb-10 leading-relaxed font-medium">Deep packet inspection active on all ingress clusters.</p>
                   <div className="flex items-center gap-4">
                      <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden border border-white/5">
                         <motion.div animate={{ width: '75%' }} transition={{ duration: 2, ease: "easeOut" }} className="h-full bg-white shadow-[0_0_15px_white]" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">75% SECURED</span>
                   </div>
                </div>
                <Shield className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000" size={200} />
             </div>
             <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-10 border border-slate-800/50 shadow-2xl group hover:border-blue-500/30 transition-all">
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 w-fit mb-8 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                    <Database size={28} />
                </div>
                <h4 className="text-2xl font-black text-white mb-3 tracking-tight">Registry Sync</h4>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">Node firmware synchronized across distributed clusters.</p>
                <div className="flex items-center gap-3">
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => <div key={i} className="h-10 w-10 rounded-xl border-2 border-[#020617] bg-slate-800 shadow-lg" />)}
                      <div className="h-10 w-10 rounded-xl border-2 border-[#020617] bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-900/20">+4</div>
                   </div>
                   <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Units Pending Scan</div>
                </div>
             </div>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="space-y-8">
          <div className="bg-[#0a0c1a] rounded-[3rem] shadow-2xl border border-slate-800/50 flex flex-col h-full overflow-hidden">
            <div className="p-10 border-b border-slate-800/50 bg-slate-900/20">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Security Journal</h3>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">CLASSIFICATION: LEVEL-3 PRIORITY</p>
            </div>
            <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-800">
                   <div className="p-8 rounded-full bg-slate-900 mb-6 border border-slate-800 shadow-inner">
                        <Clock size={56} className="opacity-10" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Silent Buffer State</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="relative pl-12 group">
                    <div className={`absolute left-0 top-1 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500 ${alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'} group-hover:scale-110`}>
                       {alert.severity === 'CRITICAL' ? <AlertTriangle size={16} /> : <Info size={16} />}
                    </div>
                    {alert !== alerts[alerts.length-1] && <div className="absolute left-4 top-10 bottom-0 w-[1px] bg-slate-800/50" />}
                    
                    <div className="mb-2 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${alert.severity === 'CRITICAL' ? 'text-red-500 bg-red-500/5 border-red-500/20' : 'text-blue-400 bg-blue-500/5 border-blue-500/20'}`}>{alert.severity}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                       {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-8 bg-slate-900/30 border-t border-slate-800/50">
               <button className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white hover:border-slate-600 transition-all active:scale-[0.98]">
                  Access Full Intelligence Logs
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
