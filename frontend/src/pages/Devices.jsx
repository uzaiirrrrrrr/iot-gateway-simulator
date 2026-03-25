import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Cpu, Search, MapPin, Activity } from 'lucide-react';

const Devices = () => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newDevice, setNewDevice] = useState({ id: '', name: '', type: 'Sensor', gateway_id: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [devRes, gwRes] = await Promise.all([
        axios.get('http://localhost:5000/api/devices'),
        axios.get('http://localhost:5000/api/gateways')
      ]);
      setDevices(devRes.data);
      setGateways(gwRes.data);
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDevice.gateway_id) return alert('Select a gateway first');
    try {
      await axios.post('http://localhost:5000/api/devices', newDevice);
      setNewDevice({ id: '', name: '', type: 'Sensor', gateway_id: '' });
      setIsAdding(false);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Create failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this device?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/devices/${id}`);
      fetchData();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        {(user?.role === 'Admin' || user?.role === 'User') && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Provision Device
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="text-blue-500" size={20} />
            New Device Mapping
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
             <input
              type="text"
              placeholder="Device ID (DEV-X)"
              value={newDevice.id}
              onChange={(e) => setNewDevice({...newDevice, id: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" required
            />
            <input
              type="text"
              placeholder="Device Name"
              value={newDevice.name}
              onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" required
            />
            <select 
              value={newDevice.type}
              onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="Sensor">Environment Sensor</option>
              <option value="Motion">Motion Detector</option>
              <option value="Camera">Security Camera</option>
              <option value="Actuator">Actuator Control</option>
            </select>
            <select 
              value={newDevice.gateway_id}
              onChange={(e) => setNewDevice({...newDevice, gateway_id: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" required
            >
              <option value="">Map to Gateway...</option>
              {gateways.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
              ))}
            </select>
            <div className="flex gap-2">
               <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg font-medium">Provision</button>
               <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 underline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <p className="col-span-full text-center py-12 text-slate-400">Loading devices...</p>
        ) : filteredDevices.length === 0 ? (
          <p className="col-span-full text-center py-12 text-slate-400">No managed devices found.</p>
        ) : (
          filteredDevices.map(dev => (
            <div key={dev.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Cpu size={22} />
                </div>
                {user?.role === 'Admin' && (
                  <button onClick={() => handleDelete(dev.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">{dev.name}</h4>
              <p className="text-xs font-mono text-slate-400 mb-4">{dev.id}</p>
              
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="font-medium">{dev.gateway_id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Activity size={14} className="text-slate-400" />
                  <span>{dev.type}</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                 <span className={`h-2 w-2 rounded-full ${dev.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{dev.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Devices;
