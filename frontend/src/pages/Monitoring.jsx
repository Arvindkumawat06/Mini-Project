import { motion } from 'framer-motion';
import { LineChart } from 'lucide-react';
import DashboardPage from './Dashboard';

const MonitoringPage = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <LineChart className="text-teal-500" /> Monitoring Simulation
        </h1>
        <p className="text-slate-500 mt-1">Simulate continuous CTG record analysis and observe predictions over time.</p>
      </div>
      <DashboardPage />
    </motion.div>
  );
};

export default MonitoringPage;
