'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Zap, Plus, RefreshCw, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { TaskCard, Task } from '@/components/backlink/TaskCard';
import { OrderForm } from '@/components/backlink/OrderForm';
import { ScreenshotModal } from '@/components/backlink/ScreenshotModal';

interface Platform {
  id: string;
  name: string;
  slug: string;
  successRate: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [modal, setModal] = useState<{ url: string; taskId: string; liveUrl?: string } | null>(null);

  const { data, mutate, isLoading } = useSWR<{ tasks: Task[]; remainingCredits: number }>(
    '/api/backlink/tasks',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: platformsData } = useSWR<{ platforms: Platform[] }>(
    '/api/backlink/platforms',
    fetcher,
    { revalidateOnFocus: false }
  );

  const tasks = data?.tasks || [];
  const remainingCredits = data?.remainingCredits ?? 0;
  const platforms = platformsData?.platforms || [];

  const statusCounts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    processing: tasks.filter((t) => t.status === 'processing').length,
    need_2fa: tasks.filter((t) => t.status === 'need_2fa').length,
    success: tasks.filter((t) => t.status === 'success').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  function handleViewProof(screenshotUrl: string, taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    setModal({ url: screenshotUrl, taskId, liveUrl: task?.liveUrl ?? undefined });
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              LinkFlow AI
            </h1>
            <p className="text-white/40 text-sm mt-1">Monitor your AI backlink deployments in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <Coins size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">{remainingCredits}</span>
              <span className="text-xs text-white/40">credits</span>
            </div>
            <button
              onClick={() => mutate()}
              className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
            >
              <Zap size={15} />
              New Deployment
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {([
            { label: 'Queued', count: statusCounts.pending, color: 'text-amber-400' },
            { label: 'Running', count: statusCounts.processing, color: 'text-cyan-400' },
            { label: 'Need 2FA', count: statusCounts.need_2fa, color: 'text-rose-400' },
            { label: 'Success', count: statusCounts.success, color: 'text-emerald-400' },
            { label: 'Failed', count: statusCounts.failed, color: 'text-slate-400' },
          ]).map(({ label, count, color }) => (
            <div key={label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{count}</p>
              <p className="text-xs text-white/30 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Order form panel */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-5">Deploy New Backlink</h2>
            <OrderForm
              platforms={platforms}
              remainingCredits={remainingCredits}
              onSuccess={() => { setShowForm(false); mutate(); }}
            />
          </motion.div>
        )}

        {/* Tasks list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={28} className="text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No deployments yet</h3>
            <p className="text-white/40 text-sm mb-6">Deploy your first AI backlink agent to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
            >
              <Plus size={15} /> Deploy First Agent
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onViewProof={handleViewProof}
                onRefresh={() => mutate()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Screenshot modal */}
      {modal && (
        <ScreenshotModal
          isOpen={!!modal}
          onClose={() => setModal(null)}
          screenshotUrl={modal.url}
          taskId={modal.taskId}
          liveUrl={modal.liveUrl}
        />
      )}
    </div>
  );
}
















