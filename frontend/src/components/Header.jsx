import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Settings, Bell, Search, LogOut, ChevronDown, Globe } from 'lucide-react';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const location = useLocation();
    const { currentCurrency, changeCurrency } = useCurrency();
    const { user } = useAuth();
    const [showCurrency, setShowCurrency] = React.useState(false);
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/transactions') return 'Transactions';
    if (path === '/forecast') return 'ML Forecast';
    if (path === '/profile') return 'My Profile';
    if (path === '/settings') return 'Settings';
    return 'PocketSage AI';
  };

  return (
    <header className="flex items-center justify-between p-6 mb-2">
      <div>
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest">{getPageTitle()}</h2>
        <p className="text-xs text-white/20 mt-1">Welcome back to your financial intelligence hub</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar Stub */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl focus-within:border-primary/50 transition-all">
          <Search size={16} className="text-white/30" />
          <input 
            type="text" 
            placeholder="Search intelligence..." 
            className="bg-transparent border-none text-sm focus:outline-none text-white/70 w-48"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all relative">
            <Bell size={18} />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-background"></div>
          </button>
          
          <Link to="/settings" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all">
            <Settings size={18} />
          </Link>

          {/* Currency Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowCurrency(!showCurrency)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all flex items-center gap-3"
            >
              <span className="text-lg">{currentCurrency.flag}</span>
              <span className="text-sm font-bold font-mono">{currentCurrency.symbol}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${showCurrency ? 'rotate-180' : ''}`} />
            </button>

            {showCurrency && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCurrency(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-56 glass rounded-2xl overflow-hidden border border-white/10 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                    <Globe size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Currency</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {currencies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          changeCurrency(c);
                          setShowCurrency(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors ${currentCurrency.code === c.code ? 'bg-primary/10 text-primary' : 'text-zinc-400'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{c.flag}</span>
                          <div className="text-left">
                            <p className="font-bold leading-none">{c.name}</p>
                            <p className="text-[10px] opacity-50 mt-1">{c.code}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs">{c.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Link to="/profile" className="flex items-center gap-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 p-1.5 pr-4 rounded-2xl transition-all group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform uppercase">
              {user?.full_name ? user.full_name.charAt(0) : (user?.email ? user.email.charAt(0) : 'U')}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold leading-none capitalize">{user?.full_name || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[10px] text-primary/70 leading-none mt-1">Free Tier</p>
            </div>
          </Link>

          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="p-3 bg-danger/5 hover:bg-danger/10 border border-danger/20 rounded-2xl text-danger/60 hover:text-danger transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
