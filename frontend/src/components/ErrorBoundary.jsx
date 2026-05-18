import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Neural Crash Captured:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-[1000] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-danger/10 via-transparent to-transparent opacity-50" />
          
          <div className="relative text-center space-y-8 max-w-2xl animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 rounded-[2.5rem] bg-danger/10 border-2 border-danger/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={48} className="text-danger" />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">Neural System Error</h1>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">The PocketSage Intelligence Matrix has encountered a fatal exception</p>
              
              <div className="glass p-6 rounded-3xl border-danger/20 bg-danger/5 mt-8 text-left">
                <p className="text-[10px] font-black text-danger uppercase mb-2 tracking-widest">Diagnostic Report:</p>
                <code className="text-[11px] text-zinc-300 font-mono break-all leading-relaxed">
                  {this.state.error?.toString() || "Unknown Synchronization Failure"}
                </code>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button 
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw size={20} /> Force Re-Alignment
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto px-10 py-5 glass border-white/10 text-white rounded-2xl font-black uppercase tracking-widest italic hover:bg-white/5 transition-all flex items-center justify-center gap-3"
              >
                <Home size={20} /> Return to Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
