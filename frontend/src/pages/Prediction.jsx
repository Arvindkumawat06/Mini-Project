import { useState, useEffect, useRef } from 'react';
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Eye } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const INITIAL_FORM_STATE = {
  baseline_value: '', accelerations: '', fetal_movement: '', uterine_contractions: '',
  light_decelerations: '', severe_decelerations: '', prolonged_decelerations: '',
  abnormal_short_term_variability: '', mean_value_of_short_term_variability: '',
  percentage_of_time_with_abnormal_long_term_variability: '', mean_value_of_long_term_variability: '',
  histogram_width: '', histogram_min: '', histogram_max: '', histogram_number_of_peaks: '',
  histogram_number_of_zeroes: '', histogram_mode: '', histogram_mean: '', histogram_median: '',
  histogram_variance: '', histogram_tendency: ''
};

const FormGroup = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const InputField = ({ label, name, placeholder, value, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
    <input
      type="number" step="any" required
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
    />
  </div>
);

const PredictionPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [prediction, setPrediction] = useState(null);
  const [shapData, setShapData] = useState([]);
  const [limeData, setLimeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limeLoading, setLimeLoading] = useState(false);
  const resultsRef = useRef(null);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('fetal_prediction_form');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
    const savedPred = localStorage.getItem('fetal_prediction_result');
    if (savedPred) {
      setPrediction(JSON.parse(savedPred));
    }
    const savedLime = localStorage.getItem('fetal_lime_result');
    if (savedLime) {
      setLimeData(JSON.parse(savedLime));
    }
    
    // Always fetch global SHAP on mount
    axios.get('http://localhost:8000/api/feature-importance')
      .then(res => {
        if (res.data.importance) {
          setShapData(res.data.importance.slice(0, 5));
        }
      }).catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    localStorage.setItem('fetal_prediction_form', JSON.stringify(newData));
  };

  const handleClear = () => {
    setFormData(INITIAL_FORM_STATE);
    setPrediction(null);
    setLimeData([]);
    localStorage.removeItem('fetal_prediction_form');
    localStorage.removeItem('fetal_prediction_result');
    localStorage.removeItem('fetal_lime_result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLimeLoading(true);
    
    try {
      // Convert all inputs to floats (or 0 if empty)
      const payload = {};
      Object.keys(formData).forEach(key => {
        payload[key] = parseFloat(formData[key]) || 0;
      });

      // 1. Fetch Prediction
      const pRes = await axios.post('http://localhost:8000/api/predict', payload);
      setPrediction(pRes.data);
      localStorage.setItem('fetal_prediction_result', JSON.stringify(pRes.data));

      // Scroll to results right after prediction is shown
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // 2. Fetch LIME concurrently
      const lRes = await axios.post('http://localhost:8000/api/explain-local', payload);
      if (lRes.data.lime) {
        const formattedLime = lRes.data.lime.map(item => ({
          name: item.feature,
          value: item.weight,
          fill: item.weight > 0 ? '#f43f5e' : '#10b981'
        }));
        setLimeData(formattedLime);
        localStorage.setItem('fetal_lime_result', JSON.stringify(formattedLime));
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to prediction server.');
    } finally {
      setIsLoading(false);
      setLimeLoading(false);
    }
  };

  const getPredictionUI = () => {
    if (!prediction) return null;
    
    let colorClass, bgClass, Icon, title;
    if (prediction.predicted_class === 1) {
      colorClass = 'text-emerald-700'; bgClass = 'bg-emerald-50 border-emerald-100'; Icon = CheckCircle2; title = 'Normal';
    } else if (prediction.predicted_class === 2) {
      colorClass = 'text-amber-700'; bgClass = 'bg-amber-50 border-amber-100'; Icon = AlertTriangle; title = 'Suspect';
    } else {
      colorClass = 'text-rose-700'; bgClass = 'bg-rose-50 border-rose-100'; Icon = ShieldAlert; title = 'Pathological';
    }

    return (
      <motion.div ref={resultsRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-4">Analysis Results</h2>
        
        {/* Top Row: Result and Probabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`p-8 rounded-2xl border ${bgClass} flex flex-col items-center justify-center text-center shadow-sm`}>
            <Icon size={56} className={`mb-4 ${colorClass}`} />
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Fetal Health Status</h4>
            <h2 className={`text-4xl font-extrabold ${colorClass} mb-2`}>{title}</h2>
            <p className="text-sm font-medium opacity-80 mt-2">Prototype Risk Score: {prediction.risk_score.toFixed(1)}/100</p>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity className="text-teal-500" size={18}/> Class Probabilities</h4>
            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Normal', value: prediction.probabilities[0] },
                  { name: 'Suspect', value: prediction.probabilities[1] },
                  { name: 'Pathological', value: prediction.probabilities[2] }
                ]} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 1]} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => (v * 100).toFixed(1) + "%"} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {["#10b981", "#f59e0b", "#f43f5e"].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row: LIME and SHAP Explainability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LIME Local Explanation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><Eye className="text-teal-500" size={18}/> Why this Prediction? (LIME)</h4>
            <p className="text-xs text-slate-500 mb-6">Top specific features influencing this exact record.</p>
            
            {limeLoading ? (
              <div className="flex-1 min-h-[200px] flex items-center justify-center text-slate-400">
                <RefreshCw className="animate-spin mr-2" size={16}/> Computing explanation...
              </div>
            ) : limeData.length > 0 ? (
              <div className="flex-1 min-h-[200px] flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={limeData} layout="vertical" margin={{ top: 0, right: 20, left: 120, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={150} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => value.toFixed(4)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                        {limeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600 font-medium">
                    The model predicted <strong>{title}</strong>. Features related to <strong>{limeData[0].name.replace(/_/g, ' ')}</strong> and <strong>{limeData[1].name.replace(/_/g, ' ')}</strong> contributed most significantly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[200px] flex items-center justify-center text-slate-400 text-sm">Explanation unavailable</div>
            )}
          </div>

          {/* SHAP Global Importance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><Activity className="text-teal-500" size={18}/> Global Context (SHAP)</h4>
            <p className="text-xs text-slate-500 mb-6">How your features compare against the dataset's top drivers.</p>
            
            <div className="flex-1 min-h-[200px]">
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 30, left: 120, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={150} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                      {shapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 h-full flex items-center justify-center text-slate-400 text-sm">Loading global context...</div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fetal Health Prediction</h1>
        <p className="text-slate-500 mt-1">Enter the CTG features below to get a prediction and integrated AI explanation.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          <div className="space-y-6">
            <FormGroup title="1. Baseline Heart Rate & Movements">
              <InputField label="Baseline (bpm)" name="baseline_value" placeholder="132" value={formData.baseline_value} onChange={handleChange} />
              <InputField label="Fetal Movements" name="fetal_movement" placeholder="0.000" value={formData.fetal_movement} onChange={handleChange} />
            </FormGroup>

            <FormGroup title="2. Variability (Short & Long Term)">
              <InputField label="Abnormal STV" name="abnormal_short_term_variability" placeholder="17" value={formData.abnormal_short_term_variability} onChange={handleChange} />
              <InputField label="Mean STV" name="mean_value_of_short_term_variability" placeholder="2.1" value={formData.mean_value_of_short_term_variability} onChange={handleChange} />
              <InputField label="Abnormal LTV (%)" name="percentage_of_time_with_abnormal_long_term_variability" placeholder="0" value={formData.percentage_of_time_with_abnormal_long_term_variability} onChange={handleChange} />
              <InputField label="Mean LTV" name="mean_value_of_long_term_variability" placeholder="10.4" value={formData.mean_value_of_long_term_variability} onChange={handleChange} />
            </FormGroup>

            <FormGroup title="3. Uterine Activity & Decelerations">
              <InputField label="Uterine Contractions" name="uterine_contractions" placeholder="0.008" value={formData.uterine_contractions} onChange={handleChange} />
              <InputField label="Accelerations" name="accelerations" placeholder="0.006" value={formData.accelerations} onChange={handleChange} />
              <InputField label="Light Decelerations" name="light_decelerations" placeholder="0" value={formData.light_decelerations} onChange={handleChange} />
              <InputField label="Severe Decelerations" name="severe_decelerations" placeholder="0" value={formData.severe_decelerations} onChange={handleChange} />
              <InputField label="Prolonged Decelerations" name="prolonged_decelerations" placeholder="0" value={formData.prolonged_decelerations} onChange={handleChange} />
            </FormGroup>
          </div>

          <div className="space-y-6">
            <FormGroup title="4. Histogram Features">
              <InputField label="Width" name="histogram_width" placeholder="130" value={formData.histogram_width} onChange={handleChange} />
              <InputField label="Min" name="histogram_min" placeholder="68" value={formData.histogram_min} onChange={handleChange} />
              <InputField label="Max" name="histogram_max" placeholder="198" value={formData.histogram_max} onChange={handleChange} />
              <InputField label="Number of Peaks" name="histogram_number_of_peaks" placeholder="6" value={formData.histogram_number_of_peaks} onChange={handleChange} />
              <InputField label="Number of Zeroes" name="histogram_number_of_zeroes" placeholder="1" value={formData.histogram_number_of_zeroes} onChange={handleChange} />
              <InputField label="Mode" name="histogram_mode" placeholder="141" value={formData.histogram_mode} onChange={handleChange} />
              <InputField label="Mean" name="histogram_mean" placeholder="136" value={formData.histogram_mean} onChange={handleChange} />
              <InputField label="Median" name="histogram_median" placeholder="140" value={formData.histogram_median} onChange={handleChange} />
              <InputField label="Variance" name="histogram_variance" placeholder="12" value={formData.histogram_variance} onChange={handleChange} />
              <InputField label="Tendency" name="histogram_tendency" placeholder="0" value={formData.histogram_tendency} onChange={handleChange} />
            </FormGroup>

            <div className="flex gap-4">
              <button type="submit" disabled={isLoading} className="flex-1 bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
                {isLoading ? <RefreshCw className="animate-spin" /> : <Activity />}
                Predict Fetal Health
              </button>
              <button type="button" onClick={handleClear} className="px-8 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-4 rounded-xl font-bold transition-all">
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </form>

      {getPredictionUI()}
    </div>
  );
};

export default PredictionPage;
