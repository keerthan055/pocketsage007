import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, ArrowUpRight, ArrowDownRight, Zap, Target, 
    ShieldAlert, Sparkles, Sliders, LineChart as LucideLineChart,
    BrainCircuit, Calendar, Save, ChevronRight, X, Trash2
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const Forecast = () => {
    const [scenarios, setScenarios] = useState({
        dining: 3000,
        salary: 0,
        newEmi: 0
    });

    const [impact, setImpact] = useState({
        scoreChange: 4.5,
        savings: 18000,
        risk: 'Low',
        advice: "Reducing dining by ₹3k builds an extra ₹36k in annual wealth."
    });

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [scenarioName, setScenarioName] = useState('Dining Optimization');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [savedScenarios, setSavedScenarios] = useState(() => {
        const stored = localStorage.getItem('saved_scenarios');
        return stored ? JSON.parse(stored) : [
            {
                id: 'default-1',
                name: 'Standard Balance Plan',
                dining: 3000,
                salary: 0,
                newEmi: 0,
                scoreChange: 4.5,
                savings: 18000,
                date: 'May 18, 2026'
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('saved_scenarios', JSON.stringify(savedScenarios));
    }, [savedScenarios]);

    const handleSaveScenario = () => {
        if (!scenarioName.trim()) return;
        setIsSaving(true);

        setTimeout(() => {
            const newSaved = {
                id: Math.random().toString(36).substr(2, 9),
                name: scenarioName,
                dining: scenarios.dining,
                salary: scenarios.salary,
                newEmi: scenarios.newEmi,
                scoreChange: impact.scoreChange,
                savings: impact.savings,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
            setSavedScenarios([newSaved, ...savedScenarios]);
            setIsSaving(false);
            setSaveSuccess(true);
            
            setTimeout(() => {
                setShowSaveModal(false);
                setSaveSuccess(false);
                setScenarioName('New Scenario Plan');
            }, 1500);
        }, 1000);
    };

    const loadScenario = (saved) => {
        setScenarios({
            dining: saved.dining,
            salary: saved.salary,
            newEmi: saved.newEmi
        });
        
        setImpact({
            scoreChange: saved.scoreChange,
            savings: saved.savings,
            risk: saved.newEmi > 15000 ? 'Medium' : 'Low',
            advice: `Loaded scenario "${saved.name}". Projected net worth shift is ₹${(saved.savings * 2).toLocaleString()} annually.`
        });

        // Update chart data based on loaded scenario monthly impact
        const monthlyImpact = saved.dining + saved.salary - saved.newEmi;
        setChartData(chartData.map((d, i) => ({
            ...d,
            hypothetical: d.current + (monthlyImpact * (i + 1))
        })));
    };

    const deleteScenario = (id, e) => {
        e.stopPropagation();
        setSavedScenarios(savedScenarios.filter(s => s.id !== id));
    };

    const [chartData, setChartData] = useState([
        { month: 'Oct', current: 120000, hypothetical: 120000 },
        { month: 'Nov', current: 135000, hypothetical: 138000 },
        { month: 'Dec', current: 150000, hypothetical: 156000 },
        { month: 'Jan', current: 168000, hypothetical: 178000 },
        { month: 'Feb', current: 185000, hypothetical: 198000 },
        { month: 'Mar', current: 210000, hypothetical: 228000 },
    ]);

    const handleSliderChange = (key, value) => {
        const newScenarios = { ...scenarios, [key]: value };
        setScenarios(newScenarios);
        
        // Instant simulation logic
        const scoreChange = (newScenarios.dining / 1000) * 1.5 + (newScenarios.salary / 5000) * 3 - (newScenarios.newEmi / 5000) * 4;
        const monthlyImpact = newScenarios.dining + newScenarios.salary - newScenarios.newEmi;
        
        setImpact({
            scoreChange: Number(scoreChange.toFixed(1)),
            savings: monthlyImpact * 6,
            risk: newScenarios.newEmi > 15000 ? 'Medium' : 'Low',
            advice: `By adjusting these values, you'll see a ₹${(monthlyImpact * 12).toLocaleString()} shift in annual net worth.`
        });

        // Update hypothetical chart path
        setChartData(chartData.map((d, i) => ({
            ...d,
            hypothetical: d.current + (monthlyImpact * (i + 1))
        })));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 italic tracking-tighter">
                        <LineChart className="text-primary" size={36} />
                        PREDICTIVE SIMULATOR
                    </h1>
                    <p className="text-zinc-500 mt-1 uppercase text-xs font-bold tracking-widest">AI-Driven what-if financial projection engine</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSaveModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg shadow-primary/20 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save size={16} /> Save Scenario
                  </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Control Scenarios Sidebar */}
                <div className="space-y-6">
                    <div className="glass p-8 rounded-[2.5rem] border-primary/20 bg-primary/5">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2 italic">
                            <Sliders size={18} /> SCENARIO INPUTS
                        </h3>
                        
                        <div className="space-y-10">
                            {/* Dining Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Reduce Dining</span>
                                    <span className="text-sm font-black text-white">₹{scenarios.dining}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="15000" step="500"
                                    value={scenarios.dining}
                                    onChange={(e) => handleSliderChange('dining', Number(e.target.value))}
                                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" 
                                />
                            </div>

                            {/* Salary Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Salary Shift</span>
                                    <span className={`text-sm font-black ${scenarios.salary >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {scenarios.salary >= 0 ? '+' : ''}₹{scenarios.salary}
                                    </span>
                                </div>
                                <input 
                                    type="range" min="-30000" max="50000" step="1000"
                                    value={scenarios.salary}
                                    onChange={(e) => handleSliderChange('salary', Number(e.target.value))}
                                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-success" 
                                />
                            </div>

                            {/* New EMI Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Add New EMI</span>
                                    <span className="text-sm font-black text-danger">₹{scenarios.newEmi}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="40000" step="1000"
                                    value={scenarios.newEmi}
                                    onChange={(e) => handleSliderChange('newEmi', Number(e.target.value))}
                                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-danger" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2rem] border-white/5 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group hover:bg-primary transition-all duration-500">
                          <BrainCircuit className="text-zinc-500 group-hover:text-white" size={28} />
                        </div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 italic">Predictive Logic Confidence</h4>
                        <div className="text-2xl font-black text-white italic">94.2%</div>
                    </div>
                </div>

                {/* Main Forecast Visualization */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-lg font-black italic uppercase tracking-tighter">6-MONTH WEALTH PROJECTION</h3>
                                <div className="flex gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full border-2 border-primary border-dashed"></div>
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base Path</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Simulated Path</span>
                                  </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-500 uppercase">Impact on Score</p>
                                <motion.p 
                                    key={impact.scoreChange}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`text-2xl font-black italic ${impact.scoreChange >= 0 ? 'text-success' : 'text-danger'}`}
                                >
                                    {impact.scoreChange >= 0 ? '+' : ''}{impact.scoreChange} PTS
                                </motion.p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPath" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="current" stroke="#52525b" strokeDasharray="5 5" fill="transparent" strokeWidth={1} />
                                    <Area type="monotone" dataKey="hypothetical" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPath)" strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="glass p-6 rounded-3xl border-success/20 bg-success/5">
                            <div className="flex justify-between items-start mb-4">
                                <ShieldAlert className="text-success" size={20} />
                                <span className="text-[10px] font-black text-success uppercase tracking-widest">STABILITY</span>
                            </div>
                            <h4 className="text-xl font-black text-white italic tracking-tighter mb-2">SAFE ZONE</h4>
                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Your simulated decisions keep you well within the 90-day liquidity buffer.</p>
                        </div>

                        <div className="glass p-6 rounded-3xl border-primary/20 bg-primary/5">
                            <div className="flex justify-between items-start mb-4">
                                <Target className="text-primary" size={20} />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">SAVINGS IMPACT</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-xl font-black text-white">₹{impact.savings.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-zinc-500">6 MO</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Cumulative wealth gain compared to your current path.</p>
                        </div>

                        <div className="glass p-6 rounded-3xl group">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-tighter">
                              <Sparkles size={14} className="text-primary" /> Sage Opinion
                            </h4>
                            <p className="text-[11px] text-zinc-400 italic leading-relaxed font-bold">
                                "{impact.advice}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Scenarios Grid */}
            {savedScenarios.length > 0 && (
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 italic">
                        <Save size={16} className="text-primary" /> Synced Predictive Scenarios
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedScenarios.map((saved) => (
                            <div 
                                key={saved.id}
                                onClick={() => loadScenario(saved)}
                                className="glass p-6 rounded-3xl border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-primary/5 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">{saved.name}</h4>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">{saved.date}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteScenario(saved.id, e)}
                                        className="text-zinc-600 hover:text-danger p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-3 rounded-2xl bg-white/5 flex flex-col">
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Score Delta</span>
                                        <span className={`text-sm font-black italic mt-1 ${saved.scoreChange >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {saved.scoreChange >= 0 ? '+' : ''}{saved.scoreChange} PTS
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/5 flex flex-col">
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">6M Savings</span>
                                        <span className="text-sm font-black italic text-success mt-1">
                                            ₹{saved.savings.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[8px] font-black uppercase text-zinc-500 tracking-wider">
                                    <span>Outflow reductions: ₹{saved.dining}</span>
                                    <span className="text-primary group-hover:underline">Load Scenario →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Save Scenario Modal */}
            <AnimatePresence>
                {showSaveModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowSaveModal(false)} 
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                            className="glass p-10 rounded-[3rem] w-full max-w-md relative z-10 border-primary/20 shadow-2xl overflow-hidden"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setShowSaveModal(false)} 
                                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>

                            {saveSuccess ? (
                                <div className="text-center py-8 space-y-4 animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success animate-bounce">
                                        <Save size={28} />
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-success">Lattice Updated</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">Your custom predictive scenario has been synced and archived.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <BrainCircuit className="text-primary animate-pulse" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">Save Simulator Path</h3>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Commit projections to machine learning nodes</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-6">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Scenario Identifier</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary/50 transition-all outline-none italic font-bold"
                                            placeholder="e.g. Budget Optimization 2026"
                                            value={scenarioName}
                                            onChange={(e) => setScenarioName(e.target.value)}
                                        />
                                    </div>

                                    {/* Projection Summary Card */}
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Projection Vector Summary</span>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase">Score Impact</span>
                                                <p className={`text-lg font-black italic mt-0.5 ${impact.scoreChange >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {impact.scoreChange >= 0 ? '+' : ''}{impact.scoreChange} PTS
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase">6M Wealth Accumulation</span>
                                                <p className="text-lg font-black italic text-success mt-0.5">
                                                    ₹{impact.savings.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-white/5 text-[9px] text-zinc-400 italic leading-relaxed">
                                            "Reducing dining by ₹{scenarios.dining} adds ₹{scenarios.dining * 6} cumulative volume."
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSaveScenario}
                                        disabled={isSaving || !scenarioName.trim()}
                                        className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Syncing Matrix...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} /> Commit Scenario
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Forecast;
