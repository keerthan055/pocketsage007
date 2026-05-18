import React from 'react';
import { Users, UserPlus, Heart, ShieldCheck, PieChart, ArrowUpRight, MessageSquare, Settings } from 'lucide-react';

const FamilyMode = () => {
    const members = [
        { id: 1, name: 'Keerthan', role: 'Head of Home', spend: '₹45,200', avatar: 'K', color: 'primary' },
        { id: 2, name: 'Ananya', role: 'Spouse', spend: '₹22,100', avatar: 'A', color: 'success' },
        { id: 3, name: 'Rahul', role: 'Child', spend: '₹3,400', avatar: 'R', color: 'warning', controls: true },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="text-primary" size={32} />
                        Family Central
                    </h1>
                    <p className="text-zinc-500 mt-1">Shared budgets, financial permissions, and group analytics</p>
                </div>
                <button className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-primary/20">
                    <UserPlus size={18} /> Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Family Members Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {members.map((member) => (
                        <div key={member.name} className="glass p-6 rounded-3xl group hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl bg-${member.color} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-${member.color}/20 transition-transform group-hover:scale-110`}>
                                        {member.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-lg">{member.name}</h4>
                                        <p className="text-[10px] uppercase font-bold text-zinc-500">{member.role}</p>
                                    </div>
                                </div>
                                <div className="p-2 bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                  <Settings size={16} />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] uppercase font-black text-zinc-500">Mtd Spending</span>
                                    <span className="text-xl font-black text-white">{member.spend}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${member.color} opacity-40`} style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            {member.controls && (
                              <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                                <button className="flex-1 py-2 bg-warning/10 text-warning text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-warning hover:text-black transition-all">Set Limits</button>
                                <button className="flex-1 py-2 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Report</button>
                              </div>
                            )}
                        </div>
                    ))}

                    <div className="border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group text-zinc-600 hover:text-primary">
                        <UserPlus size={32} strokeWidth={1} />
                        <span className="text-xs font-bold uppercase tracking-widest">Connect Account</span>
                    </div>
                </div>

                {/* Shared Finance Controls */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-3xl border-primary/20 bg-primary/5">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-primary" /> Joint Controls
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <p className="font-bold">Dual Consent</p>
                                    <p className="text-[10px] text-zinc-500">Require approval for &gt; ₹10k</p>
                                </div>
                                <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between opacity-40">
                                <div className="text-sm">
                                    <p className="font-bold">Inheritance Mode</p>
                                    <p className="text-[10px] text-zinc-500">Nominee access on emergency</p>
                                </div>
                                <div className="w-10 h-5 bg-white/20 rounded-full relative">
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6 font-mono">Shared Group Chat</h3>
                        <div className="bg-white/5 rounded-2xl p-4 min-h-[150px] flex flex-col justify-end gap-3">
                           <div className="flex gap-2">
                              <div className="w-6 h-6 rounded-lg bg-success flex items-center justify-center text-[10px] font-bold">A</div>
                              <p className="bg-white/5 p-2 rounded-xl rounded-tl-none text-[10px] leading-tight">Hey! Who spent ₹2k on Zomato just now? 🤨</p>
                           </div>
                           <div className="flex gap-2 flex-row-reverse">
                              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-[10px] font-bold">K</div>
                              <p className="bg-primary/20 p-2 rounded-xl rounded-tr-none text-[10px] leading-tight text-right">It was the weekend grocery run! 🥦</p>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyMode;
