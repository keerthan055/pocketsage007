import React, { useState } from 'react';
import { 
    BarChart3, PieChart, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, 
    Compass, MousePointer2, Calendar, BrainCircuit, ShieldAlert, Sparkles,
    History, Zap, HeartPulse, LineChart as LucideLineChart
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart as RechartsPie, Pie, Cell,
    Legend, ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';

const Insights = () => {
    const [timelineData] = useState([
        { month: 'Jan', score: 680, savings: 45000, debt: 120000 },
        { month: 'Feb', score: 695, savings: 52000, debt: 110000 },
        { month: 'Mar', score: 712, savings: 68000, debt: 95000 },
        { month: 'Apr', score: 730, savings: 85000, debt: 82000 },
    ]);

    const [behaviors] = useState([
        { type: "Weekend Spike", intensity: 85, description: "High spending detected on Saturdays (8PM-11PM).", icon: Zap, color: "warning" },
        { type: "Emotional Spend", intensity: 65, description: "Spending increases 3x on high-stress work days.", icon: HeartPulse, color: "danger" },
        { type: "Impulse Control", intensity: 31, description: "Quick unplanned Amazon purchases detected.", icon: MousePointer2, color: "primary" },
    ]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 italic tracking-tighter">
                        <BrainCircuit className="text-primary" size={36} />
                        FINANCIAL INTELLIGENCE
                    </h1>
                    <p className="text-zinc-500 mt-1 uppercase text-xs font-bold tracking-widest">Cognitive Behavioral Analysis & Progress Mapping</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Long-term Financial Health Timeline */}
                <div className="lg:col-span-3 glass p-8 rounded-[2rem] border-white/5 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter italic">Health Progress Timeline</h3>
                            <p className="text-xs text-zinc-500">Multimodal score vs asset velocity mapping</p>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-500 uppercase">Current Score</p>
                            <p className="text-2xl font-black text-white">730</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-success uppercase">Improvement</p>
                            <p className="text-2xl font-black text-success">+14 PTS</p>
                          </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="savings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={3} />
                                <Line yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#09090b' }} />
                                <Bar yAxisId="left" dataKey="debt" barSize={12} fill="rgba(239, 68, 68, 0.2)" radius={[4, 4, 0, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Behavioral Patterns Panel */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-[2rem] border-primary/20 bg-primary/5">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2 italic">
                            <Activity size={18} /> LIVE BEHAVIOR
                        </h3>
                        <div className="space-y-4">
                            {behaviors.map((b, idx) => (
                                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <b.icon size={16} className={`text-${b.color}`} />
                                            <span className="text-xs font-black uppercase text-white">{b.type}</span>
                                        </div>
                                        <span className={`text-[10px] font-black text-${b.color}`}>{b.intensity}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${b.intensity}%` }}
                                            className={`h-full bg-${b.color} opacity-80`}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-2 leading-tight font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        {b.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all rotate-12">
                          <History size={120} />
                        </div>
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Milestone Tracker</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                <span className="text-xs text-white font-bold">Goal: Japan Fund Reached (Apr)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-30"></div>
                                <span className="text-xs text-zinc-500">Goal: Car EMI Cleanup (Nov)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Intelligence Observations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-3xl border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary/10 rounded-2xl"><LucideLineChart className="text-primary" /></div>
                      <div>
                        <h4 className="font-black text-sm italic uppercase tracking-tighter">Debt Velocity</h4>
                        <p className="text-[10px] text-zinc-500 font-bold">REDUCED BY 22%</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "Keerthan, you've accelerated your debt payoff by 12 days since Jan by optimizing high-interest targets."
                    </p>
                </div>

                <div className="glass p-6 rounded-3xl border-white/5 hover:border-success/20 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-success/10 rounded-2xl"><ShieldAlert className="text-success" /></div>
                      <div>
                        <h4 className="font-black text-sm italic uppercase tracking-tighter">Risk Sensitivity</h4>
                        <p className="text-[10px] text-zinc-500 font-bold">OPTIMAL ZONE</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "Financial fraud shields are at 100%. No anomalous behavior detected in your last 42 transactions."
                    </p>
                </div>

                <div className="glass p-6 rounded-3xl border-white/5 hover:border-warning/20 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-warning/10 rounded-2xl"><Zap className="text-warning" /></div>
                      <div>
                        <h4 className="font-black text-sm italic uppercase tracking-tighter">Savings Engine</h4>
                        <p className="text-[10px] text-zinc-500 font-bold">CRUISING AT +₹15k/mo</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "Weekend spikes have been neutralized. You saved an extra ₹4.2k this month by avoiding late-night orders."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Insights;
