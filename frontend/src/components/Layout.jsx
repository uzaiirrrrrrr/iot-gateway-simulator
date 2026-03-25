import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, Server, Cpu, Activity, Shield, 
  Terminal, FileText, LogOut, Menu, X, Cloud, History, UserCheck, Trophy
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Gateways', path: '/gateways', icon: <Server size={20} /> },
    { name: 'Device Provision', path: '/devices', icon: <Cpu size={20} /> },
    { name: 'Attack Sandbox', path: '/simulation', icon: <Terminal size={20} /> },
    { name: 'Training Lab', path: '/training', icon: <Trophy size={20} /> },
    { name: 'Network Traffic', path: '/network', icon: <Shield size={20} /> },
    { name: 'Cloud Pipeline', path: '/cloud', icon: <Cloud size={20} /> },
    { name: 'System Health', path: '/health', icon: <Activity size={20} /> },
    { name: 'Security Audit', path: '/audit', icon: <UserCheck size={20} /> },
    { name: 'System Logs', path: '/logs', icon: <History size={20} /> },
    { name: 'Compliance Reports', path: '/reports', icon: <FileText size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-slate-800 flex items-center gap-2">
          <Activity className="text-blue-400" />
          IoT Simulator
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
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

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 text-sm text-slate-400">
            <div>Logged in as:</div>
            <div className="font-semibold text-slate-200 truncate">{user?.email}</div>
            <div className="text-xs mt-1 px-2 py-0.5 bg-slate-800 inline-block rounded text-blue-300">{user?.role}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-800"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50 flex flex-col">
        <header className="bg-white shadow-sm h-16 min-h-[4rem] flex items-center px-8 z-10">
          <h1 className="text-2xl font-semibold text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.name || 'Platform'}
          </h1>
        </header>
        <main className="flex-1 p-8 overflow-y-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            key={location.pathname}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
