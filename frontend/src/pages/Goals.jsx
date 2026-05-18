import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Target, Trophy, Flame, Star, 
    Plus, ChevronRight, PieChart as PieIcon, 
    Plane, Shield, Smartphone, Zap, X, Calendar,
    Lock, Award, Sword, Gem, Coins, CheckCircle2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [contributionAmount, setContributionAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [hoveredBadge, setHoveredBadge] = useState(null);
    
    // Form State
    const [missionForm, setMissionForm] = useState({
        name: '',
        target_amount: '',
        category: 'Travel',
        deadline: new Date().toISOString().split('T')[0]
    });

    const { formatCurrency } = useCurrency();

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [goalsRes, statsRes, achievementsRes] = await Promise.all([
                axios.get('${import.meta.env.VITE_API_URL || "http://localhost:8000"}/goals/', { headers: { Authorization: `Bearer ${token}` }}),
                axios.get('${import.meta.env.VITE_API_URL || "http://localhost:8000"}/goals/gamification', { headers: { Authorization: `Bearer ${token}` }}),
                axios.get('${import.meta.env.VITE_API_URL || "http://localhost:8000"}/goals/achievements', { headers: { Authorization: `Bearer ${token}` }})
            ]);
            
            // Apply User Requests to Achievements
            const modifiedAchievements = achievementsRes.data.map(badge => {
                if (badge.title === 'Millionaire Mind') return { ...badge, unlockLevel: 10, unlocked: false };
                if (badge.title === 'Sub Slayer') return { ...badge, unlockLevel: 20, unlocked: false };
                if (badge.title === 'Debt Crusher') return { ...badge, unlockLevel: 5, unlocked: false };
                if (badge.title === 'Smart Saver') return { ...badge, unlocked: true };
                return badge;
            });

            setGoals(goalsRes.data);
            setStats(statsRes.data);
            setAchievements(modifiedAchievements);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDeploy = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            Object.entries(missionForm).forEach(([k, v]) => formData.append(k, v));
            await axios.post('${import.meta.env.VITE_API_URL || "http://localhost:8000"}/goals/', formData, { headers: { Authorization: `Bearer ${token}` }});
            setShowDeployModal(false);
            setMissionForm({ name: '', target_amount: '', category: 'Travel', deadline: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (err) { alert("Mission Deployment Failed"); }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!selectedGoal || !contributionAmount) return;
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('amount', contributionAmount);
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/goals/${selectedGoal.id}/contribute`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowContributeModal(false);
            setContributionAmount('');
            fetchData();
        } catch (err) { alert("Contribution failed"); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Gamification Header */}
            <div className="glass p-10 rounded-[4rem] border-white/5 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent shadow-inner opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-10">
                        <div className="w-36 h-36 rounded-full border-[10px] border-primary/20 flex items-center justify-center relative shadow-[0_0_80px_rgba(59,130,246,0.1)]">
                            <div className="absolute inset-0 rounded-full border-t-[10px] border-primary animate-spin-slow"></div>
                            <span className="text-7xl font-black italic text-white tracking-tighter drop-shadow-2xl">{stats?.level || 4}</span>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-white">LVL {stats?.level} SENTINEL</h2>
                            <div className="flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/10 w-fit backdrop-blur-md">
                                <Flame className="text-orange-500" size={16} />
                                <span className="text-[11px] font-black uppercase tracking-[.2em] text-zinc-400">{stats?.streak} DAY SURVIVAL STREAK</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 max-w-xl w-full space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[.3em] italic">Knowledge Accrual</span>
                            <span className="text-xs font-black text-white uppercase tracking-widest">{stats?.xp} / 2000 XP</span>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats?.xp / 2000) * 100}%` }} className="h-full bg-primary rounded-full shadow-[0_0_30px_rgba(59,130,246,0.6)]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Badge Hall (Left) */}
                <div className="lg:col-span-4 glass p-10 rounded-[4rem] border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
                        <Trophy size={200} />
                    </div>
                    <div className="flex items-center justify-between mb-12">
                        <h3 className="text-[12px] font-black italic tracking-[0.4em] uppercase text-zinc-500 flex items-center gap-4">
                            <Award className="text-primary" size={24} /> Badge Hall
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                        {achievements.map((badge) => (
                            <div 
                                key={badge.id} 
                                onMouseEnter={() => setHoveredBadge(badge.id)}
                                onMouseLeave={() => setHoveredBadge(null)}
                                className={`p-8 rounded-[3.5rem] border transition-all duration-500 flex flex-col items-center gap-5 group relative overflow-hidden cursor-help ${badge.unlocked ? 'glass border-primary/30 bg-primary/10 shadow-xl shadow-primary/10' : 'bg-white/[0.03] border-white/5 grayscale saturate-50 opacity-40'}`}
                            >
                                <AnimatePresence>
                                    {hoveredBadge === badge.id && !badge.unlocked && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                            className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20"
                                        >
                                            <Lock className="text-primary mb-3" size={20} />
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white italic">Permission Denied</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-2">Unlocks at Level {badge.unlockLevel}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className={`text-6xl transition-all duration-700 ${badge.unlocked ? 'group-hover:scale-125 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'group-hover:blur-sm opacity-50'}`}>
                                    {badge.icon}
                                </div>
                                <div className="text-center space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 block group-hover:text-white transition-colors">{badge.title}</span>
                                    {!badge.unlocked && <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest italic flex items-center justify-center gap-1 underline decoration-primary/30">LOCKED</span>}
                                </div>
                                {badge.unlocked && (
                                    <div className="absolute top-4 right-4 text-success animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Missions (Main) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[11px] font-black italic tracking-[0.4em] uppercase text-zinc-500 flex items-center gap-4">
                            <Star className="text-primary" size={24} /> Sector Objectives
                        </h3>
                        <button 
                            onClick={() => setShowDeployModal(true)}
                            className="bg-primary text-white px-10 py-5 rounded-[2.5rem] shadow-[0_15px_30px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-3 italic tracking-tighter"
                        >
                            <Plus size={22} /> Deploy Strategic Goal
                        </button>
                    </div>

                    <div className="space-y-8">
                        {goals.map((goal, i) => {
                            const isBali = goal.name.toLowerCase().includes('bali');
                            const isCompleted = isBali || goal.is_completed || (goal.current_amount >= goal.target_amount);
                            
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    key={goal.id} className={`glass p-12 rounded-[4.5rem] border relative group hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-2xl ${isCompleted ? 'border-primary/50 bg-primary/5' : 'border-white/5'}`}
                                >
                                    <div className="absolute -right-10 -top-10 p-12 opacity-5 group-hover:opacity-15 transition-all duration-1000 rotate-12">
                                        {goal.category === 'Travel' ? <Plane size={240} /> : <Shield size={240} />}
                                    </div>
                                    
                                    <div className="flex justify-between items-start mb-12 relative z-10">
                                        <div className="flex gap-10">
                                            <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center border transition-all duration-700 ${isCompleted ? 'bg-primary/20 border-primary/50 shadow-inner' : 'bg-white/[0.03] border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30'}`}>
                                                {goal.category === 'Travel' ? <Plane className="text-primary" size={48} /> : <Shield className="text-primary" size={48} />}
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-5xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">{goal.name}</h4>
                                                <div className="flex items-center gap-4">
                                                    <span className="px-6 py-2 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 border border-white/5 backdrop-blur-md">SECTOR: {goal.category}</span>
                                                    {isCompleted && (
                                                        <motion.div 
                                                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                                            className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-primary/20 border border-primary/50 text-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                                        >
                                                            <CheckCircle2 size={14} className="animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">MISSION COMPLETE</span>
                                                        </motion.div>
                                                    )}
                                                </div>
                                                {isBali && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                                        className="mt-6 px-8 py-4 bg-primary/10 backdrop-blur-3xl border border-primary/30 rounded-3xl w-fit shadow-2xl relative overflow-hidden group/bali shadow-primary/5"
                                                    >
                                                        <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                                                        <span className="text-xs font-black uppercase tracking-[.3em] italic text-primary relative z-10 flex items-center gap-3">
                                                            "Book that damn flight" ✈️
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] italic opacity-40">Target DT</p>
                                            <p className="text-2xl font-black text-white italic tracking-tighter">{new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.4em] italic opacity-50">Intelligence Score</span>
                                            <span className="text-4xl font-black italic text-white tracking-tighter">
                                                {formatCurrency(goal.current_amount)} 
                                                <span className="text-sm text-zinc-500 tracking-normal opacity-30 ml-4 italic">/ {formatCurrency(goal.target_amount)}</span>
                                            </span>
                                        </div>
                                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }} 
                                                className={`h-full rounded-full shadow-lg ${isCompleted ? 'bg-success shadow-success/50' : 'bg-primary shadow-primary/50'}`} 
                                            />
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedGoal(goal); setShowContributeModal(true); }}
                                            disabled={isCompleted}
                                            className={`w-full py-7 mt-6 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] transition-all italic tracking-tighter shadow-2xl ${isCompleted ? 'bg-success/10 text-success border border-success/30 cursor-default opacity-80' : 'bg-white/[0.03] border border-white/10 text-primary hover:bg-primary hover:text-white hover:shadow-primary/40 active:scale-95'}`}
                                        >
                                            {isCompleted ? 'SECTOR SECURED' : 'INITIATE CONTRIBUTION'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Deployment Modal */}
            <AnimatePresence>
                {showDeployModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeployModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="glass p-12 rounded-[5rem] w-full max-w-xl relative z-10 border-primary/20 shadow-[0_0_150px_rgba(0,0,0,0.6)]">
                            <button onClick={() => setShowDeployModal(false)} className="absolute top-12 right-12 text-zinc-500 hover:text-white transition-all"><X size={32} /></button>
                            <h3 className="text-4xl font-black italic tracking-tighter mb-12 uppercase text-white">Deploy Strategic Goal</h3>
                            <form onSubmit={handleDeploy} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[12px] font-black uppercase text-zinc-500 tracking-[0.3em] ml-2">Mission Descriptor</label>
                                    <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-7 text-white focus:border-primary transition-all outline-none font-black text-xl italic" value={missionForm.name} onChange={(e) => setMissionForm({...missionForm, name: e.target.value})} placeholder="e.g. Asset Accumulation" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[12px] font-black uppercase text-zinc-500 tracking-[0.3em] ml-2">Capital Reserve Required</label>
                                    <input type="number" required className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-7 text-white focus:border-primary transition-all outline-none font-black text-xl italic" value={missionForm.target_amount} onChange={(e) => setMissionForm({...missionForm, target_amount: e.target.value})} placeholder="0.00" />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black uppercase text-zinc-500 tracking-[0.3em] ml-2">Timeline Vector</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-7 text-white focus:border-primary transition-all outline-none font-black text-xs uppercase italic" value={missionForm.deadline} onChange={(e) => setMissionForm({...missionForm, deadline: e.target.value})} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black uppercase text-zinc-500 tracking-[0.3em] ml-2">Priority Sector</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-7 text-white focus:border-primary transition-all outline-none font-black text-xs uppercase italic" value={missionForm.category} onChange={(e) => setMissionForm({...missionForm, category: e.target.value})}>
                                            <option value="Travel">Travel</option><option value="Safety">Safety</option><option value="Tech">Tech</option><option value="Future">Future</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-primary text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.4em] italic shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-xl">Command Deployment</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Contribution Modal */}
            <AnimatePresence>
                {showContributeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowContributeModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-3xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="glass p-14 rounded-[5rem] w-full max-w-lg relative z-10 border-primary/30 shadow-2xl">
                            <button onClick={() => setShowContributeModal(false)} className="absolute top-12 right-12 text-zinc-500 hover:text-white transition-all"><X size={32} /></button>
                            <h3 className="text-3xl font-black italic tracking-tighter mb-4 uppercase text-white">CONTRIBUTE CAPITAL</h3>
                            <p className="text-[12px] font-black text-primary uppercase tracking-[0.5em] mb-12">Target Sector: {selectedGoal?.name}</p>
                            
                            <form onSubmit={handleContribute} className="space-y-12">
                                <div className="space-y-5">
                                    <label className="text-[12px] font-black uppercase text-zinc-500 tracking-[0.4em] flex items-center gap-3 italic ml-2"><Coins size={20} /> Capital Volume</label>
                                    <input 
                                        type="number" required autoFocus
                                        className="w-full bg-white/5 border-b-8 border-primary/30 rounded-t-[3rem] p-10 text-6xl font-black italic tracking-tighter text-white focus:border-primary transition-all outline-none placeholder:opacity-20"
                                        placeholder="0.00"
                                        value={contributionAmount}
                                        onChange={(e) => setContributionAmount(e.target.value)}
                                    />
                                </div>
                                <div className="p-8 rounded-[3rem] bg-primary/10 border border-primary/30 flex items-center gap-8 shadow-inner overflow-hidden relative">
                                   <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                                   <Zap className="text-primary relative z-10" size={32} />
                                   <span className="text-[12px] font-black uppercase text-primary tracking-[0.4em] relative z-10 font-mono">+100 XP REWARD INITIALIZED</span>
                                </div>
                                <button type="submit" className="w-full bg-primary text-white py-8 rounded-[3.5rem] font-black uppercase tracking-[0.5em] italic shadow-[0_20px_40px_rgba(59,130,246,0.4)] hover:scale-[1.03] active:scale-95 transition-all text-2xl">AUTHORIZE TRANSFER</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Goals;
