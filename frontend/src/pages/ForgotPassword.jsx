import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Lock, Mail, ShieldCheck, Cpu, Key, ArrowLeft, RefreshCw, Send, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email Request, 2: Reset Form, 3: Success
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Simulated inbox preview
  const [simulatedMail, setSimulatedMail] = useState(null);
  const [showSimulatedInbox, setShowSimulatedInbox] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      
      // Store the simulated mail body if provided
      if (res.data.simulationOtp) {
        setSimulatedMail({
          from: 'sec-ops-noreply@iotnexus.net',
          to: email,
          subject: 'SECURITY AUTH DECRYPTION KEY RECOVERY',
          otp: res.data.simulationOtp,
          timestamp: new Date().toLocaleTimeString(),
        });
        setShowSimulatedInbox(true);
      }
      
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Identity verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

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
        otp,
        newPassword,
      });
      setShowSimulatedInbox(false);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your OTP and try again.');
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
            Decrypted transmission link for standard operators. Reset security signatures to re-align telemetry connections.
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
              <span>Back to Access Portal</span>
            </Link>
            
            <motion.h2 
              key={`title-${step}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-4xl font-bold text-slate-900 mb-3"
            >
              {step === 1 && "Reset Signature"}
              {step === 2 && "Decrypt Access"}
              {step === 3 && "Key Updated"}
            </motion.h2>
            <p className="text-slate-400 text-base font-medium">
              {step === 1 && "Input operator email to generate secure recovery OTP key."}
              {step === 2 && "Enter the 6-digit OTP code received and configure new security parameters."}
              {step === 3 && "Your cryptographic access key has been successfully re-aligned."}
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

          {message && step === 1 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-purple-50 border border-purple-100 text-purple-700 px-5 py-4 rounded-2xl mb-8 text-sm flex items-center gap-4"
            >
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              {message}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRequestOtp} 
                className="space-y-7"
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-purple-600 transition-colors">
                    Registered Email Identity
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
                      <span>Transmit Recovery OTP</span>
                      <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleResetPassword} 
                className="space-y-6"
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-purple-600 transition-colors">
                    Security Verification OTP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <ShieldCheck size={18} className="text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP code"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-14 px-5 py-4 outline-none focus:border-purple-400 transition-all focus:ring-4 focus:ring-purple-100 hover:border-slate-300 font-mono tracking-widest text-center text-lg font-bold"
                      required
                    />
                  </div>
                  {simulatedMail && (
                    <button 
                      type="button"
                      onClick={() => setShowSimulatedInbox(true)}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-500 font-bold hover:underline"
                    >
                      [Simulation Mode: View Secure Recovery Email]
                    </button>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-purple-600 transition-colors">
                    New Security Key (Password)
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
                    Confirm Security Key
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
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-4 disabled:bg-purple-400"
                >
                  {loading ? (
                    <>
                      <span>Re-aligning Encryption Keys...</span>
                      <RefreshCw size={20} className="animate-spin" />
                    </>
                  ) : (
                    <span>Commit New Security Signature</span>
                  )}
                </motion.button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
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

      {/* Simulated Intranet Email Client Modal */}
      <AnimatePresence>
        {showSimulatedInbox && simulatedMail && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden font-mono"
            >
              {/* Header */}
              <div className="bg-slate-950/80 px-8 py-5 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-black">Secure Mail Intranet Client [SIMULATION]</span>
                </div>
                <button 
                  onClick={() => setShowSimulatedInbox(false)} 
                  className="text-slate-500 hover:text-slate-300 font-bold transition-colors"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Email Content */}
              <div className="p-8 space-y-6">
                <div className="space-y-2 text-xs border-b border-slate-800/60 pb-4 text-slate-400">
                  <div><span className="text-purple-400 font-bold">FROM:</span> {simulatedMail.from}</div>
                  <div><span className="text-purple-400 font-bold">TO:</span> {simulatedMail.to}</div>
                  <div><span className="text-purple-400 font-bold">SUBJECT:</span> {simulatedMail.subject}</div>
                  <div><span className="text-purple-400 font-bold">TIMESTAMP:</span> {simulatedMail.timestamp}</div>
                </div>

                <div className="space-y-4 text-sm text-slate-300 leading-relaxed pt-2">
                  <p>ATTN: IoT Nexus Gateway Mainframe Operator,</p>
                  <p>
                    A decryption key recovery request was initiated for your registered operator signature. Use the secure OTP verification key below to establish connection authorization.
                  </p>
                  
                  {/* OTP display box */}
                  <div className="my-8 p-6 bg-slate-950 border border-purple-900/30 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-[inset_0_0_20px_rgba(124,58,237,0.05)]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">SECURE TELEMETRY VERIFICATION CODE</span>
                    <span className="text-4xl font-black text-purple-400 tracking-[0.3em] font-mono select-all animate-pulse">
                      {simulatedMail.otp}
                    </span>
                    <button 
                      onClick={() => {
                        setOtp(simulatedMail.otp);
                        setShowSimulatedInbox(false);
                      }}
                      className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 font-black tracking-widest uppercase border border-purple-900/50 px-4 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/20 transition-all active:scale-95"
                    >
                      [Auto-fill Code & Close]
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 italic">
                    CONFIDENTIALITY NOTICE: This transmission is intended solely for security clearance. Do not share this OTP with unauthorized nodes. Expiration in 15 minutes.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPassword;
