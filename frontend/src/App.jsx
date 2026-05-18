import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Forecast from './pages/Forecast';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import AICopilot from './pages/AICopilot';
import Goals from './pages/Goals';
import Insights from './pages/Insights';
import Investments from './pages/Investments';
import FinancialCalendar from './pages/FinancialCalendar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SidebarProvider, useSidebar } from './context/SidebarContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { isCollapsed } = useSidebar();
  
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white font-mono italic">Sage is awakening...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="flex bg-background min-h-screen transition-all duration-500">
      <Sidebar />
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-500`}>
        <Header />
        <main className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  React.useEffect(() => {
    const isLight = localStorage.getItem('theme') === 'light';
    if (isLight) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CurrencyProvider>
          <SidebarProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                <Route path="/copilot" element={<ProtectedRoute><AICopilot /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><FinancialCalendar /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              </Routes>
            </Router>
          </SidebarProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
