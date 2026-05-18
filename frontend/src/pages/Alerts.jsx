import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Clock, CheckCircle, Smartphone, Mail, Settings as SettingsIcon, Trash2, Info, AlertTriangle, CheckCircle2, Sparkles, Brain, ArrowRight, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Alerts = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

    const [emiAutopilot, setEmiAutopilot] = useState(() => {
        const saved = localStorage.getItem('emiAutopilot');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [anomalyDetection, setAnomalyDetection] = useState(() => {
        const saved = localStorage.getItem('anomalyDetection');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('emiAutopilot', JSON.stringify(emiAutopilot));
    }, [emiAutopilot]);

    useEffect(() => {
        localStorage.setItem('anomalyDetection', JSON.stringify(anomalyDetection));
    }, [anomalyDetection]);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/alerts/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const getSeverityStyles = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'border-danger/40 bg-danger/5 text-danger shadow-danger/5';
            case 'warning': return 'border-warning/40 bg-warning/5 text-warning shadow-warning/5';
            case 'success': return 'border-success/40 bg-success/5 text-success shadow-success/5';
            case 'info': return 'border-primary/40 bg-primary/5 text-primary shadow-primary/5';
            default: return 'border-white/10 bg-white/5 text-zinc-400';
        }
    };

    const getIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return <AlertTriangle size={20} />;
            case 'warning': return <ShieldAlert size={20} />;
            case 'success': return <CheckCircle2 size={20} />;
            default: return <Info size={20} />;
        }
    };

    const formatTimestamp = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMins = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins} mins ago`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} hours ago`;
        return date.toLocaleDateString();
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8000/alerts/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistic UI update
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
            setDismissedAlertIds(prev => [...prev, id]);
            window.dispatchEvent(new Event('alertsUpdated'));
        } catch (err) {
            console.error("Failed to mark alert as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/alerts/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistic UI update
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
            window.dispatchEvent(new Event('alertsUpdated'));
        } catch (err) {
            console.error("Failed to mark all alerts as read:", err);
        }
    };

    const getAIAnalysisForAlert = (alert) => {
        if (!alert) return null;
        
        const titleUpper = alert.title?.toUpperCase() || '';
        const msgUpper = alert.message?.toUpperCase() || '';
        
        if (titleUpper.includes('OVERSPENDING') || alert.severity?.toLowerCase() === 'critical') {
            return {
                theme: 'BUDGET OVERRUN EXPOSURE',
                risk: 'HIGH RISK',
                riskColor: 'text-danger bg-danger/10 border-danger/20',
                impact: '-12 PTS Score Drawdown',
                impactColor: 'text-danger',
                narrative: `Our deep transaction learning models detected a 45% budget overrun in the 'Dining' category relative to your median historical outflow. This exposure presents a liquidity bottleneck for upcoming fixed liabilities, specifically your next lease payment due in 12 days. Corrective reallocation is strongly advised.`,
                recommendations: [
                    'Impose a temporary daily restaurant spending cap of ₹500 for the next 7 days.',
                    'Reallocate ₹4,000 from the flexible Entertainment buffer to shore up the primary rent deposit ledger.',
                    'Enable SMS purchase-limit triggers for dining transactions.'
                ],
                telemetryLabel: 'Liquidity Margin',
                telemetryVal: '55%',
                telemetryColor: 'bg-danger'
            };
        } else if (titleUpper.includes('EMI') || titleUpper.includes('REMINDER')) {
            return {
                theme: 'LIQUIDITY BUFFER ANALYSIS',
                risk: 'MEDIUM RISK',
                riskColor: 'text-warning bg-warning/10 border-warning/20',
                impact: 'Neutral (Preserved)',
                impactColor: 'text-warning',
                narrative: `The upcoming HDFC Personal Loan EMI of ₹24,500 represents a 15.4% chunk of your forecasted liquid cash assets. While your current balance is mathematically sufficient to cover the draft, doing so leaves a narrow margin for unforeseen mid-month micro-expenses.`,
                recommendations: [
                    'Maintain a liquid floor of at least ₹10,500 post-draft to avoid triggering short-term cash flow stress.',
                    'Delay non-essential investments or major discretionary purchases until the post-draft clearance is confirmed.',
                    'Review auto-draft routing to ensure primary account receives direct deposit transfers on time.'
                ],
                telemetryLabel: 'Cash Buffer Post-Draft',
                telemetryVal: '78%',
                telemetryColor: 'bg-warning'
            };
        } else {
            return {
                theme: 'VACATION CAPITAL STRATEGY',
                risk: 'LOW RISK',
                riskColor: 'text-success bg-success/10 border-success/20',
                impact: '+8 PTS Stability Uplift',
                impactColor: 'text-success',
                narrative: `Congratulations! Your predictive savings path indicates that you have successfully reached the capital accumulation target for your Bali travel escrow. The dedicated travel sub-ledger has stabilized at 100% funding without disrupting active SIP investments or primary emergency reserve baselines.`,
                recommendations: [
                    'Lock in active travel allocations to prevent capital dilution prior to booking.',
                    'Optimize FX transaction fees by utilizing partner zero-markup international cards.',
                    'Deploy a transient ₹5,000 contingency buffer in your travel card to cover local transit adjustments.'
                ],
                telemetryLabel: 'Funding Progress',
                telemetryVal: '100%',
                telemetryColor: 'bg-success'
            };
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const unreadCount = alerts.filter(a => !a.is_read).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2">Alert Center</h1>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <p className="text-zinc-500 text-sm font-medium italic tracking-tight">Real-time proactive financial monitoring and risk detection</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="glass px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all italic border-white/5 shadow-xl"
                    >
                        <SettingsIcon size={16} /> Preferences
                    </button>
                    <button 
                        onClick={markAllAsRead}
                        className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all italic shadow-2xl shadow-primary/30"
                    >
                        Mark All as Read
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Active Alerts List */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Active Notifications</h3>
                            {unreadCount > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="bg-danger text-white text-[9px] px-3 py-1 rounded-full font-black tracking-widest shadow-lg shadow-danger/20"
                                >
                                    {unreadCount} NEW ACHIEVEMENT{unreadCount > 1 ? 'S' : ''}
                                </motion.span>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <AnimatePresence>
                            {alerts.filter(a => !dismissedAlertIds.includes(a.id)).length === 0 ? (
                                <div className="glass p-20 rounded-[3rem] text-center border-dashed border-white/10 opacity-50 italic">
                                    <Bell size={48} className="mx-auto mb-6 opacity-20" />
                                    <p className="text-sm font-black uppercase tracking-widest text-zinc-600">No Intelligence Alerts Logged</p>
                                </div>
                            ) : (
                                alerts.filter(a => !dismissedAlertIds.includes(a.id)).map((alert, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        key={alert.id} 
                                        className={`glass p-8 rounded-[2.5rem] border-l-[6px] transition-all hover:translate-x-2 group hover:shadow-2xl ${getSeverityStyles(alert.severity)}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-6">
                                                <div className={`p-4 rounded-2xl bg-white/5 shadow-inner`}>
                                                    {getIcon(alert.severity)}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-black italic tracking-tighter text-white uppercase group-hover:text-primary transition-colors">{alert.title}</h4>
                                                    <p className="text-base text-zinc-400 font-medium italic leading-relaxed">{alert.message}</p>
                                                    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
                                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-zinc-600">
                                                            <Clock size={12} /> {formatTimestamp(alert.created_at)}
                                                        </span>
                                                        <div className="flex gap-4">
                                                            <button onClick={() => markAsRead(alert.id)} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Dismiss</button>
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedAlert(alert);
                                                                    setIsAnalysisOpen(true);
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:tracking-[0.2em] transition-all flex items-center gap-2"
                                                            >
                                                                Analyze with AI <ChevronRight size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {!alert.is_read && (
                                                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"></div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar HUD */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass p-10 rounded-[3.5rem] border-white/5 shadow-2xl">
                        <h3 className="text-lg font-black italic mb-10 flex items-center gap-3 uppercase text-white tracking-tighter">
                            <ShieldAlert size={24} className="text-primary" /> Guardian Status
                        </h3>
                        <div className="space-y-10">
                            {[
                                { 
                                    label: 'EMI Autopilot', 
                                    sub: 'Checking balance before dues', 
                                    icon: Clock,
                                    enabled: emiAutopilot,
                                    toggle: () => setEmiAutopilot(!emiAutopilot)
                                },
                                { 
                                    label: 'Anomaly Detection', 
                                    sub: 'Scanning for fraud/errors', 
                                    icon: ShieldAlert,
                                    enabled: anomalyDetection,
                                    toggle: () => setAnomalyDetection(!anomalyDetection)
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black italic uppercase text-white group-hover:text-primary transition-colors">{item.label}</p>
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">{item.sub}</p>
                                    </div>
                                    <button 
                                        onClick={item.toggle}
                                        className={`w-12 h-6 rounded-full relative border transition-all cursor-pointer ${
                                            item.enabled ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'
                                        }`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${
                                            item.enabled 
                                                ? 'left-7 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                                : 'left-1 bg-zinc-600'
                                        }`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-10 rounded-[3.5rem] border-white/5 space-y-8 shadow-2xl overflow-hidden relative">
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-all">
                            <Bell size={180} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 italic">Intelligence Channels</h3>
                        <div className="space-y-5">
                            {[
                                { label: 'Email Digest', icon: Mail },
                                { label: 'Push Notifications', icon: Smartphone },
                                { label: 'WhatsApp Alerts', icon: Bell }
                            ].map((channel, i) => (
                                <div key={i} className="flex items-center gap-5 p-5 bg-white/[0.03] rounded-3xl border border-white/5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed relative overflow-hidden group">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-500 group-hover:text-primary group-hover:border-primary/30 transition-all">
                                        <channel.icon size={18} />
                                    </div>
                                    <span className="text-xs font-black uppercase italic tracking-widest text-zinc-400 group-hover:text-white transition-colors">{channel.label}</span>
                                    <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[1px] flex items-center justify-center text-[9px] font-black tracking-widest text-primary uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                        Coming Soon
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isAnalysisOpen && selectedAlert && (() => {
                    const analysis = getAIAnalysisForAlert(selectedAlert);
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="glass w-full max-w-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative"
                            >
                                <button 
                                    onClick={() => {
                                        setIsAnalysisOpen(false);
                                        setSelectedAlert(null);
                                    }}
                                    className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl bg-primary/20 text-primary">
                                        <Sparkles size={24} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                                            AI Alert Analysis
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Intelligence Insights Module</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Trigger Alert</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${selectedAlert.severity === 'critical' ? 'bg-danger/20 text-danger' : selectedAlert.severity === 'warning' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                                                {selectedAlert.severity}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm text-white uppercase italic">{selectedAlert.title}</h4>
                                        <p className="text-xs text-zinc-500 mt-1">{selectedAlert.message}</p>
                                    </div>

                                    {analysis && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Risk Assessment</span>
                                                    <p className="text-xs font-black uppercase text-white mt-1">{analysis.risk}</p>
                                                </div>
                                                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Calculated Impact</span>
                                                    <p className={`text-xs font-black uppercase mt-1 ${analysis.impactColor}`}>{analysis.impact}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Predictive Narrative</span>
                                                <p className="text-xs text-zinc-400 leading-relaxed italic bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                    "{analysis.narrative}"
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Actionable Prescriptions</span>
                                                <div className="space-y-2">
                                                    {analysis.recommendations.map((rec, i) => (
                                                        <div key={i} className="flex gap-2 items-start text-xs text-zinc-400">
                                                            <ArrowRight size={14} className="text-primary mt-0.5 shrink-0" />
                                                            <span>{rec}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    <span>{analysis.telemetryLabel}</span>
                                                    <span className="text-white">{analysis.telemetryVal}</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <div className={`h-full rounded-full ${analysis.telemetryColor}`} style={{ width: analysis.telemetryVal }}></div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button 
                                        onClick={() => {
                                            setIsAnalysisOpen(false);
                                            setSelectedAlert(null);
                                        }}
                                        className="w-full mt-4 py-3 bg-primary hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20"
                                    >
                                        Acknowledge & Sync
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};

// Internal icon for navigation
const ChevronRight = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

export default Alerts;
