import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, DollarSign, ChevronLeft, ChevronRight, Plus, BellRing, Briefcase, CreditCard, X, Trash2 } from 'lucide-react';
import axios from 'axios';

const FinancialCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'timeline'
    
    // Calendar Navigation State
    const [currentDate, setCurrentDate] = useState(() => {
        // Defaults to October 2026 as per original design reference, or current date if needed
        return new Date(2026, 9, 1); // 9 represents October (0-indexed)
    });
    
    const [selectedDateStr, setSelectedDateStr] = useState(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        event_type: 'Bill',
        amount: '',
        event_date: '',
        event_time: '12:00',
        repeat_type: 'None',
        priority: 'Medium',
        notes: ''
    });

    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/calendar/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(res.data);
        } catch (err) {
            console.error("Failed to fetch calendar events", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Month Names
    const monthNames = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    // Navigation handlers
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Date calculations
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    // Monday as first day of week. (getDay() returns 0 for Sun, 1 for Mon... 6 for Sat)
    const firstDayIndex = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const blanks = Array.from({ length: firstDayIndex }, (_, i) => null);
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarCells = [...blanks, ...dayNumbers];

    // Helper for formatting event cell dates
    const formatDateString = (day) => {
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    // Color schema mapping based on event type
    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'salary':
                return {
                    text: 'text-success',
                    bg: 'bg-success/5 border-success/20 hover:border-success/40',
                    dot: 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.8)]',
                    icon: Briefcase
                };
            case 'emi':
            case 'bill':
                return {
                    text: 'text-danger',
                    bg: 'bg-danger/5 border-danger/20 hover:border-danger/40',
                    dot: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]',
                    icon: CreditCard
                };
            case 'subscription':
                return {
                    text: 'text-warning',
                    bg: 'bg-warning/5 border-warning/20 hover:border-warning/40',
                    dot: 'bg-warning shadow-[0_0_8px_rgba(234,179,8,0.8)]',
                    icon: DollarSign
                };
            case 'investment':
            case 'goal':
                return {
                    text: 'text-primary',
                    bg: 'bg-primary/5 border-primary/20 hover:border-primary/40',
                    dot: 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]',
                    icon: Clock
                };
            default:
                return {
                    text: 'text-zinc-400',
                    bg: 'bg-white/5 border-white/10 hover:border-white/20',
                    dot: 'bg-zinc-500 shadow-[0_0_8px_rgba(150,150,150,0.8)]',
                    icon: CalendarIcon
                };
        }
    };

    const handleSelectDate = (dateStr) => {
        setSelectedDateStr(dateStr);
    };

    const handleOpenModal = (dateStr = null) => {
        const targetDate = dateStr || selectedDateStr || `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        setEditingEvent(null);
        setFormData({
            title: '',
            event_type: 'Bill',
            amount: '',
            event_date: targetDate,
            event_time: '12:00',
            repeat_type: 'None',
            priority: 'Medium',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const handleEditEvent = (ev) => {
        setEditingEvent(ev);
        setFormData({
            title: ev.title,
            event_type: ev.event_type,
            amount: ev.amount,
            event_date: ev.event_date,
            event_time: ev.event_time,
            repeat_type: ev.repeat_type,
            priority: ev.priority,
            notes: ev.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const dataToSave = {
                ...formData,
                amount: parseFloat(formData.amount)
            };
            
            if (editingEvent) {
                // Update
                const res = await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/calendar/${editingEvent.id}`, dataToSave, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? res.data : ev));
            } else {
                // Create
                const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/calendar/`, dataToSave, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEvents(prev => [...prev, res.data]);
            }
            handleCloseModal();
            // Notify system of changes to trigger alerts refresh
            window.dispatchEvent(new Event('alertsUpdated'));
        } catch (err) {
            console.error("Error saving calendar event", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!editingEvent) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/calendar/${editingEvent.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(prev => prev.filter(ev => ev.id !== editingEvent.id));
            handleCloseModal();
            window.dispatchEvent(new Event('alertsUpdated'));
        } catch (err) {
            console.error("Error deleting calendar event", err);
        } finally {
            setSaving(false);
        }
    };

    // Calculate sidebar contents
    const getNext7DaysEvents = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);
        sevenDaysLater.setHours(23, 59, 59, 999);
        
        return events.filter(ev => {
            const evDate = new Date(ev.event_date);
            return evDate >= today && evDate <= sevenDaysLater;
        }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    };

    const sidebarEvents = getNext7DaysEvents();

    // Sort all events chronologically for Timeline view
    const sortedTimelineEvents = [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CalendarIcon className="text-primary" size={32} />
                        Wealth Calendar
                    </h1>
                    <p className="text-zinc-500 mt-1">Timeline of upcoming cash flows, bills, and milestones</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
                        <button 
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'month' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Month
                        </button>
                        <button 
                            onClick={() => setViewMode('timeline')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Timeline
                        </button>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} /> Schedule
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main View Area */}
                <div className="lg:col-span-3 glass p-8 rounded-3xl min-h-[500px]">
                    {viewMode === 'month' ? (
                        <>
                            {/* Month Grid Navigation */}
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                                    {monthNames[monthIndex]} {year}
                                </h2>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handlePrevMonth}
                                        className="p-2 glass rounded-xl text-zinc-500 hover:text-white transition-all hover:bg-white/5 active:scale-90"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={handleNextMonth}
                                        className="p-2 glass rounded-xl text-zinc-500 hover:text-white transition-all hover:bg-white/5 active:scale-90"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Mon-Sun Header */}
                            <div className="grid grid-cols-7 gap-4">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                    <div key={d} className="text-center text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-4">{d}</div>
                                ))}
                                
                                {calendarCells.map((day, idx) => {
                                    if (day === null) {
                                        return <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none"></div>;
                                    }
                                    
                                    const cellDateStr = formatDateString(day);
                                    const isSelected = selectedDateStr === cellDateStr;
                                    const cellEvents = events.filter(e => e.event_date === cellDateStr);
                                    
                                    const hasEvents = cellEvents.length > 0;
                                    const mainEvent = cellEvents[0];
                                    const styles = hasEvents ? getTypeColor(mainEvent.event_type) : getTypeColor(null);
                                    
                                    return (
                                        <div 
                                            key={`day-${day}`} 
                                            onClick={() => handleSelectDate(cellDateStr)}
                                            onDoubleClick={() => handleOpenModal(cellDateStr)}
                                            className={`aspect-square glass rounded-2xl p-3 relative group transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.25)] scale-[1.02]' 
                                                    : hasEvents ? styles.bg : 'hover:border-white/20'
                                            }`}
                                        >
                                            <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-zinc-500 group-hover:text-white'}`}>
                                                {day}
                                            </span>
                                            
                                            {hasEvents && (
                                                <div className="mt-2 hidden xl:block space-y-1">
                                                    {cellEvents.slice(0, 2).map((ev, eIdx) => {
                                                        const evStyles = getTypeColor(ev.event_type);
                                                        return (
                                                            <div 
                                                                key={ev.id || eIdx} 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditEvent(ev);
                                                                }}
                                                                className="truncate hover:bg-white/5 px-1 py-0.5 rounded transition-all"
                                                            >
                                                                <p className={`text-[9px] font-black truncate ${evStyles.text}`}>{ev.title}</p>
                                                                <p className="text-[7px] font-bold text-white/40">₹{ev.amount.toLocaleString('en-IN')}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            {hasEvents && (
                                                <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${styles.dot}`}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2">Chronological Schedule</h2>
                                <p className="text-xs text-zinc-500">Full timeline of financial events, commitments, and deposits</p>
                            </div>
                            
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {sortedTimelineEvents.length === 0 ? (
                                    <div className="text-center py-20 text-zinc-500 italic">
                                        <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                                        No scheduled events found.
                                    </div>
                                ) : (
                                    sortedTimelineEvents.map((ev, index) => {
                                        const evStyles = getTypeColor(ev.event_type);
                                        const EvIcon = evStyles.icon;
                                        return (
                                            <div 
                                                key={ev.id || index}
                                                onClick={() => handleEditEvent(ev)}
                                                className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer flex justify-between items-center group hover:translate-x-1"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                                                        <EvIcon size={18} className={evStyles.text} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                                                            {new Date(ev.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                        <h4 className="text-sm font-black italic uppercase text-white leading-none mt-1 group-hover:text-primary transition-colors">
                                                            {ev.title}
                                                        </h4>
                                                        {ev.notes && <p className="text-[11px] text-zinc-400 mt-1 italic">{ev.notes}</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className={`text-sm font-black font-mono ${evStyles.text}`}>₹{ev.amount.toLocaleString('en-IN')}</p>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                        ev.priority === 'High' ? 'bg-danger/10 text-danger border-danger/20' :
                                                        ev.priority === 'Medium' ? 'bg-warning/10 text-warning border-warning/20' :
                                                        'bg-zinc-500/10 text-zinc-400 border-white/5'
                                                    }`}>
                                                        {ev.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Widget (Next 7 Days & Warnings) */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-3xl">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 font-mono flex items-center gap-2">
                            <BellRing size={16} className="text-warning animate-bounce" /> Next 7 Days
                        </h3>
                        <div className="space-y-6">
                            {sidebarEvents.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic text-center py-4">No events in the next 7 days</p>
                            ) : (
                                sidebarEvents.map((e, idx) => {
                                    const evStyles = getTypeColor(e.event_type);
                                    const EvIcon = evStyles.icon;
                                    const eventDate = new Date(e.event_date);
                                    const dayName = eventDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                                    
                                    return (
                                        <div 
                                            key={e.id || idx} 
                                            onClick={() => handleEditEvent(e)}
                                            className="flex gap-4 relative cursor-pointer group"
                                        >
                                            {idx !== sidebarEvents.length - 1 && (
                                                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-white/5"></div>
                                            )}
                                            <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-white/10 transition-all">
                                                <EvIcon size={18} className={evStyles.text} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{dayName}</p>
                                                <h4 className="text-sm font-bold text-white leading-none mt-1 group-hover:text-primary transition-colors">{e.title}</h4>
                                                <p className={`text-xs font-black mt-2 font-mono ${evStyles.text}`}>₹{e.amount.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-warning/20 to-transparent border border-warning/10 p-6 rounded-3xl">
                        <h4 className="text-sm font-black text-warning mb-2 uppercase tracking-tighter italic">Sage Warning</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Your "Japan Fund" contribution of ₹15,000 conflicts with the Amazon Sale period. Should I reschedule the transfer?
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-350">
                    <div className="glass w-full max-w-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative space-y-6 scale-95 animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={handleCloseModal}
                            className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                {editingEvent ? 'Edit Schedule' : 'Create Schedule'}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1">Configure your financial timeline event</p>
                        </div>

                        <form onSubmit={handleSaveEvent} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Event Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-semibold"
                                        placeholder="e.g. HDFC Loan EMI"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Event Type</label>
                                    <select 
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-semibold"
                                        value={formData.event_type}
                                        onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                                    >
                                        <option value="Salary">Salary</option>
                                        <option value="EMI">EMI</option>
                                        <option value="Bill">Bill</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="Investment">Investment</option>
                                        <option value="Goal">Goal</option>
                                        <option value="Reminder">Reminder</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        step="any"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-mono"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Priority</label>
                                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                                        {['Low', 'Medium', 'High'].map(p => (
                                            <button 
                                                key={p}
                                                type="button"
                                                onClick={() => setFormData({...formData, priority: p})}
                                                className={`flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${
                                                    formData.priority === p 
                                                        ? 'bg-primary text-white shadow-md' 
                                                        : 'text-zinc-500 hover:text-white'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-mono"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-mono"
                                        value={formData.event_time}
                                        onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Repeat Option</label>
                                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                                    {['None', 'Daily', 'Weekly', 'Monthly'].map(r => (
                                        <button 
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData({...formData, repeat_type: r})}
                                            className={`flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${
                                                formData.repeat_type === r 
                                                    ? 'bg-primary text-white shadow-md' 
                                                    : 'text-zinc-500 hover:text-white'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Notes</label>
                                <textarea 
                                    rows="2"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-semibold resize-none"
                                    placeholder="Add notes about this payment/deposit..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                {editingEvent ? (
                                    <button 
                                        type="button"
                                        onClick={handleDeleteEvent}
                                        className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                ) : <div />}
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="glass px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={saving}
                                        className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                                    >
                                        {saving ? 'Saving...' : 'Save Event'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialCalendar;
