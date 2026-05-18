import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Send, Brain, Sparkles, MessageSquare, History, 
    ShieldCheck, Zap, Activity, ChevronRight, 
    RotateCcw, Info, Terminal, TrendingUp, X, Clock,
    ChevronLeft, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AICopilot = () => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', text: 'Neural Uplink Established. Hello Keerthan! I am Sage, your AI Financial Intelligence companion. I have complete visibility into your transaction history and risk pillars. How can I assist your financial growth today?' }
    ]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const scrollRef = useRef(null);

    // Mock Session Database
    const [historySessions, setHistorySessions] = useState([
        { 
            id: 101, title: 'Shopping Vector Analysis', date: 'Today, 11:20 AM', icon: Zap,
            msgs: [
                { id: 1, role: 'user', text: 'Analyze my shopping spend for the last 30 days.' },
                { id: 2, role: 'bot', text: 'Performing deep scan... Your shopping outflow is ₹12,450. You spent 42% on electronics and 30% on apparel. I recommend a temporary freeze on non-essential sectors.' }
            ]
        },
        { 
            id: 102, title: 'FDS Stability Audit', date: 'Yesterday', icon: ShieldCheck,
            msgs: [
                { id: 1, role: 'user', text: 'Is my FDS score stable?' },
                { id: 2, role: 'bot', text: 'Neural Audit Complete. Your FDS is 84/100. Stability is High. Your savings velocity is offsetting your debt risk perfectly.' }
            ]
        },
        { 
            id: 103, title: 'Entertainment Spend Filter', date: '15 May 2026', icon: Activity,
            msgs: [
                { id: 1, role: 'user', text: 'How much did I spend on movies?' },
                { id: 2, role: 'bot', text: 'Vector locked. You spent ₹2,400 on entertainment this month. This is 12% below your assigned safety buffer.' }
            ]
        }
    ]);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/copilot/status`);
                setStatus(response.data);
            } catch (err) { console.error(err); }
        };
        fetchStatus();
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSessionClick = (session) => {
        setMessages(session.msgs);
        setShowHistory(false);
        // Small delay to simulate neural loading
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
        }, 800);
    };

    const handleClearHistory = () => {
        if (window.confirm("Purge all Neural Archives? This action cannot be undone.")) {
            setHistorySessions([]);
            setMessages([{ id: 1, role: 'bot', text: 'Neural archives purged. Awaiting new intelligence mission.' }]);
            setShowHistory(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const queryText = input.trim();
        if (!queryText || isTyping) return;

        const userMsg = { id: Date.now(), role: 'user', text: queryText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/copilot/query`, 
                { text: queryText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const botMsg = { id: Date.now() + 1, role: 'bot', text: response.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: 'Neural sync failure. Re-establishing link...' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in duration-700 relative overflow-hidden">
            {/* History Slide-out Panel */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md z-40"
                        />
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="absolute top-0 right-0 w-[420px] h-full glass border-l border-white/10 z-50 p-12 flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="flex items-center justify-between mb-14">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                        <History className="text-primary" size={26} />
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Neural Archives</h3>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                                {historySessions.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Trash2 className="mx-auto text-zinc-800 mb-6" size={48} />
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-600 italic">No Archival Records Found</p>
                                    </div>
                                ) : (
                                    historySessions.map((session) => (
                                        <motion.div 
                                            key={session.id} 
                                            whileHover={{ scale: 1.02, x: -5 }}
                                            onClick={() => handleSessionClick(session)}
                                            className="p-8 rounded-[2.5rem] glass border-white/5 hover:border-primary/40 transition-all cursor-pointer group bg-white/[0.03] active:scale-95"
                                        >
                                            <div className="flex gap-6 items-center">
                                                <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 text-zinc-500 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500">
                                                    <session.icon size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-black italic uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">{session.title}</h4>
                                                    <div className="flex items-center gap-3 mt-2 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                        <Clock size={12} />
                                                        <span className="text-[11px] font-bold uppercase tracking-tight">{session.date}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-zinc-800 group-hover:text-primary transition-all" size={20} />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/10">
                                <button 
                                    onClick={handleClearHistory}
                                    disabled={historySessions.length === 0}
                                    className="w-full p-8 rounded-[2.5rem] bg-danger/5 border border-danger/10 text-danger/50 text-xs font-black uppercase tracking-[0.3em] hover:bg-danger/10 hover:text-danger hover:border-danger/30 disabled:opacity-30 disabled:pointer-events-none transition-all italic flex items-center justify-center gap-4"
                                >
                                    <Trash2 size={18} />
                                    CLEAR NEURAL HISTORY
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Intelligence HUB */}
            <div className={`flex-1 flex flex-col glass rounded-[4.5rem] border-white/5 overflow-hidden bg-white/[0.01] shadow-2xl transition-all duration-700 ${showHistory ? 'opacity-20 blur-xl scale-95' : ''}`}>
                {/* Sage Brain Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 relative group">
                            <Brain className="text-primary group-hover:scale-110 transition-transform" size={32} />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-4 border-[#0a0a0a]"></div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">SAGE AI CORE</h2>
                            <div className="flex items-center gap-2">
                                <Terminal className="text-primary" size={14} />
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic tracking-widest">DATA-DRIVEN INTELLIGENCE ACTIVE</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowHistory(true)}
                            className="p-5 rounded-[1.5rem] glass border-white/5 text-zinc-500 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition-all shadow-xl"
                        >
                            <History size={28} />
                        </button>
                        <button onClick={() => setMessages([{ id: Date.now(), role: 'bot', text: 'Neural buffer purged. Awaiting next intelligence mission.' }])} className="p-5 rounded-[1.5rem] glass border-white/5 text-zinc-500 hover:text-white transition-all"><RotateCcw size={28} /></button>
                    </div>
                </div>

                {/* Response Stream */}
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                    {messages.map((msg) => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`p-12 rounded-[4rem] text-base font-medium leading-relaxed italic border ${msg.role === 'user' ? 'bg-primary/10 text-white border-primary/20 rounded-tr-none max-w-[80%] shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 'glass text-zinc-300 border-white/10 rounded-tl-none max-w-[80%]'}`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="glass p-10 rounded-[3rem] border-white/10 italic text-[11px] font-black text-primary animate-pulse tracking-[0.5em] flex items-center gap-4">
                               SAGE IS ANALYISING...
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Intelligence Input Area */}
                <div className="p-10 border-t border-white/5 bg-white/[0.02]">
                    <form onSubmit={handleSendMessage} className="flex gap-6 items-center">
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-[4rem] p-10 text-white focus:border-primary/50 transition-all outline-none italic font-bold text-xl"
                                placeholder="Command Sage anything..."
                                value={input}
                                autoFocus
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 p-4 text-primary hover:scale-125 transition-all">
                                <Send size={38} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Neural Dashboard (Right Sidebar) */}
            <div className={`w-[360px] space-y-8 hidden 2xl:flex flex-col transition-all duration-700 ${showHistory ? 'opacity-20 blur-md pointer-events-none' : ''}`}>
                <div className="glass p-12 rounded-[4.5rem] border-white/5 space-y-12 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Core Status</h3>
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    </div>
                    <div className="space-y-12">
                        {[
                            { label: 'Neural Sync', value: 'OPTIMAL', color: 'primary', icon: Activity },
                            { label: 'Latency', value: '32ms', color: 'primary', icon: Zap },
                            { label: 'Security', value: 'AES-512', color: 'success', icon: ShieldCheck }
                        ].map((stat, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <stat.icon size={22} className={`text-${stat.color}`} />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 italic group-hover:text-zinc-300 transition-all">{stat.label}</span>
                                </div>
                                <span className={`text-[12px] font-black italic tracking-tighter ${stat.color === 'success' ? 'text-success' : 'text-primary'}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass p-12 rounded-[4.5rem] border-primary/20 bg-primary/5 flex-1 relative overflow-hidden group shadow-2xl">
                    <Sparkles className="absolute top-10 right-10 text-primary opacity-20 group-hover:opacity-50 transition-all duration-700" size={56} />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic mb-12">Sage Active Insight</h3>
                    <p className="text-lg font-bold text-zinc-300 italic leading-relaxed">
                        "{status?.active_insight || 'Predictive analysis suggests a spike in discretionary vectors. Recommendation: Monitor your shopping totals today.'}"
                    </p>
                    <div className="mt-14 pt-14 border-t border-primary/10 flex justify-between items-center">
                        <button className="text-[12px] font-black uppercase tracking-[0.4em] text-primary hover:tracking-[0.5em] transition-all italic flex items-center gap-3">
                           Deep Scan <ChevronRight size={18} />
                        </button>
                        <Info size={18} className="text-zinc-600" />
                    </div>
                </div>

                <div className="glass p-10 rounded-[3.5rem] border-white/5 flex flex-col items-center gap-6 text-center shadow-xl">
                    <TrendingUp className="text-primary opacity-50" size={38} />
                    <p className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] italic">Dynamic Wealth IQ</p>
                    <p className="text-sm font-bold text-zinc-400 italic">Analyzing 50+ data points per query.</p>
                </div>
            </div>
        </div>
    );
};

export default AICopilot;
