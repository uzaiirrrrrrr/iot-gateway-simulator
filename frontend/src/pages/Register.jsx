import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Lock, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ label: '', color: 'bg-slate-700', percent: 0 });
  const [emailValid, setEmailValid] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Password strength logic
    if (!password) {
        setStrength({ label: '', color: 'bg-slate-700', percent: 0 });
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
    else if (score === 3) setStrength({ label: 'Strong', color: 'bg-emerald-500', percent: 100 });
  }, [password]);

  useEffect(() => {
    if (!email) {
        setEmailValid(null);
        return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="p-3 bg-blue-600 rounded-full">
              <Activity className="text-white" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">Create Account</h2>
          <p className="text-center text-slate-400 mb-8">Join the IoT Simulator Platform</p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-900 border ${emailValid === false ? 'border-red-500' : 'border-slate-700'} text-white rounded-lg pl-10 pr-10 py-2.5 outline-none focus:border-blue-500 transition-colors`}
                  required
                />
                {emailValid === true && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 px-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              {password && (
                <div className="mt-2 text-xs">
                    <div className="flex justify-between mb-1">
                        <span className="text-slate-400">Strength: <span className="text-white font-medium">{strength.label}</span></span>
                        <span className="text-slate-500">{strength.percent}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} transition-all duration-500`} style={{ width: `${strength.percent}%` }}></div>
                    </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Requested Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-slate-500" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 px-4 py-2.5 outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="Viewer">Viewer (Read Only)</option>
                  <option value="User">User (Manage Devices)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
