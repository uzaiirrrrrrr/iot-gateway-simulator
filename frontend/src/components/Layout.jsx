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
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Gateways', path: '/gateways', icon: <Server size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Device Provision', path: '/devices', icon: <Cpu size={20} />, roles: ['Admin', 'User'] },
    { name: 'Attack Sandbox', path: '/simulation', icon: <Terminal size={20} />, roles: ['Admin'] },
    { name: 'Training Lab', path: '/training', icon: <Trophy size={20} />, roles: ['Admin', 'User'] },
    { name: 'Network Traffic', path: '/network', icon: <Shield size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Cloud Pipeline', path: '/cloud', icon: <Cloud size={20} />, roles: ['Admin', 'User'] },
    { name: 'System Health', path: '/health', icon: <Activity size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Security Audit', path: '/audit', icon: <UserCheck size={20} />, roles: ['Admin'] },
    { name: 'System Logs', path: '/logs', icon: <History size={20} />, roles: ['Admin', 'User', 'Viewer'] },
    { name: 'Compliance Reports', path: '/reports', icon: <FileText size={20} />, roles: ['Admin', 'User'] },
  ];

  const filteredNavItems = navItems.slice(0, 3).filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-4 text-xl font-bold border-b border-slate-800 flex items-center gap-2">
          <Activity className="text-blue-400" />
          IoT Simulator
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <nav className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                  location.pathname === item.path 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {/* Encryption Badge */}
          <div className="mb-6 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
              <div className="text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-1">Encryption Protocol</div>
              <div className="text-[10px] text-slate-300 font-medium">Bcrypt + AES-256 CBC</div>
              <div className="mt-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[95%] bg-blue-500 animate-pulse"></div>
              </div>
          </div>

          <div className="mb-4 text-sm text-slate-400">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Authenticated As</div>
            <div className="font-semibold text-slate-200 truncate">{user?.email}</div>
            <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-wider w-fit rounded">
                <Shield size={10} />
                {user?.role}
            </div>
          </div>
          
          <div className="space-y-1">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-all w-full px-2 py-1.5 rounded-md hover:bg-red-500/10 group text-sm"
            >
                <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                <span className="font-medium">Sign Out</span>
            </button>
            <button 
                onClick={handleLogoutAll}
                className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-all w-full px-2 py-1.5 rounded-md hover:bg-red-500/10 group text-[10px] uppercase font-bold tracking-wider"
            >
                <ShieldAlert size={12} />
                <span>Logout All Devices</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 h-16 min-h-[4rem] flex items-center px-8 z-10 justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                {navItems.find(i => i.path === location.pathname)?.icon || <Activity size={20} />}
             </div>
             <h1 className="text-xl font-bold text-slate-800">
                {navItems.find(i => i.path === location.pathname)?.name || 'Platform'}
             </h1>
          </div>
          <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Live</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto relative bg-slate-50/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
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
