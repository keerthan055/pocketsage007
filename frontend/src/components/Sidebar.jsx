import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Receipt, LineChart, Settings, LogOut, ShieldCheck,
  Bell, Target, Bot, BarChart3, TrendingUp, Users, Calendar, FileText,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/alerts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const count = response.data.filter(a => !a.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch alerts in Sidebar:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchAlerts();

    const interval = setInterval(fetchAlerts, 10000);

    const handleAlertsUpdated = () => {
      fetchAlerts();
    };

    window.addEventListener('alertsUpdated', handleAlertsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alertsUpdated', handleAlertsUpdated);
    };
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Forecast', path: '/forecast', icon: LineChart },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: unreadCount > 0 ? unreadCount : null, risk: unreadCount > 0 ? 'high' : null },
    { name: 'Goals', path: '/goals', icon: Target, risk: 'low' },
    { name: 'AI Copilot', path: '/copilot', icon: Bot },
    { name: 'Insights', path: '/insights', icon: BarChart3 },
    { name: 'Investments', path: '/investments', icon: TrendingUp, risk: 'medium' },
    { name: 'Family Mode', path: '/family', icon: Users, comingSoon: true },
    { name: 'Reports', path: '/reports', icon: FileText, comingSoon: true },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
  ];

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  return (
    <motion.div 
      initial={isCollapsed ? "collapsed" : "expanded"}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen bg-zinc-950 border-r border-white/5 flex flex-col p-4 shadow-2xl z-50 relative overflow-hidden"
    >
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      {/* Header / Logo */}
      <div className="flex items-center justify-between mb-8 px-2">
        <AnimatePresence mode='wait'>
          {!isCollapsed && (
            <motion.div 
              key="logo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">PocketSage</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all border border-transparent hover:border-white/5"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
        {navItems.map((item) => {
          const isComingSoon = item.comingSoon;
          
          const content = (
            <div className="flex items-center justify-between w-full relative">
              <div className="flex items-center gap-4">
                <div className={`relative ${item.name === 'Alerts' && item.risk === 'high' ? 'animate-alert-glow rounded-lg' : ''}`}>
                  <item.icon size={20} />
                  {item.risk && (
                    <div className={`risk-dot absolute -top-1 -right-1 border border-zinc-950 ${
                      item.risk === 'high' ? 'bg-danger' : item.risk === 'medium' ? 'bg-warning' : 'bg-success'
                    }`}></div>
                  )}
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      key="text"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm overflow-hidden whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {!isCollapsed && item.badge && (
                <span className="bg-danger/80 text-white text-[10px] px-2 py-0.5 rounded-lg font-black border border-white/10">
                  {item.badge}
                </span>
              )}

              {isComingSoon && !isCollapsed && (
                <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-[1px] flex items-center justify-center text-[8px] font-black tracking-widest text-primary uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl pointer-events-none">
                  Coming Soon
                </div>
              )}
            </div>
          );

          const tooltip = (
            isCollapsed && (
              <div className="absolute left-16 px-3 py-1.5 bg-zinc-900 border border-white/10 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-3 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                {item.name} {isComingSoon ? '(Coming Soon)' : (item.badge ? `(${item.badge})` : '')}
              </div>
            )
          );

          if (isComingSoon) {
            return (
              <div
                key={item.name}
                className="flex items-center group relative px-3 py-2.5 rounded-xl transition-all duration-300 text-zinc-500 hover:text-white hover:bg-white/5 cursor-not-allowed overflow-hidden"
              >
                {content}
                {tooltip}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center group relative px-3 py-2.5 rounded-xl transition-all duration-300 overflow-hidden ${
                  isActive 
                    ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {content}
              {tooltip}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
        <button 
          className="w-full flex items-center px-3 py-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all group relative"
        >
          <Settings size={20} />
          {!isCollapsed && <span className="ml-4 text-sm font-medium">Settings</span>}
          {isCollapsed && (
            <div className="absolute left-16 px-3 py-1.5 bg-zinc-900 border border-white/10 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-3 group-hover:translate-x-0 z-50 whitespace-nowrap">
              Settings
            </div>
          )}
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center px-3 py-2.5 rounded-xl text-danger hover:bg-danger/10 transition-all group relative"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-4 text-sm font-medium">Logout</span>}
          {isCollapsed && (
            <div className="absolute left-16 px-3 py-1.5 bg-danger text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-3 group-hover:translate-x-0 z-50 whitespace-nowrap">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
