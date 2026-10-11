import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const DatasetExplorerPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/dataset')
      .then(res => {
        if (res.data.data) {
          setData(res.data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <FileText className="text-teal-500" /> Dataset Explorer
        </h1>
        <p className="text-slate-500 mt-1">Browse a subset of the raw UCI CTG dataset records used for training (First 100 rows).</p>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading dataset...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No data found.</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-2 text-slate-600">
                      {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(3) : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default DatasetExplorerPage;
