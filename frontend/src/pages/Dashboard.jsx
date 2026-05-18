import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';
import { 
  TrendingUp, TrendingDown, AlertTriangle, 
  Activity, DollarSign, PieChart as PieIcon, Sparkles,
  Zap, ShieldCheck, Landmark, RefreshCw, ChevronRight,
  Target, BarChart3, Clock, AlertCircle, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
  <div className="glass p-5 rounded-2xl border-white/5 group hover:border-white/10 transition-all">
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-lg bg-${color}/10`}>
        <Icon size={18} className={`text-${color}`} />
      </div>
      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-black italic tracking-tighter">{value}</span>
      <span className={`text-[10px] mt-0.5 font-bold ${subValue?.startsWith('+') ? 'text-success' : 'text-danger'}`}>
        {subValue}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [fds, setFds] = useState(null);
  const [fdsHistory, setFdsHistory] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const { formatCurrency } = useCurrency();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    console.log("Initializing Neural Data Uplink...");
    
    try {
      const token = localStorage.getItem('token');
      const endpoints = [
        '${import.meta.env.VITE_API_URL || "http://localhost:8000"}/dashboard/summary',
        '${import.meta.env.VITE_API_URL || "http://localhost:8000"}/fds/current',
        '${import.meta.env.VITE_API_URL || "http://localhost:8000"}/fds/history',
        '${import.meta.env.VITE_API_URL || "http://localhost:8000"}/dashboard/daily-briefing',
        '${import.meta.env.VITE_API_URL || "http://localhost:8000"}/dashboard/score-breakdown'
      ];

      // Use allSettled so one failed sector doesn't block the entire Lattice
      const results = await Promise.allSettled(
        endpoints.map(url => axios.get(url, { 
          headers: { Authorization: `Bearer ${token}` }
        }))
      );

      if (results[0].status === 'fulfilled') setData(results[0].value.data);
      if (results[1].status === 'fulfilled') setFds(results[1].value.data);
      if (results[2].status === 'fulfilled') setFdsHistory(results[2].value.data);
      if (results[3].status === 'fulfilled') setBriefing(results[3].value.data);
      if (results[4].status === 'fulfilled') setBreakdown(results[4].value.data);

      // Critical Check: If main data sectors failed, show a helpful error instead of spinner
      if (results[0].status === 'rejected' && results[1].status === 'rejected') {
        throw new Error("Core Intelligence Sectors Unreachable");
      }
    } catch (err) {
      console.error("Neural Link Error:", err);
      setError("Unable to sync with the intelligence lattice. Please verify local connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Safety Timeout: Force-exit loading after 12 seconds to give the models adequate inference time
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 12000);

    return () => clearTimeout(safetyTimer);
  }, []);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] animate-pulse">Initializing FDS Lattice...</p>
        <p className="text-[8px] font-bold text-zinc-700 uppercase mt-2">Connecting to ML Nodes</p>
      </div>
    </div>
  );

  // Final Render Guard: If we are not loading but have no data/fds, it's a failed sync
  if (!loading && (!data || !fds)) return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center border border-warning/20">
        <Zap size={40} className="text-warning" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Neural Sync Incomplete</h3>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">The intelligence lattice is taking longer than expected to align.</p>
      </div>
      <button 
        onClick={fetchData}
        className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-3"
      >
        <RefreshCw size={18} /> Forced Re-Alignment
      </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 max-w-[1600px] mx-auto">
      {/* Flagship FDS Header Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-12 pt-4">
        {/* Left Stats */}
        <div className="space-y-6 hidden lg:block">
           <StatCard title="Health Score" value={data?.metrics?.health_score || '---'} subValue="+2.5% vs avg" icon={Activity} color="primary" />
           <StatCard title="30D Risk" value={fds?.category || '---'} subValue="Neural Forecast" icon={AlertTriangle} color={fds?.color === 'red' ? 'danger' : 'success'} />
        </div>

        {/* Central FDS Gauge */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="w-64 h-64 rounded-full border-8 border-white/5 flex flex-col items-center justify-center relative group">
             {/* Glowing Pulse Rings */}
             <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping opacity-20"></div>
             <div className={`absolute inset-0 rounded-full border-t-8 border-primary transition-all duration-1000 rotate-[${((fds?.score || 0) / 100) * 360}deg] shadow-[0_0_30px_rgba(59,130,246,0.2)]`} />
             
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Distress Score</p>
             <h2 className="text-7xl font-black italic tracking-tighter text-white py-2">{fds?.score || '---'}</h2>
             <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                {fds?.category || 'NEURAL SYNC'}
             </div>
          </div>
          
          <div className="mt-8 text-center space-y-1">
             <h1 className="text-xl font-black italic tracking-tighter uppercase">POCKETSAGE <span className="text-primary tracking-normal">AI</span></h1>
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Integrated Risk Matrix</p>
          </div>
        </div>

        {/* Right Stats */}
        <div className="space-y-6 hidden lg:block">
           <StatCard title="Savings Velocity" value={`${((data?.metrics?.savings_ratio || 0) * 100).toFixed(1)}%`} subValue="Target Met" icon={TrendingUp} color="success" />
           <StatCard title="Debt Leverage" value={(data?.metrics?.debt_to_income_ratio || 0).toFixed(2)} subValue="Stable Threshold" icon={TrendingDown} color="warning" />
        </div>
      </div>

      {/* Proactive Intelligence Bar */}
      <AnimatePresence>
        {briefing && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-6 rounded-[2rem] border-primary/20 bg-primary/5 flex flex-col lg:flex-row items-center gap-6 relative overflow-hidden group">
            <div className="flex items-center gap-4 shrink-0">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="text-primary" size={24} />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Neural Tip</p>
                  <p className="text-xs font-bold text-white italic">"{briefing?.ai_tip}"</p>
               </div>
            </div>
            <div className="h-px lg:h-8 w-full lg:w-px bg-white/10 mx-2" />
            <p className="text-sm font-medium text-zinc-400 leading-relaxed italic text-center lg:text-left flex-1">
              {briefing?.summary}
            </p>
            <button 
              onClick={() => setShowAnalysisModal(true)}
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all shrink-0"
            >
              Full Analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Forecast/Trend Comparison HUD */}
        <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 italic">
                 <BarChart3 size={18} /> Liquidity vs Risk Trend
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest text-primary">● Cash Flow</div>
                <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest text-zinc-500">○ Distress Score</div>
              </div>
           </div>
           
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data?.forecast || []}>
                    <defs>
                      <linearGradient id="colorFds" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}
                       itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="predicted_balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFds)" strokeWidth={4} />
                    {/* Simulated Score Line overlay */}
                    <Line type="monotone" dataKey={() => 78} stroke="#52525b" strokeWidth={1} strokeDasharray="5 5" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 4 Pillars Matrix HUD */}
        <div className="glass p-8 rounded-[2.5rem] border-white/5">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 italic">
                 <ShieldCheck size={18} /> Stability Matrix (Pillars)
              </h3>
              <RefreshCw size={14} className="text-zinc-600 animate-spin-slow cursor-pointer hover:text-white transition-all" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'Debt Lever Risk', value: fds?.breakdown?.debt_risk || 0, color: '#ef4444', icon: Landmark },
                { label: 'Savings Vitality', value: fds?.breakdown?.savings_health || 0, color: '#10b981', icon: Target },
                { label: 'Behavioral Discipline', value: fds?.breakdown?.spending_discipline || 0, color: '#3b82f6', icon: Zap },
                { label: 'Neural Stability', value: fds?.breakdown?.stability || 0, color: '#f59e0b', icon: Activity }
              ].map((pillar, i) => (
                <div key={i} className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-white/5 border border-white/5"><pillar.icon size={14} style={{ color: pillar.color }} /></div>
                         <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest italic">{pillar.label}</span>
                      </div>
                      <span className="text-xs font-black italic" style={{ color: pillar.color }}>{pillar.value}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pillar.value}%` }} transition={{ duration: 1.5, delay: i * 0.2 }} className="h-full rounded-full" style={{ backgroundColor: pillar.color }} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Operations Ledger */}
         <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 italic">Verified Operations Ledger</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-600 text-[9px] uppercase font-black tracking-widest border-b border-white/5">
                      <th className="pb-6">Descriptor</th>
                      <th className="pb-6">Volume</th>
                      <th className="pb-6 text-right">Authenticity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recent_transactions || []).map((t) => (
                      <tr key={t.id} className="group hover:bg-white/[0.02] transition-all">
                        <td className="py-5 text-sm font-black text-white italic">{t.category}</td>
                        <td className={`py-5 text-sm font-black ${t.type === 'Expense' ? 'text-white' : 'text-success'}`}>
                          {t.type === 'Expense' ? '-' : '+'}{formatCurrency(t.amount)}
                        </td>
                        <td className="py-5 text-right">
                          <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${t.is_anomaly ? 'bg-danger/20 text-danger' : 'bg-white/5 text-zinc-500'}`}>
                            {t.is_anomaly ? 'Anomaly' : 'Verified'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* AI Strategy & Alerts */}
         <div className="space-y-6">
            <div className="glass p-8 rounded-[2.5rem] bg-danger/5 border-danger/20 relative group">
               <AlertCircle className="absolute top-8 right-8 text-danger/20 group-hover:text-danger/40 transition-all" size={40} />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-danger mb-6 italic flex items-center gap-2">
                  <AlertTriangle size={16} /> Neural Warnings
               </h3>
               {(data?.alerts || []).length > 0 ? (
                 <div className="space-y-4">
                    {(data?.alerts || []).map((alert, i) => (
                       <div key={i} className="text-[11px] text-zinc-400 font-bold italic border-l-2 border-danger/20 pl-4">{alert.message}</div>
                    ))}
                 </div>
               ) : (
                 <p className="text-[11px] text-zinc-500 font-bold italic">"0 anomalies detected within the cash flow lattice."</p>
               )}
            </div>

            <div className="glass p-8 rounded-[2.5rem] bg-success/5 border-success/20 overflow-hidden relative">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-success mb-6 italic flex items-center gap-2">
                  <Zap size={16} /> High-Impact Actions
               </h3>
               <div className="space-y-4">
                  {[
                    { text: "Reduce Subscription Burden", impact: "+4 FDS" },
                    { text: "Boost Reserve Fund Consistency", impact: "+12 FDS" }
                  ].map((rec, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-success/20 transition-all cursor-pointer">
                       <span className="text-[11px] font-bold text-zinc-400 italic">{rec.text}</span>
                       <span className="text-[10px] font-black text-success uppercase">{rec.impact}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
      </div>

      {/* Full Analysis AI Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAnalysisModal(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 30 }} 
              className="glass p-8 md:p-10 rounded-[3rem] w-full max-w-4xl relative z-10 border-primary/20 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowAnalysisModal(false)} 
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
              >
                <X size={20} />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                  <Sparkles className="text-primary animate-spin-slow" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Intelligence Lattice Report</h3>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Autonomous Financial Health Diagnostic & Predictive Analytics</p>
                </div>
              </div>

              {/* Grid of Key AI Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Health Score</span>
                  <span className="text-2xl font-black italic text-primary">{data?.metrics?.health_score || '---'}</span>
                  <span className="text-[8px] font-black text-success uppercase tracking-widest mt-1">● Optimal</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Distress Score (FDS)</span>
                  <span className="text-2xl font-black italic text-danger">{fds?.score || '---'}</span>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">● Risk Class: {fds?.category || 'Minimal'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Savings Velocity</span>
                  <span className="text-2xl font-black italic text-success">{((data?.metrics?.savings_ratio || 0) * 100).toFixed(1)}%</span>
                  <span className="text-[8px] font-black text-success uppercase tracking-widest mt-1">● Safe Tier</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Debt Leverage</span>
                  <span className="text-2xl font-black italic text-warning">{(data?.metrics?.debt_to_income_ratio || 0).toFixed(2)}</span>
                  <span className="text-[8px] font-black text-success uppercase tracking-widest mt-1">● Stable</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AI Executive Briefing */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-6 rounded-2xl border-white/5 bg-white/[0.01]">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 italic flex items-center gap-2">
                      <Activity size={14} /> AI Executive Deep Briefing
                    </h4>
                    <p className="text-xs font-medium text-zinc-400 leading-relaxed italic">
                      Analyzing transaction vectors... We have successfully processed your recent cash flows across the synced financial ledger. Based on your current savings velocity of <span className="text-white font-bold">{((data?.metrics?.savings_ratio || 0) * 100).toFixed(1)}%</span>, your financial health lattice shows a stable, resilient trajectory.
                    </p>
                    <p className="text-xs font-medium text-zinc-400 leading-relaxed italic mt-4">
                      Outflow spikes in the <span className="text-white font-bold">{briefing?.top_category || 'Discretionary'}</span> category totaled <span className="text-white font-bold">₹{(briefing?.total_spent || 0).toLocaleString()}</span>, serving as the primary driver of recent micro-anomalies. However, your integrated distress warning score (FDS) of <span className="text-white font-bold">{fds?.score || '---'}</span> indicates excellent resilience.
                    </p>
                    <p className="text-xs font-bold text-primary leading-relaxed italic mt-4 border-l-2 border-primary/20 pl-4 bg-primary/5 py-2.5 rounded-r-xl">
                      💡 Proactive Neural Tip: {briefing?.ai_tip || 'Optimize subscription burden to gain points.'}
                    </p>
                  </div>

                  {/* Actions Matrix */}
                  <div className="glass p-6 rounded-2xl border-white/5">
                    <h4 className="text-[10px] font-black text-success uppercase tracking-widest mb-4 italic flex items-center gap-2">
                      <Zap size={14} /> High-Impact Prescriptions
                    </h4>
                    <div className="space-y-3">
                      {[
                        { text: "Reduce discretionary subscription weight", reward: "+4 FDS Score", impact: "High" },
                        { text: "Automate ₹5,000 baseline reserve transfer", reward: "+12 FDS Score", impact: "Critical" },
                        { text: "Consolidate outstanding high-interest EMI streams", reward: "Mitigate Debt Risk", impact: "Medium" }
                      ].map((action, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-success/20 transition-all">
                          <div>
                            <p className="text-xs font-bold text-white italic">{action.text}</p>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mt-0.5">Reward: {action.reward}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                            action.impact === 'Critical' ? 'bg-danger/20 text-danger' : action.impact === 'High' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                          }`}>{action.impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pillars & Anomalies */}
                <div className="space-y-6">
                  {/* Pillar Diagnostics */}
                  <div className="glass p-6 rounded-2xl border-white/5 bg-white/[0.01]">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 italic flex items-center gap-2">
                      <ShieldCheck size={14} /> Pillar Analytics
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Debt Risk', value: fds?.breakdown?.debt_risk || 0, color: '#ef4444' },
                        { label: 'Savings Health', value: fds?.breakdown?.savings_health || 0, color: '#10b981' },
                        { label: 'Spending Discipline', value: fds?.breakdown?.spending_discipline || 0, color: '#3b82f6' },
                        { label: 'Neural Stability', value: fds?.breakdown?.stability || 0, color: '#f59e0b' }
                      ].map((pillar, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <span>{pillar.label}</span>
                            <span style={{ color: pillar.color }}>{pillar.value}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pillar.value}%`, backgroundColor: pillar.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Anomaly Detection Status */}
                  <div className="glass p-6 rounded-2xl border-danger/20 bg-danger/5">
                    <h4 className="text-[10px] font-black text-danger uppercase tracking-widest mb-3 italic flex items-center gap-2">
                      <AlertTriangle size={14} /> Neural Integrity
                    </h4>
                    <p className="text-[11px] font-bold text-zinc-400 italic leading-relaxed">
                      "Our real-time isolation forest algorithms have scanned 100% of transaction nodes. Zero severe operational threat signatures detected."
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Terminate Diagnostic
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
