/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Settings,
  X,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Milestone {
  id: string;
  label: string;
  date: string;
  type: 'ita' | 'submission' | 'feedback';
}

export default function App() {
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('oinp_milestones');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepDate, setNewStepDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem('oinp_milestones', JSON.stringify(milestones));
  }, [milestones]);

  const submissionDate = useMemo(() => 
    milestones.find(m => m.type === 'submission')?.date, 
    [milestones]
  );

  const itaDate = useMemo(() => 
    milestones.find(m => m.type === 'ita')?.date, 
    [milestones]
  );

  const formatDate = (dateStr: string) => {
    // Split YYYY-MM-DD and create local date to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const daysSinceSubmission = useMemo(() => {
    if (!submissionDate) return null;
    
    // Normalize both to start of local day for accurate count
    const [y, m, d] = submissionDate.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    start.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Return 0 if it's today, or the positive count
    return Math.max(0, diffDays);
  }, [submissionDate]);

  const addMilestone = (type: Milestone['type'], label: string, date: string) => {
    if (type === 'ita' || type === 'submission') {
      // Replace existing if it exists
      setMilestones(prev => [
        ...prev.filter(m => m.type !== type),
        { id: crypto.randomUUID(), label, date, type }
      ]);
    } else {
      setMilestones(prev => [
        ...prev,
        { id: crypto.randomUUID(), label, date, type }
      ]);
    }
  };

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 px-6 py-12 max-w-md mx-auto font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold mb-1">OINP Tracker</h1>
          <p className="text-lg font-light tracking-tight">Application Progress</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <Settings size={18} className="text-white/60" />
        </button>
      </header>

      {/* Main Counter */}
      <section className="mb-16 text-center">
        <AnimatePresence mode="wait">
          {daysSinceSubmission !== null ? (
            <motion.div 
              key="counter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative inline-block"
            >
              <div className="text-[120px] leading-none font-light tracking-tighter mb-2">
                {daysSinceSubmission}
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40 font-medium">
                Days Since Submission
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 px-8 border border-dashed border-white/10 rounded-3xl text-center"
            >
              <Clock size={32} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/40 text-sm font-light">Set your submission date to start tracking</p>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-6 text-xs uppercase tracking-widest font-semibold py-3 px-6 bg-white text-black rounded-full"
              >
                Setup Dates
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Timeline */}
      <section className="space-y-8">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold">Timeline</h2>
          <button 
            onClick={() => setIsAddingStep(true)}
            className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            <Plus size={14} /> Add Step
          </button>
        </div>

        <div className="space-y-0 border-l border-white/10 ml-2">
          {sortedMilestones.length > 0 ? (
            sortedMilestones.map((m, idx) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-8 pb-10 group"
              >
                {/* Dot */}
                <div className={`absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 border-black ${
                  m.type === 'submission' ? 'bg-white' : 
                  m.type === 'ita' ? 'bg-white/40' : 'bg-white/20'
                }`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-white/40 font-mono mb-1">
                      {formatDate(m.date)}
                    </div>
                    <h3 className={`text-base font-medium ${m.type === 'submission' ? 'text-white' : 'text-white/80'}`}>
                      {m.label}
                    </h3>
                  </div>
                  <button 
                    onClick={() => deleteMilestone(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="pl-8 text-white/20 text-sm font-light italic">
              No milestones recorded yet.
            </div>
          )}
        </div>
      </section>

      {/* Add Step Modal */}
      <AnimatePresence>
        {isAddingStep && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingStep(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#111] rounded-t-[32px] sm:rounded-[32px] p-8 border-t border-white/10 sm:border"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-medium">Add Feedback Step</h3>
                <button onClick={() => setIsAddingStep(false)} className="text-white/40"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Step Description</label>
                  <input 
                    type="text" 
                    value={newStepLabel}
                    onChange={(e) => setNewStepLabel(e.target.value)}
                    placeholder="e.g. Additional Document Request"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Date Received</label>
                  <input 
                    type="date" 
                    value={newStepDate}
                    onChange={(e) => setNewStepDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (newStepLabel && newStepDate) {
                      addMilestone('feedback', newStepLabel, newStepDate);
                      setNewStepLabel('');
                      setIsAddingStep(false);
                    }
                  }}
                  className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-sm tracking-wide"
                >
                  Save Milestone
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#111] rounded-t-[32px] sm:rounded-[32px] p-8 border-t border-white/10 sm:border"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-medium">Core Milestones</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-white/40"><X size={20} /></button>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">ITA Date</label>
                  <input 
                    type="date" 
                    value={itaDate || ''}
                    onChange={(e) => addMilestone('ita', 'Invitation to Apply (ITA)', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Submission Date</label>
                  <input 
                    type="date" 
                    value={submissionDate || ''}
                    onChange={(e) => addMilestone('submission', 'Application Submitted', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                
                <div className="pt-4 space-y-3">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-sm tracking-wide transition-colors"
                  >
                    Done
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Clear all data? This cannot be undone.')) {
                        setMilestones([]);
                        localStorage.removeItem('oinp_milestones');
                        setIsSettingsOpen(false);
                      }
                    }}
                    className="w-full py-4 bg-transparent text-red-500/60 hover:text-red-500 rounded-2xl font-medium text-xs tracking-widest uppercase transition-colors"
                  >
                    Reset All Data
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <footer className="mt-20 pt-8 border-t border-white/5 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium">
          OINP Progress Tracker • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
