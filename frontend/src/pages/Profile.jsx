import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Wallet, Activity, CreditCard, ChevronRight, Shield, Award, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [profRes, sumRes, actRes] = await Promise.all([
          axios.get('http://localhost:8000/profile/', { headers }),
          axios.get('http://localhost:8000/profile/financial-summary', { headers }),
          axios.get('http://localhost:8000/profile/activity', { headers })
        ]);

        setProfile(profRes.data);
        setSummary(sumRes.data);
        setActivities(actRes.data);
      } catch (err) {
        console.error("Error fetching profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Profile...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Col: Profile Basic Info */}
        <div className="md:w-1/3 space-y-6">
          <div className="glass p-8 rounded-3xl text-center">
            <div className="relative inline-block mb-4">
              <input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                onChange={(e) => {
                  alert('Profile picture upload triggered! (Backend stub ready)');
                  console.log(e.target.files[0]);
                }} 
              />
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-primary/20">
                {profile?.full_name ? profile.full_name[0] : 'U'}
              </div>
              <label 
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 bg-background border border-white/10 p-2 rounded-xl hover:bg-secondary transition-colors shadow-xl cursor-pointer"
              >
                <User size={16} />
              </label>
            </div>
            <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
            <p className="text-white/50 text-sm mb-4">Financial Intelligence Platform</p>
            
            <div className="flex justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">Free Plan</span>
              <span className="px-3 py-1 bg-success/10 text-success text-xs rounded-full border border-success/20">Verified</span>
            </div>

            <button className="w-full py-3 bg-secondary hover:bg-white/5 border border-white/10 rounded-2xl transition-all text-sm font-medium">
              Upgrade to Premium
            </button>
          </div>

          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold mb-2">Connect Details</h3>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-primary" />
              <span className="text-white/70">{profile?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-primary" />
              <span className="text-white/70">{profile?.phone_number || 'No phone added'}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Stats & Activity */}
        <div className="md:w-2/3 space-y-6">
          
          {/* Financial Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Award size={64} />
              </div>
              <p className="text-white/50 text-sm mb-1">Financial Health Score</p>
              <h4 className="text-4xl font-bold text-primary">{summary?.health_score || 0}%</h4>
              <div className="mt-4 w-full bg-white/5 rounded-full h-1.5">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${summary?.health_score || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl">
              <p className="text-white/50 text-sm mb-1">Risk Assessment</p>
              <div className="flex items-center gap-2">
                <AlertTriangle className={summary?.risk_level === 'High' ? 'text-danger' : 'text-success'} size={20} />
                <h4 className={`text-2xl font-bold ${summary?.risk_level === 'High' ? 'text-danger' : 'text-success'}`}>
                  {summary?.risk_level || 'Low'}
                </h4>
              </div>
              <p className="text-xs text-white/40 mt-2 italic">Updated 2 mins ago based on recent transactions</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="glass p-4 rounded-2xl text-center">
              <DollarSign size={18} className="mx-auto mb-1 text-success" />
              <p className="text-xs text-white/40">Income</p>
              <p className="font-bold font-mono">${summary?.monthly_income?.toLocaleString() || 0}</p>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <TrendingUp size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-xs text-white/40">Savings</p>
              <p className="font-bold font-mono">${summary?.savings?.toLocaleString() || 0}</p>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <CreditCard size={18} className="mx-auto mb-1 text-danger" />
              <p className="text-xs text-white/40">Debt</p>
              <p className="font-bold font-mono">${summary?.debt?.toLocaleString() || 0}</p>
            </div>
          </div>

          {/* Activity Section */}
          <div className="glass p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Activity Log</h3>
              <Activity size={20} className="text-primary/50" />
            </div>
            
            <div className="space-y-4">
              {activities.length > 0 ? activities.map((act) => (
                <div key={act.id} className="flex gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/10">
                  <div className="bg-secondary p-3 rounded-xl">
                    {act.activity_type === 'Login' ? <Shield size={18} className="text-primary" /> : <ChevronRight size={18} className="text-white/40 group-hover:text-primary transition-colors" />}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">{act.activity_type}</h5>
                    <p className="text-xs text-white/50">{act.description}</p>
                    <p className="text-[10px] text-white/30 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-white/30 text-sm">No recent activity found.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
