import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, Database, BrainCircuit, Shield, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [shapData, setShapData] = useState([]);

  useEffect(() => {
    // Load metrics
    axios.get('http://localhost:8000/api/metrics').then(res => {
      if (res.data.metrics) setMetrics(res.data.metrics);
    }).catch(e => console.error(e));

    // Load global feature importance
    axios.get('http://localhost:8000/api/feature-importance').then(res => {
      if (res.data.importance) setShapData(res.data.importance.slice(0, 5)); // top 5
    }).catch(e => console.error(e));

    // Load manual prediction from local storage
    const saved = localStorage.getItem('fetal_prediction_result');
    if (saved) {
      setPrediction(JSON.parse(saved));
    }
  }, []);

  const bestModel = metrics.find(m => m.Model === 'Random Forest') || metrics[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Holistic view of predictions, probabilities, risk indicators, and feature explanations.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 shadow-sm">
          <Database size={16} className="text-teal-500" /> Connected: UCI CTG Dataset
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><BrainCircuit /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Active Model</div>
            <div className="text-lg font-bold text-slate-900">Random Forest</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center"><Activity /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">System Accuracy</div>
            <div className="text-lg font-bold text-slate-900">{bestModel ? (bestModel.Accuracy * 100).toFixed(1) + '%' : 'Loading...'}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Database /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Dataset Records</div>
            <div className="text-lg font-bold text-slate-900">2,126</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Latest Prediction / Risk Indicator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Shield className="text-teal-500" size={20}/> Latest Analysis</h3>
            
            {prediction ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className={`p-6 rounded-xl text-center mb-6 border ${prediction.predicted_class === 1 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : prediction.predicted_class === 2 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  <div className="flex justify-center mb-3">
                    {prediction.predicted_class === 1 ? <CheckCircle2 size={40}/> : prediction.predicted_class === 2 ? <AlertTriangle size={40}/> : <ShieldAlert size={40}/>}
                  </div>
                  <div className="text-2xl font-bold mb-1">{prediction.predicted_class === 1 ? 'Normal' : prediction.predicted_class === 2 ? 'Suspect' : 'Pathological'}</div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Prototype Risk Score</span>
                    <span className="text-xl font-bold text-slate-900">{prediction.risk_score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Pathological Prob.</span>
                    <span className="text-xl font-bold text-slate-900">{(prediction.probabilities[2] * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 rounded-xl">
                <Activity size={32} className="mb-4 opacity-30" />
                <p className="text-sm">No prediction found. Go to Fetal Health Prediction to run an analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* Probabilities & Explanations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Eye className="text-teal-500" size={20}/> Model Explanations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
              {/* Probabilities */}
              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Class Probabilities</h4>
                {prediction ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Normal', value: prediction.probabilities[0] },
                        { name: 'Suspect', value: prediction.probabilities[1] },
                        { name: 'Pathological', value: prediction.probabilities[2] }
                      ]} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                        <XAxis type="number" hide domain={[0, 1]} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} formatter={(v) => (v * 100).toFixed(1) + "%"} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {["#10b981", "#f59e0b", "#f43f5e"].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-sm">Waiting for prediction...</div>
                )}
              </div>

              {/* Global Explanations (SHAP) */}
              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Top Global Features</h4>
                <div className="h-48">
                  {shapData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" hide />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                          {shapData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-sm">Loading...</div>
                  )}
                  {shapData.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      Top feature: {shapData[0].name.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default DashboardPage;
