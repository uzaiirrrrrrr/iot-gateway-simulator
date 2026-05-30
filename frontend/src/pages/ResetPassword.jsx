import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Key, ArrowLeft, RefreshCw, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token and email from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');
    
    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
    } else {
      setError('Invalid or missing recovery link parameters.');
    }
  }, [location]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !token) {
      return setError('Invalid recovery link. Please request a new one.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      return setError('Password must be at least 8 characters long and contain at least one number.');
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        token,
        newPassword,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your recovery link and try again.');
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
            Password <br />
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Update</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-slate-300 max-w-md mx-auto leading-relaxed font-light"
          >
            Enter your new secure cryptographic signature to re-establish your connection credentials.
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
        <div className="max-w-md w-full relative z-10">
          <div className="mb-10">
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold transition-colors text-sm mb-6 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Sign In</span>
            </Link>
            
            <motion.h2 
              key={`title-${step}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-4xl font-bold text-slate-900 mb-3"
            >
              {step === 1 && "Decrypt Access"}
              {step === 2 && "Key Updated"}
            </motion.h2>
            <p className="text-slate-400 text-base font-medium">
              {step === 1 && `Setting new password for ${email || 'your account'}.`}
              {step === 2 && "Your cryptographic access key has been successfully re-aligned."}
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

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleResetPassword} 
                className="space-y-6"
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-purple-600 transition-colors">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters & 1 number"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-14 pr-12 px-5 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100 hover:border-slate-300"
                      required
                      disabled={!email || !token}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-purple-600 transition-colors">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retype new password"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-14 pr-12 px-5 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100 hover:border-slate-300"
                      required
                      disabled={!email || !token}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(124, 58, 237, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email || !token}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-4 disabled:bg-purple-400"
                >
                  {loading ? (
                    <>
                      <span>Re-aligning Encryption Keys...</span>
                      <RefreshCw size={20} className="animate-spin" />
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-6 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 shadow-xl"
                  >
                    <CheckCircle size={64} />
                  </motion.div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-900">Decryption Core Locked</h3>
                  <p className="text-slate-400 font-semibold leading-relaxed">
                    Authentication keys successfully updated. Operator clearance has been re-established. You may now securely connect to the IoT Gateway Simulator mainframe.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(124, 58, 237, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-4 group"
                >
                  <span>Authenticate Operator Connection</span>
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
