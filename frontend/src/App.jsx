import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Home, ActivitySquare, Cpu, BarChart2, Eye, LineChart, FileText, Settings, HeartPulse } from 'lucide-react';
import HomePage from './pages/Home';
import DashboardPage from './pages/Dashboard';
import PredictionPage from './pages/Prediction';
import RiskAnalysisPage from './pages/RiskAnalysis';
import MonitoringPage from './pages/Monitoring';
import DatasetExplorerPage from './pages/DatasetExplorer';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: BarChart2 },
    { name: 'Fetal Health Prediction', path: '/prediction', icon: ActivitySquare },
    { name: 'Risk Analysis', path: '/risk', icon: Shield },
    { name: 'Dataset Explorer', path: '/dataset', icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="flex items-center gap-3 p-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shadow-md shadow-teal-500/20">
          <HeartPulse className="text-white" size={18} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">FetalSense AI</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-1 px-3">
          <li>
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white group mb-2">
              <Home size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="font-medium text-sm">Back to Home</span>
            </Link>
          </li>
          <div className="h-px bg-slate-800 my-2 mx-4"></div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-teal-500 text-white font-medium shadow-md shadow-teal-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium text-sm'}`}>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-6 border-t border-slate-800 bg-slate-900 mt-auto">
        <div className="text-xs text-slate-500 font-semibold tracking-wider uppercase">FetalSense AI</div>
      </div>
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-10 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone Home Page without Sidebar */}
        <Route path="/" element={<HomePage />} />
        
        {/* Dashboard Routes wrapped in Sidebar Layout */}
        <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
        <Route path="/prediction" element={<DashboardLayout><PredictionPage /></DashboardLayout>} />
        <Route path="/risk" element={<DashboardLayout><RiskAnalysisPage /></DashboardLayout>} />
        <Route path="/monitoring" element={<DashboardLayout><MonitoringPage /></DashboardLayout>} />
        <Route path="/dataset" element={<DashboardLayout><DatasetExplorerPage /></DashboardLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
