'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Image as ImageIcon,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import useSWR from 'swr';
import { TerminalLog } from './TerminalLog';

export type TaskStatus = 'pending' | 'processing' | 'need_2fa' | 'success' | 'failed';

export interface Task {
  id: string;
  targetUrl: string;
  anchorText: string;
  status: TaskStatus;
  screenshotUrl?: string | null;
  liveUrl?: string | null;
  retryCount: number;
  isRefunded: boolean;
  slaDue?: string | null;
  errorMessage?: string | null;
  agentLog?: string | null;
  createdAt: string;
  platformName?: string | null;
  platformSlug?: string | null;
}

interface TaskCardProps {
  task: Task;
  onViewProof?: (screenshotUrl: string, taskId: string) => void;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; bg: string; border: string; label: string; progress: number; icon: React.ReactNode }
> = {
  pending: {
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    label: 'In Queue',
    progress: 15,
    icon: <Clock size={14} />,
  },
  processing: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    label: 'AI Deploying...',
    progress: 60,
    icon: <Loader2 size={14} className="animate-spin" />,
  },
  need_2fa: {
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-500/40',
    label: 'Action Required',
    progress: 50,
    icon: <AlertTriangle size={14} />,
  },
  success: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    label: 'Verified',
    progress: 100,
    icon: <CheckCircle size={14} />,
  },
  failed: {
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/30',
    label: 'Failed',
    progress: 0,
    icon: <XCircle size={14} />,
  },
};

const STEPS = ['Queued', 'Navigating', 'Posting', 'Verified'];
const STATUS_TO_STEP: Record<TaskStatus, number> = {
  pending: 0,
  processing: 1,
  need_2fa: 1,
  success: 3,
  failed: -1,
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TaskCard({ task: initialTask, onViewProof, onRefresh }: TaskCardProps) {
  const [twoFaCode, setTwoFaCode] = useState('');
  const [submitting2fa, setSubmitting2fa] = useState(false);
  const [shook, setShook] = useState(false);
  const [prevStatus, setPrevStatus] = useState<TaskStatus>(initialTask.status);

  const shouldPoll = !['success', 'failed'].includes(initialTask.status);

  const { data, mutate } = useSWR<{ task: Task }>(
    shouldPoll ? `/api/backlink/tasks/${initialTask.id}` : null,
    fetcher,
    { refreshInterval: 8000, revalidateOnFocus: false }
  );

  const task = data?.task ?? initialTask;
  const cfg = STATUS_CONFIG[task.status];
  const currentStep = STATUS_TO_STEP[task.status];
  const is2FA = task.status === 'need_2fa';
  const isProcessing = task.status === 'processing';

  // Shake when transitioning into need_2fa
  useEffect(() => {
    if (task.status !== prevStatus) {
      setPrevStatus(task.status);
      if (task.status === 'need_2fa') {
        setShook(true);
        setTimeout(() => setShook(false), 600);
      }
    }
  }, [task.status, prevStatus]);

  const slaMs = task.slaDue ? new Date(task.slaDue).getTime() - Date.now() : null;
  const slaHours = slaMs ? Math.max(0, Math.floor(slaMs / 3600000)) : null;
  const slaMins = slaMs ? Math.max(0, Math.floor((slaMs % 3600000) / 60000)) : null;

  async function handle2FASubmit() {
    if (!twoFaCode.trim()) return;
    setSubmitting2fa(true);
    try {
      await fetch(`/api/backlink/tasks/${task.id}/submit-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFaCode }),
      });
      setTwoFaCode('');
      mutate();
      onRefresh?.();
    } finally {
      setSubmitting2fa(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        x: shook ? [-7, 7, -5, 5, -3, 3, 0] : 0,
      }}
      transition={shook ? { duration: 0.5 } : { duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-xl p-5 shadow-xl transition-colors ${
        is2FA
          ? 'border-rose-500/50 shadow-rose-500/10'
          : isProcessing
          ? 'border-cyan-500/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Processing — cyan breathing glow */}
      {isProcessing && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0px rgba(6,182,212,0)',
              '0 0 24px rgba(6,182,212,0.22)',
              '0 0 0px rgba(6,182,212,0)',
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 2FA — red breathing glow */}
      {is2FA && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0px rgba(244,63,94,0)',
              '0 0 24px rgba(244,63,94,0.28)',
              '0 0 0px rgba(244,63,94,0)',
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-xs font-mono text-white/40 mb-0.5">Task {task.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm font-medium text-white truncate">{task.targetUrl}</p>
          <p className="text-xs text-white/50 mt-0.5">&quot;{task.anchorText}&quot;</p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
          {cfg.icon}
          <span>{cfg.label}</span>
          {task.isRefunded && <span className="ml-1 text-white/40">(Refunded)</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cfg.progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
          style={{ boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                task.status === 'failed'
                  ? 'bg-slate-600'
                  : i <= currentStep
                  ? 'bg-cyan-400'
                  : 'bg-white/10'
              }`}
            />
            <span
              className={`text-[10px] ${
                task.status === 'failed'
                  ? 'text-slate-600'
                  : i <= currentStep
                  ? 'text-cyan-400'
                  : 'text-white/30'
              }`}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/10 mx-1" />}
          </div>
        ))}
      </div>

      {/* AI Terminal Log */}
      <TerminalLog status={task.status} agentLog={task.agentLog} />

      {/* 2FA input */}
      <AnimatePresence>
        {is2FA && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3"
          >
            <p className="text-xs text-rose-300 font-medium mb-2">
              ⚠ Your AI Agent is waiting for your permission to proceed.
            </p>
            <p className="text-[11px] text-rose-200/60 mb-2">
              Check your email for the verification code.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handle2FASubmit()}
                placeholder="6-digit code"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-rose-400/60 font-mono tracking-widest"
              />
              <button
                onClick={handle2FASubmit}
                disabled={submitting2fa || !twoFaCode.trim()}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {submitting2fa ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-white/30 font-mono space-y-0.5">
          <p>{new Date(task.createdAt).toLocaleString()}</p>
          {slaHours !== null && task.status !== 'success' && task.status !== 'failed' && (
            <p className="text-amber-400/60">SLA: {slaHours}h {slaMins}m remaining</p>
          )}
          {task.platformName && <p>{task.platformName}</p>}
          {task.errorMessage && (
            <p className="text-rose-400/70 truncate max-w-[180px]">{task.errorMessage}</p>
          )}
        </div>
        <div className="flex gap-2">
          {task.liveUrl && (
            <a
              href={task.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
              title="Visit live link"
            >
              <ExternalLink size={16} />
            </a>
          )}
          {task.screenshotUrl && (
            <button
              onClick={() => onViewProof?.(task.screenshotUrl!, task.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-all"
            >
              <ImageIcon size={14} />
              View Proof
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
