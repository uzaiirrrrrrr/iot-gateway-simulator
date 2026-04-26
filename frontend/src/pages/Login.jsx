import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, Lock, Mail, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('admin@io.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, rememberMe);
      navigate('/gateways');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] overflow-hidden font-outfit">
      {/* Left Side: Design & Visuals (Desktop only) */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 bg-[#0a0c1a]"
      >
        <div className="absolute inset-0">
          <img 
            src="/images/login-bg.png" 
            alt="IoT Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/40 to-transparent"></div>
          {/* Animated Glow Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/30 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[150px] rounded-full"
          />
        </div>
        
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
              filter: ["drop-shadow(0 0 0px #7c3aed)", "drop-shadow(0 0 20px #7c3aed)", "drop-shadow(0 0 0px #7c3aed)"]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block p-5 bg-purple-500/10 rounded-3xl backdrop-blur-xl border border-purple-500/20 mb-8"
          >
            <Cpu className="text-purple-400" size={56} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-6xl font-black text-white mb-6 tracking-tighter"
          >
            IoT Gateway <br />
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Simulator</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-slate-400 max-w-md mx-auto leading-relaxed font-light"
          >
            Step into the future of secure gateway management. 
            High-fidelity simulation for critical infrastructure.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 flex gap-10 justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <ShieldCheck className="text-purple-400" size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Activity className="text-fuchsia-400" size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side: Credentials */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#020617] relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Activity size={300} className="text-purple-600" />
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="mb-12 text-center lg:text-left">
            <motion.h2 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-4xl font-bold text-white mb-3"
            >
              Access Portal
            </motion.h2>
            <p className="text-slate-500 text-lg">Enter credentials to establish connection</p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl mb-8 text-sm flex items-center gap-4 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-purple-400">
                Email Identity
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@gmail.com"
                  className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-2xl pl-14 px-5 py-4 outline-none focus:border-purple-500/50 transition-all focus:ring-4 focus:ring-purple-500/5 hover:border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-purple-400">
                Security Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-2xl pl-14 px-5 py-4 outline-none focus:border-purple-500/50 transition-all focus:ring-4 focus:ring-purple-500/5 hover:border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-700 rounded-lg bg-transparent peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all shadow-[0_0_10px_rgba(124,58,237,0)] peer-checked:shadow-[0_0_15px_rgba(124,58,237,0.4)]"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Remember Me</span>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(124, 58, 237, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-purple-900/20 transition-all flex items-center justify-center gap-4 group"
            >
              <span>Initialize Connection</span>
              <Activity size={20} className="group-hover:animate-pulse" />
            </motion.button>
          </form>

          <div className="mt-12 text-center text-sm text-slate-500">
            Unauthorized?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition-colors font-bold tracking-tight">
              REGISTER NEW NODE
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
