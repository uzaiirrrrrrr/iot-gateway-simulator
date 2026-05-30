import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Mail, Key, ArrowLeft, RefreshCw, Send, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setPreviewUrl('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.previewUrl) {
        setPreviewUrl(res.data.previewUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identity verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-outfit relative">
      {/* Left Side: Dynamic Design & Visuals (Desktop only) */}
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
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent"></div>
          {/* Glowing Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full"
          />
        </div>
        
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, -5, 5, 0],
              filter: ["drop-shadow(0 0 0px #7c3aed)", "drop-shadow(0 0 20px #7c3aed)", "drop-shadow(0 0 0px #7c3aed)"]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block p-5 bg-purple-500/10 rounded-3xl backdrop-blur-xl border border-purple-500/20 mb-8"
          >
            <Key className="text-purple-400" size={56} />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-6xl font-black text-white mb-6 tracking-tighter"
          >
            Security Core <br />
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Recovery</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-slate-300 max-w-md mx-auto leading-relaxed font-light"
          >
            We will dispatch a secure recovery link to your registered email to establish a new encrypted signature.
          </motion.p>
        </div>
      </motion.div>

      {/* Right Side: Security Recovery Wizard */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
            <Activity size={300} className="text-purple-600" />
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="mb-10">
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold transition-colors text-sm mb-6 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Sign In</span>
            </Link>
            
            <motion.h2 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-4xl font-bold text-slate-900 mb-3"
            >
              Reset Signature
            </motion.h2>
            <p className="text-slate-400 text-base font-medium">
              Input operator email to receive a secure recovery link.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl mb-8 text-sm flex items-center gap-4 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-purple-50 border border-purple-100 text-purple-700 px-5 py-4 rounded-2xl mb-8 text-sm flex flex-col gap-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                {message}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.form 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleRequestReset} 
              className="space-y-7"
            >
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-purple-600 transition-colors">
                  Registered Email Address
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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-14 px-5 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100 hover:border-slate-300"
                    required
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(124, 58, 237, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-4 group disabled:bg-purple-400"
              >
                {loading ? (
                  <>
                    <span>Verifying Core Identity...</span>
                    <RefreshCw size={20} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Dispatch Recovery Link</span>
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
