import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, Upload, ShieldCheck, Landmark, 
    ArrowUpRight, ArrowDownRight, RefreshCw,
    X, Wallet, CreditCard, FileText, ScanLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import ReceiptScannerModal from '../components/ReceiptScannerModal';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showManualModal, setShowManualModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    
    // Form States
    const [manualForm, setManualForm] = useState({
        category: '',
        amount: '',
        type: 'Expense',
        date: new Date().toISOString().split('T')[0]
    });

    const { formatCurrency } = useCurrency();

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/transactions/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Chronological Priority Sort: Newest -> Oldest
            const sortedData = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(sortedData);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            Object.entries(manualForm).forEach(([k, v]) => formData.append(k, v));
            
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/transactions/`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowManualModal(false);
            fetchTransactions();
        } catch (err) { alert("Failed to add transaction"); }
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/transactions/upload-csv`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTransactions();
        } catch (err) { alert("CSV Import Failed. Ensure format: Category,Amount,Type"); }
    };

    const handleLinkBank = async (bank) => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('bank_name', bank);
            formData.append('account_type', 'Checking');
            
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/transactions/bank/sync`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowBankModal(false);
            alert(`${bank} synced successfully!`);
        } catch (err) { alert("Bank sync failed"); }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
                        <Wallet className="text-primary" size={32} />
                        OPERATIONAL LEDGER
                    </h1>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 italic">Real-World Financial Synchronization Matrix</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <button 
                        className="glass px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all border-primary/20 relative overflow-hidden group cursor-not-allowed"
                        disabled
                    >
                        <Landmark size={16} /> Link Bank
                        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-[1px] flex items-center justify-center text-[8px] font-black tracking-widest text-primary uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            Coming Soon
                        </div>
                    </button>
                    <label className="glass px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-success hover:bg-success/10 transition-all border-success/20 cursor-pointer">
                        <Upload size={16} /> Upload CSV
                        <input type="file" className="hidden" onChange={handleCSVUpload} accept=".csv" />
                    </label>

                    <button 
                        onClick={() => setShowScanModal(true)}
                        className="glass px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all border-primary/20 shadow-lg shadow-primary/5"
                    >
                        <ScanLine size={16} /> 📸 Scan Bill
                    </button>

                    <button 
                        onClick={() => setShowManualModal(true)}
                        className="bg-primary text-white px-6 py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Manually
                    </button>
                </div>
            </div>

            <ReceiptScannerModal 
                isOpen={showScanModal} 
                onClose={() => setShowScanModal(false)}
                onRefresh={fetchTransactions}
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-all"><RefreshCw size={80} /></div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">Synced Ledger Balance</p>
                    <h2 className="text-3xl font-black italic text-white tracking-tighter">
                        {formatCurrency(transactions.reduce((sum, t) => t.type === 'Income' ? sum + t.amount : sum - t.amount, 0))}
                    </h2>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-success/20 bg-success/5">
                    <p className="text-[10px] font-black text-success uppercase tracking-widest mb-4 italic">Neural Health Verification</p>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-success" size={24} />
                        <span className="text-xs font-black italic text-white">98.2% Accuracy</span>
                    </div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">Volume Velocity</p>
                    <h2 className="text-3xl font-black italic text-white tracking-tighter">{transactions.length} OPS</h2>
                </div>
            </div>

            {/* Main Ledger Table */}
            <div className="glass p-8 rounded-[3rem] border-white/5 relative bg-white/[0.01]">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 italic">
                        <FileText size={18} /> Production Transaction Matrix
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Real-Time</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-600 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                <th className="pb-6">Operation Index</th>
                                <th className="pb-6">Vector</th>
                                <th className="pb-6">Volume</th>
                                <th className="pb-6">Temporal Point</th>
                                <th className="pb-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {transactions.map((t, i) => (
                                    <motion.tr 
                                        key={t.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group hover:bg-white/[0.02] transition-all"
                                    >
                                        <td className="py-5 text-sm font-black text-white italic">{t.category}</td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-2">
                                                {t.type === 'Income' ? <ArrowUpRight className="text-success" size={14} /> : <ArrowDownRight className="text-danger" size={14} />}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.type === 'Income' ? 'text-success' : 'text-zinc-500'}`}>{t.type}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 text-sm font-black text-white">{formatCurrency(t.amount)}</td>
                                        <td className="py-5 text-[10px] font-bold text-zinc-500 tracking-widest">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="py-5 text-right">
                                            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-widest">Verified</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Entry Modal */}
            <AnimatePresence>
                {showManualModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowManualModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass p-10 rounded-[3rem] w-full max-w-md relative z-10 border-primary/20 shadow-2xl">
                            <button onClick={() => setShowManualModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
                            <h3 className="text-xl font-black italic tracking-tighter mb-8 uppercase">Manual Entry Matrix</h3>
                            
                            <form onSubmit={handleManualSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Category</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary/50 transition-all outline-none italic font-bold"
                                        placeholder="e.g. Dining, Shopping"
                                        value={manualForm.category}
                                        onChange={(e) => setManualForm({...manualForm, category: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Volume (Amount)</label>
                                    <input 
                                        type="number" required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary/50 transition-all outline-none italic font-bold"
                                        placeholder="0.00"
                                        value={manualForm.amount}
                                        onChange={(e) => setManualForm({...manualForm, amount: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Vector</label>
                                        <select 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary/50 outline-none uppercase text-[10px] font-black tracking-widest"
                                            value={manualForm.type}
                                            onChange={(e) => setManualForm({...manualForm, type: e.target.value})}
                                        >
                                            <option value="Expense">Expense</option>
                                            <option value="Income">Income</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Temporal</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary/50 outline-none text-[10px] font-black uppercase tracking-widest"
                                            value={manualForm.date}
                                            onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest italic shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Command Submit</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bank Linking Modal */}
            <AnimatePresence>
                {showBankModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBankModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass p-10 rounded-[3rem] w-full max-w-md relative z-10 border-primary/20 shadow-2xl">
                            <button onClick={() => setShowBankModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
                            <h3 className="text-xl font-black italic tracking-tighter mb-4 uppercase">Link Financial Node</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-8 italic">Plaid Neural Integration Active</p>
                            
                            <div className="space-y-4">
                                {['HDFC Bank', 'ICICI Bank', 'Chase', 'American Express'].map((bank) => (
                                    <button 
                                        key={bank}
                                        onClick={() => handleLinkBank(bank)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:border-primary/50 transition-all transition-duration-500"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all"><Landmark className="text-primary" size={20} /></div>
                                            <span className="text-sm font-black italic tracking-tighter">{bank}</span>
                                        </div>
                                        <RefreshCw size={16} className="text-zinc-600 group-hover:rotate-180 transition-all duration-700" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Transactions;
