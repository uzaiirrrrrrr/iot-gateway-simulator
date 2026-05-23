import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, Server, Cpu, Activity, Shield, ShieldAlert, 
  Terminal, FileText, LogOut, Menu, X, Cloud, History, UserCheck, Trophy
} from 'lucide-react';

const Layout = () => {
  const { user, logout, logoutAll } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to logout from ALL devices?')) {
      await logoutAll();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Gateways', path: '/gateways', icon: <Server size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Device Provision', path: '/devices', icon: <Cpu size={20} />, roles: ['Admin', 'User'] },
    { name: 'Security View', path: '/security', icon: <Shield size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Traffic Analytics', path: '/analytics', icon: <Activity size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Cloud Pipelines', path: '/cloud', icon: <Cloud size={20} />, roles: ['Admin', 'User', 'Viewer'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden font-outfit">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a0c1a] text-white flex flex-col flex-shrink-0 border-r border-slate-800/50">
        <div className="p-6 text-xl font-bold border-b border-slate-800/50 flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Activity className="text-purple-400" size={24} />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">IoT Nexus</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-slate-800">
          <nav className="space-y-1 px-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  location.pathname === item.path 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className={`${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-purple-400'} transition-colors`}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium tracking-wide">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800/50 bg-[#0a0c1a]">
          {/* Encryption Badge */}
          <div className="mb-8 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 backdrop-blur-sm">
              <div className="text-[9px] uppercase tracking-[0.2em] text-purple-400 font-bold mb-2">Encryption Active</div>
              <div className="text-[10px] text-slate-400 font-medium font-mono">NODE_KEY: SHA-384</div>
              <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-purple-500 shadow-[0_0_10px_#a855f7]"
                  />
              </div>
          </div>

          <div className="mb-6 px-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Operator Identity</div>
            <div className="font-bold text-slate-200 truncate text-sm mb-2">{user?.email}</div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] uppercase font-black tracking-widest w-fit rounded-lg">
                <Shield size={10} />
                {user?.role}
            </div>
          </div>
          
          <div className="space-y-2">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 text-slate-500 hover:text-red-400 transition-all w-full px-3 py-2.5 rounded-xl hover:bg-red-500/10 group text-sm font-bold"
            >
                <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                <span>De-authenticate</span>
            </button>
            <button 
                onClick={handleLogoutAll}
                className="flex items-center gap-3 text-slate-600 hover:text-amber-500 transition-all w-full px-3 py-2.5 rounded-xl hover:bg-amber-500/10 group text-sm font-bold"
            >
                <ShieldAlert size={18} className="group-hover:scale-110 transition-transform" />
                <span>Terminate Global Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-[#020617] flex flex-col relative">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

        <header className="h-20 min-h-[5rem] flex items-center px-10 z-10 justify-between border-b border-slate-800/30 backdrop-blur-md bg-[#020617]/80">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-purple-400 shadow-inner">
                {navItems.find(i => i.path === location.pathname)?.icon || <Activity size={20} />}
             </div>
             <div>
               <h1 className="text-2xl font-black text-white tracking-tight">
                  {navItems.find(i => i.path === location.pathname)?.name || 'Platform'}
               </h1>
               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control Center / {location.pathname.replace('/', '')}</div>
             </div>
          </div>
          <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Synchronized</span>
                </div>
                <div className="text-[9px] text-slate-600 font-mono mt-1 uppercase tracking-tighter">Latency: 14ms</div>
              </div>
          </div>
        </header>

        <main className="flex-1 p-10 overflow-y-auto relative custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            key={location.pathname}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>

  );
};

export default Layout;
