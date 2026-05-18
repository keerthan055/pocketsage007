import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-6 animate-glow">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500 mt-2">Log in to your PocketSage AI account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-3xl shadow-2xl">
          {error && <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-zinc-600" size={18} />
              <input 
                type="email" 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="kevin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-zinc-600" size={18} />
              <input 
                type="password" 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group active:scale-[0.98]"
          >
            Authenticate <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-zinc-500">
          Don't have an account? {' '}
          <Link to="/register" className="text-primary hover:underline font-medium">Register for Early Access</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
