import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';
import { TrendingUp, PieChart, Wallet, ArrowUpRight, BarChart, Plus, Globe, Star, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Investments = () => {
    const { currentCurrency, formatCurrency } = useCurrency();
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputCurrency, setInputCurrency] = useState('USD');

    useEffect(() => {
        if (isModalOpen) {
            setInputCurrency(currentCurrency?.code || 'USD');
        }
    }, [isModalOpen, currentCurrency]);

    const [formData, setFormData] = useState({
        asset_name: '',
        asset_type: 'Stock',
        quantity: '',
        buy_price: '',
        current_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        risk_level: 'Medium',
        notes: ''
    });

    const fetchPortfolio = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8000/investments/portfolio', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBuyAsset = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            
            // Convert to base USD if inputted in target currency
            let buyPriceUSD = parseFloat(formData.buy_price);
            let currentPriceUSD = parseFloat(formData.current_price);
            if (inputCurrency === currentCurrency?.code && currentCurrency?.rate && currentCurrency.rate !== 1) {
                buyPriceUSD = buyPriceUSD / currentCurrency.rate;
                currentPriceUSD = currentPriceUSD / currentCurrency.rate;
            }

            const payload = {
                ...formData,
                quantity: parseFloat(formData.quantity),
                buy_price: buyPriceUSD,
                current_price: currentPriceUSD
            };
            const res = await axios.post('http://localhost:8000/investments/add', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Auto update dashboard data
            setDashData(res.data);
            setIsModalOpen(false);
            // Reset form
            setFormData({
                asset_name: '', asset_type: 'Stock', quantity: '', buy_price: '',
                current_price: '', purchase_date: new Date().toISOString().split('T')[0],
                risk_level: 'Medium', notes: ''
            });
        } catch (err) {
            console.error(err);
            alert("Error adding asset.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalNetWorth = dashData?.summary?.net_worth || 0;
    const monthlyGrowth = dashData?.summary?.monthly_growth || 0;
    const monthlyGrowthPct = dashData?.summary?.monthly_growth_percent || 0;
    const allocation = dashData?.allocation || [];
    const portfolio = dashData?.portfolio || [];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <TrendingUp className="text-primary" size={32} />
                        Wealth Portfolio
                    </h1>
                    <p className="text-zinc-500 mt-1">Multi-asset tracking and portfolio performance analysis</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={18} /> Buy Asset
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Portfolio Value Summary */}
                <div className="lg:col-span-2 glass p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Total Net Worth</span>
                            <h2 className="text-5xl font-black mt-2">{formatCurrency(totalNetWorth)}</h2>
                            <p className="text-sm text-success font-bold mt-2 flex items-center gap-1">
                                <ArrowUpRight size={16} /> +{formatCurrency(monthlyGrowth)} ({monthlyGrowthPct}%) This Month
                            </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setIsMarketOpen(true)} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-all"><Globe size={18} /></button>
                          <button onClick={() => setIsAnalyticsOpen(true)} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-all"><BarChart size={18} /></button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Asset Allocation</h3>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex p-0.5 border border-white/5">
                            {allocation.map((alloc, idx) => (
                                <div key={idx} className={`h-full opacity-90 ${idx === 0 ? 'rounded-l-full' : ''} ${idx === allocation.length - 1 ? 'rounded-r-full' : ''}`} style={{ width: `${alloc.percentage}%`, backgroundColor: alloc.color }}></div>
                            ))}
                            {allocation.length === 0 && <div className="h-full bg-white/10 rounded-full" style={{ width: '100%' }}></div>}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {allocation.map((alloc, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alloc.color }}></div> {alloc.type} ({alloc.percentage}%)
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Investment Suggestions */}
                <div className="glass p-6 rounded-3xl border-primary/10 flex flex-col">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm mb-6">
                        <Star size={18} fill="currentColor" /> Sage Alpha Picks
                    </div>
                    <div className="space-y-4 flex-1">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all cursor-pointer">
                            <h4 className="font-bold text-sm">HDFC Infrastructure Fund</h4>
                            <p className="text-[10px] text-zinc-500 mt-1">Bullish on long-term infra recovery. Expected ROI: 14%.</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all cursor-pointer">
                            <h4 className="font-bold text-sm">Solar Energy ETF</h4>
                            <p className="text-[10px] text-zinc-500 mt-1">High growth potential in green energy sector.</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReportOpen(true)} className="w-full mt-6 py-3 border border-primary/20 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-all uppercase tracking-widest">View Full Report</button>
                </div>
            </div>

            {/* Asset Table */}
            <div className="glass overflow-hidden rounded-3xl border-white/5">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                            <th className="px-8 py-4">Asset</th>
                            <th className="px-8 py-4">Allocation</th>
                            <th className="px-8 py-4">Price / Unit</th>
                            <th className="px-8 py-4 text-right">Market Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {portfolio.length > 0 ? portfolio.map((item) => {
                            const marketValue = item.quantity * item.current_price;
                            const totalInv = dashData.summary.total_investment_value;
                            const allocPct = totalInv > 0 ? ((marketValue / totalInv) * 100).toFixed(1) : 0;
                            const profit = marketValue - (item.quantity * item.buy_price);
                            const profitPct = ((profit / (item.quantity * item.buy_price)) * 100).toFixed(1);

                            return (
                                <tr key={item.id} className="group hover:bg-white/5 transition-all cursor-pointer">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-white transition-all uppercase">{item.asset_type[0]}</div>
                                            <div>
                                                <p className="font-bold text-sm">{item.asset_name}</p>
                                                <p className="text-[10px] text-zinc-500">{item.asset_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-medium">{allocPct}%</span>
                                    </td>
                                    <td className="px-8 py-5 font-mono text-xs">
                                        <span className={profit >= 0 ? 'text-success' : 'text-danger'}>{profit >= 0 ? '+' : ''}{profitPct}%</span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-sm">
                                        {formatCurrency(marketValue)}
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan="4" className="px-8 py-8 text-center text-zinc-500 text-sm">No assets in portfolio.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Buy Asset Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="glass w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold mb-1">Add Investment</h3>
                            <p className="text-xs text-zinc-400 mb-6 tracking-wide">Record a new asset in your portfolio.</p>

                            <form onSubmit={handleBuyAsset} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Name</label>
                                    <input required type="text" name="asset_name" value={formData.asset_name} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Apple, Bitcoin" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Type</label>
                                        <select required name="asset_type" value={formData.asset_type} onChange={handleInputChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:outline-none focus:border-primary transition-colors text-white">
                                            <option>Stock</option>
                                            <option>ETF</option>
                                            <option>Crypto</option>
                                            <option>Mutual Fund</option>
                                            <option>Gold</option>
                                            <option>SIP</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quantity</label>
                                        <input required type="number" step="any" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                    </div>
                                </div>

                                {/* Currency Selection Control */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Input Currency</span>
                                        {currentCurrency?.code && currentCurrency.code !== 'USD' && (
                                            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 text-[9px] font-black">
                                                <button 
                                                    type="button"
                                                    onClick={() => setInputCurrency('USD')}
                                                    className={`px-3 py-1 rounded-md transition-all ${inputCurrency === 'USD' ? 'bg-primary text-white shadow shadow-primary/20' : 'text-zinc-400 hover:text-white'}`}
                                                >
                                                    USD ($)
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setInputCurrency(currentCurrency.code)}
                                                    className={`px-3 py-1 rounded-md transition-all ${inputCurrency === currentCurrency.code ? 'bg-primary text-white shadow shadow-primary/20' : 'text-zinc-400 hover:text-white'}`}
                                                >
                                                    {currentCurrency.code} ({currentCurrency.symbol})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            Buy Price ({inputCurrency === 'USD' ? '$' : currentCurrency?.symbol})
                                        </label>
                                        <input required type="number" step="any" name="buy_price" value={formData.buy_price} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            Current Price ({inputCurrency === 'USD' ? '$' : currentCurrency?.symbol})
                                        </label>
                                        <input required type="number" step="any" name="current_price" value={formData.current_price} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Purchase Date</label>
                                    <input required type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:outline-none focus:border-primary transition-colors text-white [color-scheme:dark]" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold transition-all flex items-center justify-center shadow-lg shadow-primary/20 text-sm"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Add Asset'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
                
                {isReportOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="glass w-full max-w-2xl p-8 rounded-3xl border border-white/10 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsReportOpen(false)}
                                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-primary/20 text-primary">
                                    <Star size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">AI Given Alpha Report</h3>
                                    <p className="text-xs text-zinc-400 tracking-wide mt-1">Full proxy suggestions generated by PocketSage AI.</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/40 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-primary">HDFC Infrastructure Fund</h4>
                                        <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-1 rounded-full">ROI: 14%</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed">The AI expects significant structural expenditure over the next 3 quarters natively triggering an uptrend in heavy industrial assets and building supplies.</p>
                                </div>

                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/40 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-primary">Solar Energy ETF</h4>
                                        <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-1 rounded-full">ROI: 18%</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Global solar output incentives currently point toward unprecedented growth. Algorithmic sentiment analysis across global news networks indicates a 92% bullish narrative.</p>
                                </div>
                                
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/40 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-primary">Tech Sector S&P 500</h4>
                                        <span className="text-[10px] font-bold bg-warning/20 text-warning px-2 py-1 rounded-full">ROI: 6-8%</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Our models indicate a medium risk of tech sector consolidation. We suggest holding tech allocations rather than increasing risk exposure until Q4 earnings reports clarify spending caps.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Global Markets Modal */}
                {isMarketOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="glass w-full max-w-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsMarketOpen(false)}
                                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-primary/20 text-primary">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Global Market Indices</h3>
                                    <p className="text-xs text-zinc-400 tracking-wide mt-1">Real-time overview of major global markets.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm">S&P 500</h4>
                                        <p className="text-xs text-zinc-500">United States</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-bold">5,204.34</p>
                                        <p className="text-[10px] text-success font-bold">+1.24%</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm">NIFTY 50</h4>
                                        <p className="text-xs text-zinc-500">India</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-bold">22,336.40</p>
                                        <p className="text-[10px] text-success font-bold">+0.85%</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm">FTSE 100</h4>
                                        <p className="text-xs text-zinc-500">United Kingdom</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-bold">7,895.10</p>
                                        <p className="text-[10px] text-danger font-bold">-0.34%</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Performance Analytics Modal */}
                {isAnalyticsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="glass w-full max-w-2xl p-8 rounded-3xl border border-white/10 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsAnalyticsOpen(false)}
                                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 rounded-xl bg-primary/20 text-primary">
                                    <BarChart size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Performance Analytics</h3>
                                    <p className="text-xs text-zinc-400 tracking-wide mt-1">Detailed portfolio growth and trend analysis.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Return</p>
                                    <p className="text-lg font-black text-success">+{monthlyGrowthPct}%</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Volatility</p>
                                    <p className="text-lg font-black text-warning">Medium</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Max Drawdown</p>
                                    <p className="text-lg font-black text-danger">-4.2%</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Sharpe Ratio</p>
                                    <p className="text-lg font-black text-primary">1.8</p>
                                </div>
                            </div>

                            <div className="h-48 flex items-end justify-between gap-2 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                {[40, 60, 45, 80, 50, 90, 75, 110, 95, 120, 105, 140].map((height, i) => (
                                    <div key={i} className="w-full bg-primary/20 rounded-t-sm hover:bg-primary transition-colors relative group" style={{ height: `${(height/140)*100}%` }}>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {height}K
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Investments;
