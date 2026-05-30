import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Lock, Mail, Shield, AlertCircle, CheckCircle2, UserPlus, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ label: '', color: 'bg-slate-300', percent: 0 });
  const [emailValid, setEmailValid] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!password) {
        setStrength({ label: '', color: 'bg-slate-300', percent: 0 });
        return;
    }
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLong = password.length >= 8;

    let score = 0;
    if (isLong) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (score === 1) setStrength({ label: 'Weak', color: 'bg-red-500', percent: 33 });
    else if (score === 2) setStrength({ label: 'Fair', color: 'bg-yellow-500', percent: 66 });
    else if (score === 3) setStrength({ label: 'Strong', color: 'bg-purple-600', percent: 100 });
  }, [password]);

  useEffect(() => {
    if (!email) {
        setEmailValid(null);
        return;
    }
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setEmailValid(re.test(email));
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailValid) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', { email, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-outfit">
      {/* Left Side: Visuals */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 bg-slate-900 text-white"
      >
        <div className="absolute inset-0">
          <img 
            src="/images/login-bg.png" 
            alt="IoT Background" 
            className="w-full h-full object-cover opacity-30 scale-x-[-1]" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent"></div>
          {/* Animated Glow Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-fuchsia-600/20 blur-[120px] rounded-full"
          />
        </div>
        
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotateY: [0, 180, 360]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="inline-block p-5 bg-purple-500/10 rounded-3xl backdrop-blur-xl border border-purple-500/20 mb-8"
          >
            <Shield className="text-purple-400" size={56} />
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
          <p className="text-xl text-slate-300 max-w-md mx-auto leading-relaxed font-light">
            Initialize your node in the IoT simulator network. 
            Select your clearance level to proceed.
          </p>
        </div>
      </motion.div>

      {/* Right Side: Form */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white"
      >
        <div className="max-w-md w-full relative">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Sign Up</h2>
            <p className="text-slate-400 text-lg font-medium">Join the unified simulator infrastructure</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl mb-8 text-sm flex items-center gap-4 backdrop-blur-md"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-purple-600">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@gmail.com"
                  className={`w-full bg-slate-50 border ${emailValid === false ? 'border-red-400' : 'border-slate-200'} text-slate-800 rounded-2xl pl-14 pr-14 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100`}
                  required
                />
                {emailValid === true && (
                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-purple-600">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-14 px-5 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100"
                  required
                />
              </div>
              {password && (
                <div className="mt-4 px-1">
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Strength: <span className="text-slate-700">{strength.label}</span></span>
                        <span className="text-[10px] font-bold text-slate-500">{strength.percent}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${strength.percent}%` }}
                          className={`h-full ${strength.color === 'bg-[#6D8773]' ? 'bg-purple-600' : strength.color} rounded-full transition-colors`}
                        />
                    </div>
                </div>
              )}
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-purple-600">
                Network Clearance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Fingerprint size={18} className="text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-14 px-5 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100 appearance-none cursor-pointer font-bold"
                >
                  <option value="Viewer">Viewer (Read Only)</option>
                  <option value="User">User (Manage Devices)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(124, 58, 237, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <UserPlus size={20} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 text-center text-sm text-slate-400 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-500 transition-colors font-bold tracking-tight">
              SIGN IN
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
