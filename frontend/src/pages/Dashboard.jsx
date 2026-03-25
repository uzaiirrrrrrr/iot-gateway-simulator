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
import { Activity, Server, AlertTriangle } from 'lucide-react';

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
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Active Gateways</p>
            <p className="text-3xl font-bold text-slate-800">{onlineGWs} <span className="text-lg text-slate-400 font-normal">/ {gateways.length}</span></p>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <Server size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Peak Throughput</p>
            <p className="text-3xl font-bold text-slate-800">
              {trafficData.length > 0 ? Math.max(...trafficData.map(d => parseInt(d.total_bytes))).toLocaleString() : 0} <span className="text-lg text-slate-400 font-normal">B/m</span>
            </p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Recent Alerts</p>
            <p className="text-3xl font-bold text-red-500">{alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').length}</p>
          </div>
          <div className="p-4 bg-red-50 text-red-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Live Traffic Throughput</h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="h-72">
            <Line data={chartData} options={options} />
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Monitoring Feed</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No recent alerts or events.</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 transition-all hover:-translate-x-1 hover:shadow-sm ${alert.severity === 'CRITICAL' ? 'border-red-500 bg-red-50 text-red-900' : alert.severity === 'WARNING' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-blue-500 bg-blue-50 text-blue-900'}`}>
                  <div className="flex justify-between items-start mb-1 text-xs font-semibold">
                    <span>{alert.severity}</span>
                    <span className="opacity-70">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
