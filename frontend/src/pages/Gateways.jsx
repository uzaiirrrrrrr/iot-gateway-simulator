import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Power, PowerOff, Search, Server, ShieldCheck, ShieldAlert } from 'lucide-react';

const Gateways = () => {
  const { user } = useContext(AuthContext);
  const [gateways, setGateways] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGateway, setNewGateway] = useState({ id: '', name: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGateways = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/gateways');
      setGateways(res.data);
    } catch (e) {
      console.error('Failed to fetch gateways', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/gateways', newGateway);
      setNewGateway({ id: '', name: '' });
      setIsAdding(false);
      fetchGateways();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating gateway');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/gateways/${id}`, { is_enabled: !currentStatus });
      fetchGateways();
    } catch (e) {
      alert('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will remove all associated devices.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/gateways/${id}`);
      fetchGateways();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const filteredGateways = gateways.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search gateways by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        {user?.role === 'Admin' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Add New Gateway
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="text-blue-500" size={20} />
            Provision New IoT Gateway
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Gateway ID (e.g. GTW-001)"
              value={newGateway.id}
              onChange={(e) => setNewGateway({...newGateway, id: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Display Name"
              value={newGateway.name}
              onChange={(e) => setNewGateway({...newGateway, name: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              required
            />
            <div className="flex gap-2">
               <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Save Gateway</button>
               <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left truncate">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Gateway</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Last Heartbeat</th>
              {user?.role === 'Admin' && <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">Fetching gateways...</td></tr>
            ) : filteredGateways.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No gateways found.</td></tr>
            ) : (
              filteredGateways.map((gtw) => (
                <tr key={gtw.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{gtw.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{gtw.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      gtw.status === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${gtw.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {gtw.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {gtw.last_heartbeat ? new Date(gtw.last_heartbeat).toLocaleString() : 'Never'}
                  </td>
                  {user?.role === 'Admin' && (
                    <td className="px-6 py-4 text-right space-x-2">
                       <button 
                        onClick={() => handleToggle(gtw.id, gtw.is_enabled)}
                        title={gtw.is_enabled ? 'Disable Gateway' : 'Enable Gateway'}
                        className={`p-2 rounded-lg transition-colors ${gtw.is_enabled ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        {gtw.is_enabled ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(gtw.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Gateways;
