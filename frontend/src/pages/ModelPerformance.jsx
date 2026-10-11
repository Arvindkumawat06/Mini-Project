import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const ModelPerformancePage = () => {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/metrics').then(res => {
      if (res.data.metrics) setMetrics(res.data.metrics);
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Cpu className="text-teal-500" /> Model Performance
        </h1>
        <p className="text-slate-500 mt-1">Compare the performance metrics across all trained classifiers.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Accuracy</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Precision</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recall</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">F1-Score</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ROC-AUC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{m.Model}</td>
                <td className="px-6 py-4 text-slate-600">{(m.Accuracy * 100).toFixed(2)}%</td>
                <td className="px-6 py-4 text-slate-600">{m['Precision (Macro)'].toFixed(4)}</td>
                <td className="px-6 py-4 text-slate-600">{m['Recall (Macro)'].toFixed(4)}</td>
                <td className="px-6 py-4 text-slate-600">{m['F1-Score (Macro)'].toFixed(4)}</td>
                <td className="px-6 py-4 text-slate-600">{m['ROC-AUC'] ? m['ROC-AUC'].toFixed(4) : 'N/A'}</td>
              </tr>
            ))}
            {metrics.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading metrics from backend...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ModelPerformancePage;
