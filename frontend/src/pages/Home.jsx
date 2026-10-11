import { motion } from 'framer-motion';
import { HeartPulse, Shield, BrainCircuit, ArrowRight, Eye, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200 selection:text-teal-900">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-[#061125]/90 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <HeartPulse className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">FetalSense AI</h2>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#" className="hover:text-teal-400 transition-colors">Technology</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Explainable AI</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Monitoring</a>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-teal-500 text-white rounded-full hover:bg-teal-400 transition-all shadow-md shadow-teal-500/20">
              Launch Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Container (Deep Blue) */}
      <div className="bg-[#061125] pt-32 pb-20 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-[#061125] to-[#061125]"></div>
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="flex flex-col lg:flex-row items-center gap-16 py-12 lg:py-20">
            <div className="flex-1 space-y-8 z-10">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-900/30 border border-teal-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span className="text-xs font-bold text-teal-300 tracking-wider uppercase">AI-Powered Fetal Health Research</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                Every Heartbeat. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">A Clearer Picture.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-xl text-slate-300 leading-relaxed max-w-2xl font-medium">
                Explainable AI for fetal health prediction, risk insights, and continuous monitoring simulation. 
                Our platform analyzes CTG features, predicts fetal health categories, and explains the factors influencing its predictions.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-teal-500 text-white rounded-full font-bold shadow-xl shadow-teal-500/30 hover:bg-teal-400 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                  Explore Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate('/explainability')} className="w-full sm:w-auto px-8 py-4 bg-transparent text-slate-300 rounded-full font-bold border border-slate-600 hover:bg-slate-800 hover:border-slate-500 transition-all">
                  Discover the Technology
                </button>
              </motion.div>
              
              <motion.div variants={itemVariants} className="pt-10 flex gap-10 border-t border-slate-800">
                <div>
                  <div className="text-2xl font-extrabold text-white">Multiclass</div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide mt-1">CTG Prediction</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">SHAP/LIME</div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide mt-1">Explainability</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">Telemetry</div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide mt-1">Simulation</div>
                </div>
              </motion.div>
            </div>
            
            {/* Animated Medical Graphic (Dark theme) */}
            <motion.div variants={itemVariants} className="flex-1 relative w-full h-[550px] flex items-center justify-center lg:justify-end">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 rounded-[3rem] -rotate-6 scale-95 blur-2xl"></div>
              
              <div className="relative w-full max-w-lg aspect-square bg-[#0b1b36] rounded-full border border-teal-500/30 shadow-[0_0_50px_rgba(20,184,166,0.3)] p-8 flex flex-col items-center justify-center overflow-hidden group">
                <div className="relative w-full h-full flex items-center justify-center z-10">
                  <div className="absolute inset-0 border border-teal-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <div className="absolute inset-6 border-[2px] border-dashed border-cyan-400/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-10 rounded-full shadow-inner flex items-center justify-center backdrop-blur-sm overflow-hidden border border-teal-500/20">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="w-full h-full">
                      <img src="/fetus.png" alt="Fetal Health AI" className="w-full h-full object-cover rounded-full mix-blend-screen opacity-90" />
                    </motion.div>
                  </div>
                </div>
                
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute top-12 -right-4 lg:right-4 bg-[#061125]/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-teal-500/20 flex items-center gap-4 z-20">
                  <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center"><BrainCircuit size={20} className="text-blue-400"/></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis</div>
                    <div className="text-sm font-extrabold text-white">Random Forest</div>
                  </div>
                </motion.div>
                
                <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }} className="absolute bottom-16 -left-4 lg:left-4 bg-[#061125]/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-teal-500/20 flex items-center gap-4 z-20">
                  <div className="w-10 h-10 rounded-full bg-teal-900/50 border border-teal-500/30 flex items-center justify-center"><Eye size={20} className="text-teal-400"/></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Explainability</div>
                    <div className="text-sm font-extrabold text-white">SHAP Waterfall</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Trust Strip & Below (White Theme) */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-6 pb-20">
        
        {/* Trust Strip */}
        <motion.div variants={itemVariants} className="py-24 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-16 tracking-tight">From Prediction to <span className="text-teal-500">Understanding</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner"><BrainCircuit size={28}/></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Intelligent Classification</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Classifies CTG records into Normal, Suspect, or Pathological using trained machine learning models like XGBoost and SVM.</p>
            </div>
            
            <div className="bg-white p-10 rounded-[2rem] border border-teal-100 shadow-2xl shadow-teal-500/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full -z-10"></div>
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner"><Eye size={28}/></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Explainable AI</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Uses SHAP and LIME to help explain model predictions, showing exactly which input features influenced the clinical result.</p>
            </div>
            
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner"><Shield size={28}/></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Risk-Aware Monitoring</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Displays class probabilities, prototype risk estimates, and trends to demonstrate how monitoring and alerts could work over time.</p>
            </div>
          </div>
        </motion.div>
        
        {/* Footer / CTA */}
        <motion.div variants={itemVariants} className="mt-12 relative rounded-[3rem] overflow-hidden bg-slate-900 text-white py-24 px-8 text-center shadow-2xl">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-teal-500 rounded-full blur-[120px]"></div>
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight">Explore the Intelligence Behind Every Prediction.</h2>
            <p className="text-xl text-slate-300 mb-12 font-medium">Discover how machine learning, explainability, and risk-aware visualization work together in fetal health research.</p>
            <button onClick={() => navigate('/dashboard')} className="px-12 py-5 bg-teal-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-teal-500/30 hover:bg-teal-400 hover:scale-105 transition-all">
              Launch Dashboard Now
            </button>
          </div>
        </motion.div>
        
        <footer className="mt-20 text-center text-sm font-medium text-slate-400">
          <p>Research prototype. Not intended for clinical diagnosis. © 2026 FetalSense AI.</p>
        </footer>
      </motion.div>
    </div>
  );
};

export default HomePage;
