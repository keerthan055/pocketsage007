import React from 'react';
import { FileText, Download, FileJson, FileSpreadsheet, Send, TrendingDown, Target, BrainCircuit, Activity } from 'lucide-react';

const Reports = () => {
    const historicalReports = [
        { id: 1, name: 'September 2026 Analysis', date: 'Oct 01, 2026', size: '2.4 MB', type: 'PDF' },
        { id: 2, name: 'Q3 Wealth Summary', date: 'Sep 30, 2026', size: '5.1 MB', type: 'CSV' },
        { id: 3, name: 'August 2026 Analysis', date: 'Sep 01, 2026', size: '2.1 MB', type: 'PDF' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FileText className="text-primary" size={32} />
                        Audit Hub
                    </h1>
                    <p className="text-zinc-500 mt-1">Professional financial statements, tax reports, and AI audits</p>
                </div>
                <div className="flex gap-3">
                  <button className="glass px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                    <FileJson size={16} /> JSON Export
                  </button>
                  <button className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-primary/20">
                    <Download size={18} /> Generate Report
                  </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Generation Presets */}
                <div className="glass p-8 rounded-3xl space-y-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Fast Presets</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/40 transition-all cursor-pointer group">
                           <Activity size={24} className="text-primary mb-4" />
                           <h4 className="font-bold text-sm">Monthly Audit</h4>
                           <p className="text-[10px] text-zinc-500 mt-1">Complete breakdown of income, expenses, and savings.</p>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-success/40 transition-all cursor-pointer group">
                           <Target size={24} className="text-success mb-4" />
                           <h4 className="font-bold text-sm">Tax Summary</h4>
                           <p className="text-[10px] text-zinc-500 mt-1">Categorized deductions and investment proofs.</p>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-warning/40 transition-all cursor-pointer group">
                           <BrainCircuit size={24} className="text-warning mb-4" />
                           <h4 className="font-bold text-sm">Wealth Forecast</h4>
                           <p className="text-[10px] text-zinc-500 mt-1">Multi-month AI predictions and risk scoring.</p>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-danger/40 transition-all cursor-pointer group">
                           <TrendingDown size={24} className="text-danger mb-4" />
                           <h4 className="font-bold text-sm">Debt Audit</h4>
                           <p className="text-[10px] text-zinc-500 mt-1">EMI cycle mapping and payoff acceleration tips.</p>
                        </div>
                    </div>
                </div>

                {/* History & Downloads */}
                <div className="glass p-8 rounded-3xl flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">Generation Vault</h3>
                    <div className="space-y-4 flex-1">
                        {historicalReports.map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-4 border border-white/5 bg-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                      {report.type === 'PDF' ? <FileText size={18} className="text-danger" /> : <FileSpreadsheet size={18} className="text-success" />}
                                  </div>
                                  <div>
                                      <h4 className="text-sm font-bold">{report.name}</h4>
                                      <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">{report.date} • {report.size}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button className="p-2.5 glass rounded-xl text-zinc-500 hover:text-white transition-all"><Download size={16} /></button>
                                  <button className="p-2.5 glass rounded-xl text-zinc-500 hover:text-white transition-all"><Send size={16} /></button>
                              </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3">
                           <BrainCircuit size={20} className="text-primary" />
                           <p className="text-[10px] font-bold text-zinc-400">
                             Sage has auto-generated your <span className="text-primary underline">September Report</span> based on your behavior. It's ready for review!
                           </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
