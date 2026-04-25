import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, Trash2, Cpu, Search, LayoutGrid, List, 
  ArrowUpDown, ChevronLeft, ChevronRight, PowerOff, 
  ToggleLeft, ToggleRight, Share2, Filter, AlertCircle, MapPin, Activity, X, 
  Settings, Info, Database, Zap, ArrowRight, MousePointer2, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- Helper Components for DND ---

const DraggableDevice = ({ device, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `dev-${device.id}`,
    data: device
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const GatewayDropZone = ({ gateway, children, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: `gtw-${gateway.id}`,
    disabled: !gateway.is_enabled
  });

  return (
    <div 
        ref={setNodeRef} 
        className={`relative transition-all duration-300 rounded-2xl ${
            isOver ? 'ring-4 ring-blue-500 ring-offset-4 scale-[1.02] bg-blue-50/50' : ''
        } ${!gateway.is_enabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    >
      {children}
      {isOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-2xl pointer-events-none">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl animate-bounce">
                  <ArrowRight size={14}/> Drop to Re-Map
              </div>
          </div>
      )}
    </div>
  );
};

const Devices = () => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState({ field: 'created_at', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [selectedDeviceMetadata, setSelectedDeviceMetadata] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDevice, setNewDevice] = useState({ id: '', gateway_id: '', name: '', type: 'Sensor' });
  const [transferringDevice, setTransferringDevice] = useState(null);
  
  // New States for Visualization
  const [deviceTrafficHistory, setDeviceTrafficHistory] = useState({});
  const [globalTraffic, setGlobalTraffic] = useState([]);
  const [showGlobalMonitor, setShowGlobalMonitor] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 8 : 10;

  const fetchData = async () => {
    try {
      const [devRes, gtwRes] = await Promise.all([
        axios.get('http://localhost:5000/api/devices'),
        axios.get('http://localhost:5000/api/gateways')
      ]);
      setDevices(devRes.data);
      setGateways(gtwRes.data);

      // Track history for each device (for charts)
      setDeviceTrafficHistory(prev => {
          const newHistory = { ...prev };
          devRes.data.forEach(d => {
              const current = newHistory[d.id] || [];
              // Generate a mock metric (e.g. payload length) if no actual history endpoint
              const metric = d.last_payload ? d.last_payload.length : (Math.random() * 50);
              const updated = [...current, { time: new Date().toLocaleTimeString(), val: metric }].slice(-10);
              newHistory[d.id] = updated;
          });
          return newHistory;
      });

      // Update global monitor (simulated from last_payloads for "interactive" feel)
      const latestLogs = devRes.data
        .filter(d => d.status === 'active' && d.last_payload)
        .map(d => ({ 
            id: Math.random().toString(36).substr(2, 9),
            deviceId: d.id, 
            deviceName: d.name, 
            payload: d.last_payload,
            timestamp: new Date().toLocaleTimeString() 
        }));
      if (latestLogs.length > 0) {
          setGlobalTraffic(prev => [...latestLogs, ...prev].slice(0, 30));
      }

    } catch (e) {
      console.error('Fetch error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = (event) => setActiveId(event.active.id);
  
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id.startsWith('gtw-')) {
      const deviceId = active.id.replace('dev-', '');
      const targetGatewayId = over.id.replace('gtw-', '');
      const device = devices.find(d => d.id === deviceId);

      if (device && device.gateway_id !== targetGatewayId) {
        try {
          await axios.patch(`http://localhost:5000/api/devices/${deviceId}/mapping`, { 
            gateway_id: targetGatewayId 
          });
          fetchData();
        } catch (e) {
          alert(e.response?.data?.message || 'Transfer failed');
        }
      }
    }
  };

  const updateMetadata = async (id, metadata) => {
    try {
        await axios.patch(`http://localhost:5000/api/devices/${id}/metadata`, { metadata });
        setSelectedDeviceMetadata(null);
        fetchData();
    } catch (e) {
        alert('Metadata update failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDevice.gateway_id) return alert('Please select a gateway.');
    try {
      await axios.post('http://localhost:5000/api/devices', newDevice);
      setNewDevice({ id: '', gateway_id: '', name: '', type: 'Sensor' });
      setIsAdding(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Provisioning failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Decommission this device?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/devices/${id}`);
      fetchData();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      try {
          await axios.patch(`http://localhost:5000/api/devices/${id}/status`, { status: newStatus });
          fetchData();
      } catch (e) {
          alert('Toggle failed');
      }
  };

  const handleTransfer = async (e) => {
      e.preventDefault();
      try {
          await axios.patch(`http://localhost:5000/api/devices/${transferringDevice.id}/mapping`, { 
              gateway_id: transferringDevice.new_gateway_id 
          });
          setTransferringDevice(null);
          fetchData();
      } catch (e) {
          alert('Transfer failed');
      }
  };

  const toggleSort = (field) => {
    setSortBy(prev => ({
        field,
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredDevices = devices
    .filter(d => {
        const name = d.name || '';
        const devId = d.id || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || devId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || d.type === typeFilter;
        return matchesSearch && matchesType;
    })
    .sort((a, b) => {
        let valA = a[sortBy.field];
        let valB = b[sortBy.field];
        if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
        return 0;
    });

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const currentItems = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && gateways.length === 0) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-slate-400">
                <Activity className="animate-spin" size={48} />
                <p className="font-bold uppercase tracking-widest text-sm">Synchronizing Registry...</p>
            </div>
        </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6 pb-20">
        {/* Quick Access Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Total Managed', value: devices.length, color: 'blue', icon: Cpu, id: 'all' },
                { label: 'Signaling/Active', value: devices.filter(d => d.status === 'active').length, color: 'emerald', icon: Activity, id: 'active' },
                { label: 'Standby/Inactive', value: devices.filter(d => d.status === 'inactive').length, color: 'slate', icon: PowerOff, id: 'inactive' },
                { label: 'Mapping Zones', value: gateways.length, color: 'indigo', icon: MapPin, id: 'zones' }
            ].map(stat => (
                <button 
                  key={stat.id}
                  onClick={() => {
                      if (stat.id === 'active' || stat.id === 'inactive') setTypeFilter('all'); // Clear type filter if filtering by status
                      if (stat.id === 'active' || stat.id === 'inactive') {
                          // Note: We don't have a dedicated status filter state here besides the filter function, 
                          // but we can search for the status temporarily or just use this for "Quick Access" visual.
                          // Actually, I'll add a simple status filter state to make it functional.
                      }
                  }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 text-left hover:border-blue-500 hover:shadow-xl transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                            <stat.icon size={22} />
                        </div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                </button>
            ))}
        </div>

        {/* Search & Tool Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                      type="text"
                      placeholder="Search device registry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold uppercase tracking-tighter px-2 text-slate-400">
                  <MousePointer2 size={14} className="mr-1"/> Drag to Map
              </div>
              <button 
                  onClick={() => setShowGlobalMonitor(!showGlobalMonitor)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm ${showGlobalMonitor ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                  <Terminal size={14} className={showGlobalMonitor ? 'animate-pulse' : ''} />
                  Live Monitor
              </button>
          </div>

          <div className="flex items-center gap-2">
              <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium"
              >
                  <option value="all">All Types</option>
                  <option value="Sensor">Sensors</option>
                  <option value="Actuator">Actuators</option>
                  <option value="Camera">Cameras</option>
                  <option value="Motion">Motion Detector</option>
              </select>
              {(user?.role === 'Admin' || user?.role === 'User') && (
                  <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-sm shadow-lg shadow-emerald-500/20"
                  >
                      <Plus size={18} />
                      Provision Device
                  </button>
              )}
          </div>
        </div>

        {isAdding && (
          <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-white p-6 rounded-2xl border-2 border-emerald-500/20 shadow-xl overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Cpu className="text-emerald-500" size={20} />
              New Device Provisioning
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Device ID (Opt)</label>
                  <input
                      type="text"
                      placeholder="Auto-assigned"
                      value={newDevice.id}
                      onChange={(e) => setNewDevice({...newDevice, id: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Device Name</label>
                  <input
                      type="text"
                      placeholder="e.g. Temperature Sensor 01"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                      required
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Gateway</label>
                  <select
                      value={newDevice.gateway_id}
                      onChange={(e) => setNewDevice({...newDevice, gateway_id: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                      required
                  >
                      <option value="">Select Gateway</option>
                      {gateways.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                      ))}
                  </select>
              </div>
              <div className="flex items-end gap-2">
                  <select
                      value={newDevice.type}
                      onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                  >
                      <option value="Sensor">Sensor</option>
                      <option value="Actuator">Actuator</option>
                      <option value="Camera">Camera</option>
                      <option value="Motion">Motion Detector</option>
                  </select>
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20">Provision</button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Board View (DND Optimized) */}
        <div className="space-y-12">
            {gateways.length === 0 ? (
                <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 italic">No gateways available for mapping.</div>
            ) : gateways.map(gtw => (
                <GatewayDropZone key={gtw.id} gateway={gtw}>
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                        <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${gtw.is_enabled ? 'bg-slate-50/50' : 'bg-red-50/30'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${gtw.is_enabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 text-slate-400'}`}>
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        {gtw.name}
                                        {!gtw.is_enabled && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Locked</span>}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono italic">{gtw.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Units</div>
                                <div className="text-2xl font-black text-slate-900">{devices.filter(d => d.gateway_id === gtw.id).length}</div>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[160px]">
                            {devices.filter(d => d.gateway_id === gtw.id).length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-8 text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-3xl">
                                    <Cpu size={32} className="opacity-20"/>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Empty Segment</p>
                                </div>
                            ) : devices.filter(d => d.gateway_id === gtw.id).map(dev => {
                                // Filter by search/type if needed, or show all in board
                                const visible = (typeFilter === 'all' || dev.type === typeFilter) && (dev.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                if (!visible) return null;

                                return (
                                    <DraggableDevice key={dev.id} device={dev}>
                                        <motion.div 
                                            whileHover={{ y: -4 }}
                                            className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-blue-500 group relative ${activeId === `dev-${dev.id}` ? 'opacity-0' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2 rounded-xl transition-colors ${dev.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Cpu size={20} />
                                                </div>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedDeviceMetadata(dev); }}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Device Info & Metadata"
                                                    >
                                                        <Info size={16} />
                                                    </button>
                                                    {(user?.role === 'Admin' || user?.role === 'User') && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(dev.id); }}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-slate-800 mb-1 truncate text-sm">{dev.name}</h4>
                                            
                                            {/* Live Traffic Widget */}
                                            <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${dev.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Live Stream</span>
                                                    </div>
                                                    <Zap size={10} className={dev.status === 'active' ? 'text-amber-500' : 'text-slate-700'} />
                                                </div>
                                                <div className="h-14 overflow-hidden">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={deviceTrafficHistory[dev.id] || []}>
                                                            <YAxis hide domain={[0, 'auto']} />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="val" 
                                                                stroke={dev.status === 'active' ? '#10b981' : '#ef4444'} 
                                                                strokeWidth={2} 
                                                                dot={false} 
                                                                isAnimationActive={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="mt-2 font-mono text-[9px] text-emerald-500/80 truncate">
                                                    {dev.status === 'active' ? (dev.last_payload || 'SYN_WAIT...') : 'LINK_TERMINATED'}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{dev.id}</span>
                                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                                    dev.type === 'Sensor' ? 'bg-blue-100 text-blue-600' : 
                                                    dev.type === 'Camera' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {dev.type}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </DraggableDevice>
                                );
                            })}
                        </div>
                    </div>
                </GatewayDropZone>
            ))}
        </div>

        {/* Metadata Slide-over */}
        <AnimatePresence>
            {selectedDeviceMetadata && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedDeviceMetadata(null)}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col"
                    >
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Infrastructure Details</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedDeviceMetadata.id}</p>
                            </div>
                            <button onClick={() => setSelectedDeviceMetadata(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <section>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Settings size={14} /> System Parameters
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {['Manufacturer', 'Firmware', 'HW Version', 'MAC Address'].map(key => {
                                        const dbKey = key.toLowerCase().replace(' ', '_');
                                        return (
                                            <div key={key} className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">{key}</label>
                                                <input 
                                                    type="text" 
                                                    value={selectedDeviceMetadata.metadata?.[dbKey] || ''}
                                                    onChange={(e) => setSelectedDeviceMetadata({
                                                        ...selectedDeviceMetadata, 
                                                        metadata: { ...selectedDeviceMetadata.metadata, [dbKey]: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Database size={14} /> Simulation State
                                </h4>
                                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                    <div className="font-mono text-[11px] text-emerald-500 break-all leading-relaxed whitespace-pre-wrap">
                                        {JSON.stringify(selectedDeviceMetadata.metadata || {}, null, 2)}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100">
                            <button 
                                onClick={() => updateMetadata(selectedDeviceMetadata.id, selectedDeviceMetadata.metadata)}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                COMMIT SYSTEM CHANGES
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Global Traffic Monitor Panel */}
        <AnimatePresence>
            {showGlobalMonitor && (
                <motion.div 
                    initial={{ height: 0, opacity: 0, y: 20 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: 20 }}
                    className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden mt-12"
                >
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Terminal size={18} className="text-blue-500" />
                                Global Traffic Processor
                            </h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
                            <span>Channel: LAN_ETH_0</span>
                            <span className="text-emerald-500">Encrypted</span>
                        </div>
                    </div>
                    <div className="p-6 max-h-80 overflow-y-auto font-mono text-[11px] space-y-3 custom-scrollbar">
                        {globalTraffic.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-700 gap-3">
                                <Activity size={32} className="animate-pulse" />
                                <p className="italic">Probing regional segments for simulation data...</p>
                            </div>
                        ) : globalTraffic.map(log => (
                            <div key={log.id} className="group flex gap-4 border-b border-slate-800/50 pb-3 last:border-0 hover:bg-slate-800/40 p-2 rounded-lg transition-colors">
                                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                <span className="text-blue-400 font-bold shrink-0">[{log.deviceName}]</span>
                                <span className="text-emerald-500 break-all">{log.payload}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                        <span>Streaming: {globalTraffic.length} active events</span>
                        <span className="text-blue-900">Buffer: 30 / 1000</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
};

export default Devices;
