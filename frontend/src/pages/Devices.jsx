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
            isOver ? 'ring-4 ring-blue-400 ring-offset-4 scale-[1.02] bg-blue-50/50' : ''
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
  const itemsPerPage = 3; // 3 Gateways per page

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
              const metric = d.last_payload ? d.last_payload.length : (Math.random() * 50);
              const updated = [...current, { time: new Date().toLocaleTimeString(), val: metric }].slice(-10);
              newHistory[d.id] = updated;
          });
          return newHistory;
      });

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
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

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

  const totalPages = Math.ceil(gateways.length / itemsPerPage);
  const gatewaysToRender = gateways.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <div className="space-y-10 pb-20 relative">
        {/* Quick Access Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Managed Assets', value: devices.length, color: 'purple', icon: Cpu, id: 'all' },
                { label: 'Signal Active', value: devices.filter(d => d.status === 'active').length, color: 'emerald', icon: Activity, id: 'active' },
                { label: 'Standby Mode', value: devices.filter(d => d.status === 'inactive').length, color: 'slate', icon: PowerOff, id: 'inactive' },
                { label: 'Network Zones', value: gateways.length, color: 'blue', icon: MapPin, id: 'zones' }
            ].map(stat => (
                <button 
                  key={stat.id}
                  className="bg-white border border-slate-200 p-8 rounded-[2rem] text-left hover:border-purple-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`p-4 rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-purple-200 transition-all duration-500`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Telemetry</div>
                    </div>
                    <div className="text-4xl font-black text-slate-800 mb-1 relative z-10 tracking-tight">{stat.value}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] relative z-10">{stat.label}</div>
                    
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                        <stat.icon size={120} />
                    </div>
                </button>
            ))}
        </div>

        {/* Search & Tool Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                  <input
                      type="text"
                      placeholder="Scan device registry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-sm text-slate-700 placeholder:text-slate-400"
                  />
              </div>
              <div className="hidden xl:flex items-center gap-2 bg-purple-50 border border-purple-200 p-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-600">
                  <MousePointer2 size={14} />
                  Drag to Re-Map Infrastructure
              </div>
              <button 
                  onClick={() => setShowGlobalMonitor(!showGlobalMonitor)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${showGlobalMonitor ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              >
                  <Terminal size={16} className={showGlobalMonitor ? 'animate-pulse' : ''} />
                  Live Processor
              </button>
          </div>

          <div className="flex items-center gap-4">
              <div className="relative">
                <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none pl-6 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-purple-400 transition-all text-slate-700 font-bold tracking-wide cursor-pointer hover:border-slate-300"
                >
                    <option value="all">All Classifications</option>
                    <option value="Sensor">Environment Sensors</option>
                    <option value="Actuator">Logic Actuators</option>
                    <option value="Camera">Visual Nodes</option>
                    <option value="Motion">Motion Matrix</option>
                </select>
                <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {(user?.role === 'Admin' || user?.role === 'User') && (
                  <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-sm shadow-lg shadow-emerald-200 active:scale-95 group"
                  >
                      <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                      Provision
                  </button>
              )}
          </div>
        </div>

        {isAdding && (
          <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-emerald-200 shadow-lg overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5">
                <Cpu size={120} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black mb-8 flex items-center gap-4 text-slate-900 relative z-10">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <Cpu className="text-emerald-600" size={24} />
              </div>
              Integrated Device Provisioning
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asset Identifier</label>
                  <input
                      type="text"
                      placeholder="Unique Serial"
                      value={newDevice.id}
                      onChange={(e) => setNewDevice({...newDevice, id: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-slate-700 text-sm placeholder:text-slate-400"
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assigned Name</label>
                  <input
                      type="text"
                      placeholder="e.g. Node_SEC_01"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-slate-700 text-sm placeholder:text-slate-400"
                      required
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Parent Infrastructure</label>
                  <select
                      value={newDevice.gateway_id}
                      onChange={(e) => setNewDevice({...newDevice, gateway_id: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-slate-700 text-sm font-bold tracking-tight"
                      required
                  >
                      <option value="">Select Gateway</option>
                      {gateways.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                      ))}
                  </select>
              </div>
              <div className="flex items-end gap-3">
                  <select
                      value={newDevice.type}
                      onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
                      className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-slate-700 text-sm font-bold tracking-tight"
                  >
                      <option value="Sensor">Sensor</option>
                      <option value="Actuator">Actuator</option>
                      <option value="Camera">Camera</option>
                      <option value="Motion">Motion</option>
                  </select>
                  <button type="submit" className="bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95">Commit</button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Board View (DND Optimized) */}
        <div className="space-y-16">
            {gatewaysToRender.length === 0 ? (
                <div className="bg-white p-24 rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                    No infrastructure units available on this page.
                </div>
            ) : (
                gatewaysToRender.map(gtw => (
                    <GatewayDropZone key={gtw.id} gateway={gtw}>
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-md overflow-hidden transition-all relative">
                        <div className={`p-8 border-b border-slate-200 flex items-center justify-between ${gtw.is_enabled ? 'bg-slate-50' : 'bg-red-50'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`p-4 rounded-2xl transition-all duration-500 ${gtw.is_enabled ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-slate-200 text-slate-400'}`}>
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                                        {gtw.name}
                                        {!gtw.is_enabled && <span className="text-[10px] bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full uppercase font-black tracking-widest">OFFLINE_LOCK</span>}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono font-bold tracking-widest mt-1 uppercase">{gtw.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Connected Units</div>
                                <div className="text-4xl font-black text-slate-800 tracking-tighter">{devices.filter(d => d.gateway_id === gtw.id).length}</div>
                            </div>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-[220px]">
                            {filteredDevices.filter(d => d.gateway_id === gtw.id).length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-300 gap-4 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50">
                                    <Cpu size={48} className="opacity-30"/>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-slate-400">Segment Unpopulated</p>
                                </div>
                            ) : filteredDevices.filter(d => d.gateway_id === gtw.id).map(dev => {
                                return (
                                    <DraggableDevice key={dev.id} device={dev}>
                                        <motion.div 
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-lg group relative overflow-hidden ${activeId === `dev-${dev.id}` ? 'opacity-0' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div className={`p-3 rounded-2xl transition-all duration-500 ${dev.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                    <Cpu size={24} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedDeviceMetadata(dev); }}
                                                        className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                                        title="Telemetric Details"
                                                    >
                                                        <Info size={18} />
                                                    </button>
                                                    {(user?.role === 'Admin' || user?.role === 'User') && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(dev.id); }}
                                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <h4 className="font-black text-slate-800 mb-2 truncate text-base tracking-tight group-hover:text-purple-600 transition-colors">{dev.name}</h4>
                                            
                                            {/* Live Traffic Widget */}
                                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden">
                                                <div className="flex items-center justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${dev.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-red-400'}`} />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Stream_TX</span>
                                                    </div>
                                                    <Zap size={12} className={dev.status === 'active' ? 'text-amber-500' : 'text-slate-300'} />
                                                </div>
                                                <div className="h-16 relative z-10">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={deviceTrafficHistory[dev.id] || []}>
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="val" 
                                                                stroke={dev.status === 'active' ? '#10b981' : '#ef4444'} 
                                                                strokeWidth={3} 
                                                                dot={false} 
                                                                isAnimationActive={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="mt-3 font-mono text-[9px] text-emerald-600 truncate font-bold bg-white p-2 rounded-lg border border-slate-100">
                                                    {dev.status === 'active' ? (dev.last_payload || 'LINK_STABLE...') : 'NODE_INACTIVE'}
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono">{dev.id}</span>
                                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                    dev.type === 'Sensor' ? 'bg-blue-50 text-blue-500 border-blue-200' : 
                                                    dev.type === 'Camera' ? 'bg-purple-50 text-purple-500 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'
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
            ))
        )
        }
        </div>

        {/* Pagination Controls */}
        {gateways.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Showing Gateways <span className="text-slate-800">{(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, gateways.length)}</span> of <span className="text-slate-800">{gateways.length}</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:border-purple-300 group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    
                    <div className="flex items-center gap-2 px-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (totalPages > 7) {
                                if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                    if (Math.abs(page - currentPage) === 2) return <span key={page} className="text-slate-300">...</span>;
                                    return null;
                                }
                            }
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${
                                        currentPage === page 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
                                        : 'bg-white text-slate-400 hover:text-slate-700 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:border-purple-300 group"
                    >
                        <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        )}

        {/* Metadata Slide-over */}
        <AnimatePresence>
            {selectedDeviceMetadata && (
                <div className="fixed inset-0 z-[999] flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedDeviceMetadata(null)}
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/30 blur-[100px] rounded-full -mr-32 -mt-32" />
                        
                        <div className="p-10 border-b border-slate-200 flex items-center justify-between bg-slate-50 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-purple-100 rounded-2xl border border-purple-200">
                                    <Database size={32} className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h3>
                                    <p className="text-xs text-slate-400 font-mono font-bold uppercase tracking-[0.2em] mt-1">{selectedDeviceMetadata.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDeviceMetadata(null)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-all"><X size={24}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 relative z-10 custom-scrollbar">
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    Infrastructure Identity
                                </h4>
                                <div className="grid grid-cols-1 gap-6">
                                    {['Manufacturer', 'Firmware', 'HW Version', 'MAC Address'].map(key => {
                                        const dbKey = key.toLowerCase().replace(' ', '_');
                                        return (
                                            <div key={key} className="space-y-3">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                                                <input 
                                                    type="text" 
                                                    value={selectedDeviceMetadata.metadata?.[dbKey] || ''}
                                                    onChange={(e) => setSelectedDeviceMetadata({
                                                        ...selectedDeviceMetadata, 
                                                        metadata: { ...selectedDeviceMetadata.metadata, [dbKey]: e.target.value }
                                                    })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:border-purple-400 outline-none transition-all focus:ring-4 focus:ring-purple-50"
                                                    placeholder={`Enter ${key.toLowerCase()}...`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    Simulation Logic State
                                </h4>
                                <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-inner">
                                    <pre className="font-mono text-[12px] text-emerald-400 break-all leading-relaxed whitespace-pre-wrap">
                                        {JSON.stringify(selectedDeviceMetadata.metadata || {}, null, 2)}
                                    </pre>
                                </div>
                            </section>
                        </div>

                        <div className="p-10 bg-slate-50 border-t border-slate-200 relative z-10">
                            <button 
                                onClick={() => updateMetadata(selectedDeviceMetadata.id, selectedDeviceMetadata.metadata)}
                                className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-purple-500 transition-all shadow-lg shadow-purple-200 active:scale-[0.98] uppercase tracking-widest"
                            >
                                Overwrite System Registry
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
                    initial={{ height: 0, opacity: 0, y: 50 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: 50 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                    className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden mt-16 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] to-transparent pointer-events-none" />
                    
                    <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="h-4 w-4 bg-emerald-500 rounded-full animate-ping opacity-50" />
                                <div className="absolute inset-0 h-4 w-4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-4">
                                <Terminal size={20} className="text-purple-500" />
                                Matrix Stream Processor
                            </h3>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                Channel: <span className="text-slate-300">HUB_A_WIFI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                                <span className="text-emerald-500">Live Encryption</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 max-h-96 overflow-y-auto font-mono text-[12px] space-y-4 custom-scrollbar relative z-10">
                        {globalTraffic.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-800 gap-6">
                                <Activity size={48} className="animate-pulse" />
                                <p className="italic font-black uppercase tracking-[0.3em] text-xs">Awaiting data burst from infrastructure units...</p>
                            </div>
                        ) : globalTraffic.map(log => (
                            <div key={log.id} className="group flex gap-6 border-b border-slate-900/50 pb-4 last:border-0 hover:bg-white/[0.02] p-4 rounded-2xl transition-all">
                                <span className="text-slate-700 shrink-0 font-bold">[{log.timestamp}]</span>
                                <span className="text-purple-400 font-black shrink-0">[{log.deviceName.toUpperCase()}]</span>
                                <span className="text-emerald-500/80 break-all font-medium leading-relaxed tracking-tight">{log.payload}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-10 py-5 bg-slate-950 border-t border-slate-900 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-purple-900">Processor_Load</span>
                            <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
                                <motion.div animate={{ width: ['10%', '85%', '30%', '95%'] }} transition={{ duration: 10, repeat: Infinity }} className="h-full bg-purple-600" />
                            </div>
                        </div>
                        <span className="text-slate-700">Events: {globalTraffic.length} / 1000 MAX</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
};

export default Devices;
