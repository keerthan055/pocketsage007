import React, { useState } from 'react';
import { X, Calendar, Tag, ArrowRight, ChevronDown } from 'lucide-react';
import { useCurrency, currencies } from '../context/CurrencyContext';

const TransactionModal = ({ onClose, onSave }) => {
  const { currentCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    type: 'Expense',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert entered amount to USD before saving (backend stores in USD)
    const amountInUSD = parseFloat(formData.amount) / selectedCurrency.rate;
    onSave({
      ...formData,
      amount: parseFloat(amountInUSD.toFixed(2))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative glass w-full max-w-lg rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold">New Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">

            {/* Currency Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Input Currency</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCurrencyDrop(!showCurrencyDrop)}
                  className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none hover:border-white/20 transition-all"
                >
                  <span className="font-bold">{selectedCurrency.flag} {selectedCurrency.code} ({selectedCurrency.symbol})</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${showCurrencyDrop ? 'rotate-180' : ''}`} />
                </button>

                {showCurrencyDrop && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCurrencyDrop(false)}></div>
                    <div className="absolute left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                      {currencies.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setSelectedCurrency(c); setShowCurrencyDrop(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${selectedCurrency.code === c.code ? 'bg-primary/10 text-primary' : 'text-zinc-400'}`}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="font-bold">{c.code}</span>
                          <span className="text-xs opacity-50">{c.name}</span>
                          <span className="ml-auto font-mono">{c.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-primary font-bold text-lg leading-none">{selectedCurrency.symbol}</span>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-mono focus:border-primary outline-none"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Type</label>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'Income'})}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData.type === 'Income' ? 'bg-success text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Income
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'Expense'})}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData.type === 'Expense' ? 'bg-danger text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Expense
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-2.5 text-zinc-500" size={16} />
                  <input 
                    type="date" 
                    required 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-3 text-zinc-500" size={18} />
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Salary">Salary</option>
                  <option value="Investments">Investments</option>
                  <option value="Rent">Housing/Rent</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Description</label>
              <input 
                type="text" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none"
                placeholder="Where did this go?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group shadow-lg shadow-primary/20"
          >
            Record Transaction <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
