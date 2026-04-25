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
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Premium Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Network Nodes', value: gateways.length, sub: 'Hardware segments', icon: Server, color: 'blue', trend: 'Stable' },
          { label: 'Active Signals', value: onlineGWs, sub: 'Real-time heartbeats', icon: Activity, color: 'emerald', trend: '+12%' },
          { label: 'Threat Alerts', value: alerts.length, sub: 'System anomalies', icon: AlertTriangle, color: 'red', trend: 'Low' },
          { label: 'Global Traffic', value: trafficData.length > 0 ? (Math.max(...trafficData.map(d => d.packets || 0))) : 0, sub: 'Packets/min', icon: Shield, color: 'indigo', trend: 'Active' }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 hover:-translate-y-2 transition-all duration-300">
             <div className="flex justify-between items-start mb-6">
                <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}>
                   <stat.icon size={24} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700 border border-${stat.color}-100`}>
                   {stat.trend}
                </span>
             </div>
             <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
             <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
             <div className="text-[10px] text-slate-300 font-medium italic mt-2">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Hub */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Signal Throughput Analytics</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time spectral analysis</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Master Node: Active</span>
              </div>
            </div>
            <div className="h-80">
              <Line data={chartData} options={{...options, scales: { ...options.scales, y: { ...options.scales.y, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } }, x: { grid: { display: false }, border: { display: false } } } }} />
            </div>
          </div>

          {/* Quick Action Map (Visual context) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                   <h4 className="text-xl font-black mb-2">Protocol Shield</h4>
                   <p className="text-sm text-blue-100 mb-6">Active packet inspection enabled on all ingress points.</p>
                   <div className="flex items-center gap-3">
                      <div className="h-1 w-24 bg-blue-400 rounded-full overflow-hidden">
                         <div className="h-full bg-white w-3/4 animate-shimmer" />
                      </div>
                      <span className="text-xs font-bold uppercase">75% Secure</span>
                   </div>
                </div>
                <Shield className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700" size={160} />
             </div>
             <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                <Database size={32} className="text-indigo-600 mb-4" />
                <h4 className="text-xl font-black text-slate-800 mb-2">Metadata Sync</h4>
                <p className="text-sm text-slate-500 mb-4">Firmware registry synchronized with local storage.</p>
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />)}
                   <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">+4</div>
                </div>
             </div>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col h-full overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Security Journal</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Classification: Level-3 Only</p>
            </div>
            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                   <Clock size={48} className="mb-4 opacity-20" />
                   <p className="text-xs font-bold uppercase tracking-[0.2em]">Silent Buffer</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="relative pl-10 group">
                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-lg flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                       {alert.severity === 'CRITICAL' ? <AlertTriangle size={14} /> : <Info size={14} />}
                    </div>
                    {alert !== alerts[alerts.length-1] && <div className="absolute left-3 top-8 bottom-0 w-[2px] bg-slate-100" />}
                    
                    <div className="mb-1 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                       <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${alert.severity === 'CRITICAL' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>{alert.severity}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                       {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
               <button className="w-full py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
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
