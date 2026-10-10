import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RiskAnalysisPage = () => {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const savedPred = localStorage.getItem('fetal_prediction_result');
    if (savedPred) {
      setPrediction(JSON.parse(savedPred));
    }
  }, []);

  if (!prediction) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="text-teal-500" /> Risk Analysis
          </h1>
          <p className="text-slate-500 mt-1">Cross-reference multiple risk factors for a comprehensive analysis.</p>
        </div>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Prediction Data Found</h3>
          <p className="text-slate-500 mb-6">Please run a prediction on the Fetal Health Prediction page first.</p>
        </div>
      </motion.div>
    );
  }

  let colorClass, bgClass, Icon, title;
  if (prediction.predicted_class === 1) {
    colorClass = 'text-emerald-700'; bgClass = 'bg-emerald-50 border-emerald-100'; Icon = CheckCircle2; title = 'Normal';
  } else if (prediction.predicted_class === 2) {
    colorClass = 'text-amber-700'; bgClass = 'bg-amber-50 border-amber-100'; Icon = AlertTriangle; title = 'Suspect';
  } else {
    colorClass = 'text-rose-700'; bgClass = 'bg-rose-50 border-rose-100'; Icon = ShieldAlert; title = 'Pathological';
  }

  const probData = [
    { name: 'Normal', value: prediction.probabilities ? prediction.probabilities[0] : 0 },
    { name: 'Suspect', value: prediction.probabilities ? prediction.probabilities[1] : 0 },
    { name: 'Pathological', value: prediction.probabilities ? prediction.probabilities[2] : 0 }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Shield className="text-teal-500" /> Risk Analysis
        </h1>
        <p className="text-slate-500 mt-1">Detailed analysis of the latest fetal health prediction using prototype risk scores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className={`p-6 rounded-2xl border ${bgClass} flex flex-col items-center justify-center text-center shadow-sm`}>
          <Icon size={48} className={`mb-4 ${colorClass}`} />
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Predicted Category</h4>
          <h2 className={`text-3xl font-extrabold ${colorClass} mb-2`}>{title}</h2>
          <p className="text-sm font-medium opacity-80">Latest Fetal Health Classification</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Class Probabilities</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 1]} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => (v * 100).toFixed(1) + "%"} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                  {probData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Prototype Risk Score</h4>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle cx="64" cy="64" r="56" fill="none" stroke={prediction.predicted_class === 1 ? '#10b981' : prediction.predicted_class === 2 ? '#f59e0b' : '#f43f5e'} strokeWidth="12" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * prediction.risk_score) / 100} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900">{prediction.risk_score.toFixed(1)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 uppercase">Formula: 100 * (0.2Pn + 0.5Ps + 1.0Pp)</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskAnalysisPage;
