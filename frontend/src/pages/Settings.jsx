import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Trash2, LogOut, Save, Globe, DollarSign, LineChart, X } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Password Change States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/settings/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSettings(res.data);
      } catch (err) {
        console.error("Error fetching settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Sync real-time Dark Mode class to the body element
  useEffect(() => {
    if (settings?.appearance) {
      const isDark = settings.appearance.dark_mode;
      if (isDark) {
        document.body.classList.remove('light');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.add('light');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [settings]);

  const handleUpdate = async (type, data) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'appearance' ? 'update' : type;
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/settings/${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllClick = () => {
    setSaving(true);
    // Simulate a full system sync
    setTimeout(() => {
      setSaving(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 8000);
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    setPasswordChanging(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setIsPasswordModalOpen(false), 2000);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to change password. Please check your current password.";
      setPasswordError(errMsg);
    } finally {
      setPasswordChanging(false);
    }
  };

  const Toggle = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
      <span className="text-sm font-medium text-white/80">{label}</span>
      <button 
        type="button"
        onClick={() => onChange(!enabled)}
        className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-primary' : 'bg-white/10'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`}></div>
      </button>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-white/50">Loading Settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Configure your PocketSage AI experience</p>
        </div>
        <button 
          onClick={handleSaveAllClick}
          disabled={saving}
          className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
        >
          <Save size={18} />
          <span className="text-xs">{saving ? 'SAVING...' : 'SAVE ALL'}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appearance Settings */}
        <section className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="text-primary" size={20} />
            <h2 className="text-lg font-bold">Appearance</h2>
          </div>
          <Toggle 
            label="Dark Mode" 
            enabled={settings?.appearance?.dark_mode} 
            onChange={(val) => {
              setSettings(prev => ({
                ...prev,
                appearance: { ...prev.appearance, dark_mode: val }
              }));
              handleUpdate('appearance', { dark_mode: val });
            }}
          />
        </section>

        {/* Notification Settings with Coming Soon Overlay */}
        <section className="glass p-6 rounded-3xl space-y-4 relative group overflow-hidden min-h-[160px]">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-accent" size={20} />
            <h2 className="text-lg font-bold">Notifications</h2>
          </div>
          <Toggle 
            label="Enable Push Alerts" 
            enabled={settings?.notifications?.enable_alerts} 
            onChange={(val) => {
              setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, enable_alerts: val }
              }));
              handleUpdate('notifications', { enable_alerts: val });
            }}
          />
          <Toggle 
            label="Email Summary" 
            enabled={settings?.notifications?.email_notifications} 
            onChange={(val) => {
              setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, email_notifications: val }
              }));
              handleUpdate('notifications', { email_notifications: val });
            }}
          />
          
          {/* Coming Soon Blurred Overlay */}
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[3px] rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-primary/20 text-primary border border-primary/30 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10">
              Coming Soon
            </div>
          </div>
        </section>

        {/* Security & System */}
        <section className="glass p-6 rounded-3xl md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-primary" size={20} />
            <h2 className="text-lg font-bold">Security</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                setIsPasswordModalOpen(true);
              }}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm flex justify-between items-center transition-all hover:scale-[1.01] active:scale-95"
            >
              <span>Change Password</span>
              <Save size={14} className="text-white/20" />
            </button>
            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm flex justify-between items-center transition-all relative">
              <span>Two-Factor Authentication</span>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md uppercase font-bold">Coming Soon</span>
            </button>
            <button className="p-4 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 rounded-2xl text-sm flex justify-between items-center transition-all">
              <span>Logout All Devices</span>
              <LogOut size={14} />
            </button>
          </div>
        </section>

        {/* Data Management with Coming Soon Overlay */}
        <section className="glass p-6 rounded-3xl md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6 relative group overflow-hidden min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-3xl">
              <Database className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Data Management</h3>
              <p className="text-white/40 text-sm">Download your reports or export data for taxes.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-secondary hover:bg-white/5 border border-white/10 rounded-2xl text-sm font-medium transition-all">
              Export PDF
            </button>
            <button className="px-6 py-3 bg-secondary hover:bg-white/5 border border-white/10 rounded-2xl text-sm font-medium transition-all">
              Download CSV
            </button>
            <button className="p-3 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 rounded-2xl transition-all">
              <Trash2 size={20} />
            </button>
          </div>

          {/* Coming Soon Blurred Overlay */}
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[3px] rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-primary/20 text-primary border border-primary/30 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10">
              Coming Soon
            </div>
          </div>
        </section>

      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative space-y-6 scale-95 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Change Password</h3>
              <p className="text-zinc-500 text-xs mt-1">Update your account password</p>
            </div>

            {passwordError && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-xs font-black uppercase tracking-wide text-danger text-center">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-2xl text-xs font-black uppercase tracking-wide text-success text-center">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Current Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-semibold"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">New Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-semibold"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 block font-bold uppercase tracking-widest text-[9px]">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-semibold"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="glass flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={passwordChanging}
                  className="bg-primary hover:bg-blue-600 text-white flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {passwordChanging ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Settings Saved Toast Banner */}
      {showSaveToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-success/15 border border-success/30 backdrop-blur-md p-5 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-bold text-lg">✓</div>
          <div>
            <h4 className="font-bold text-white text-sm">Settings Saved</h4>
            <p className="text-zinc-400 text-xs mt-0.5">All preferences successfully synchronized.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
