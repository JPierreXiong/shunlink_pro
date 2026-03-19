'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertCircle, Coins, ChevronDown } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  slug: string;
  successRate: number;
}

interface OrderFormProps {
  platforms?: Platform[];
  remainingCredits?: number;
  onSuccess?: () => void;
}

export function OrderForm({ platforms = [], remainingCredits = 0, onSuccess }: OrderFormProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [persona, setPersona] = useState<'professional' | 'social'>('professional');
  const [aiOptimize, setAiOptimize] = useState(true);
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  function validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError('');

    if (!validateUrl(targetUrl)) {
      setUrlError('Please enter a valid URL (e.g. https://example.com)');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (!anchorText.trim()) {
      setUrlError('Anchor text is required');
      return;
    }
    if (remainingCredits < 1) {
      setUrlError('Insufficient credits. Please purchase more.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/backlink/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, anchorText, platformId: platformId || null, agentPersona: persona, aiOptimize }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.error || 'Failed to create task');
        return;
      }
      setSuccess(true);
      setTargetUrl('');
      setAnchorText('');
      setPlatformId('');
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch {
      setUrlError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Target URL */}
      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
          Target URL
        </label>
        <input
          type="text"
          value={targetUrl}
          onChange={(e) => { setTargetUrl(e.target.value); setUrlError(''); }}
          placeholder="https://your-website.com/page"
          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:bg-white/8 ${
            urlError ? 'border-rose-500/60 focus:border-rose-500' : 'border-white/10 focus:border-cyan-500/50'
          }`}
        />
        {urlError && (
          <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle size={12} /> {urlError}
          </p>
        )}
      </motion.div>

      {/* Anchor Text */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
          Anchor Text
        </label>
        <input
          type="text"
          value={anchorText}
          onChange={(e) => setAnchorText(e.target.value)}
          placeholder="Best AI backlink tool"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
        />
      </div>

      {/* Platform selector */}
      {platforms.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
            Platform <span className="text-white/30 normal-case font-normal">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Auto-select best platform</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.name} ({p.successRate}% success rate)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Agent Persona */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
          Agent Persona
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['professional', 'social'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPersona(p)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                persona === p
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-white/3 border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              {p === 'professional' ? '💼 SEO Expert' : '🌐 Social Specialist'}
            </button>
          ))}
        </div>
      </div>

      {/* AI Optimize toggle */}
      <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/8">
        <div>
          <p className="text-sm font-medium text-white">AI Content Optimization</p>
          <p className="text-xs text-white/40">AI crafts natural surrounding content</p>
        </div>
        <button
          type="button"
          onClick={() => setAiOptimize(!aiOptimize)}
          className={`w-11 h-6 rounded-full transition-all relative ${
            aiOptimize ? 'bg-cyan-500' : 'bg-white/10'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            aiOptimize ? 'left-5' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading || success}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full relative py-3.5 rounded-xl font-bold text-sm text-white overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 24px rgba(6,182,212,0.35)' }}
      >
        {success ? (
          <span className="flex items-center justify-center gap-2"><Zap size={16} /> Task Deployed!</span>
        ) : loading ? (
          <span>Deploying Agent...</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap size={16} /> Deploy AI Agent
            <span className="ml-auto flex items-center gap-1 text-xs font-normal opacity-80">
              <Coins size={12} /> 1 Credit
            </span>
          </span>
        )}
      </motion.button>

      {/* Credit display */}
      <p className="text-center text-xs text-white/30">
        Remaining: <span className={remainingCredits <= 2 ? 'text-rose-400' : 'text-cyan-400'}>{remainingCredits} credits</span>
      </p>
    </form>
  );
}


