'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotUrl: string;
  taskId: string;
  liveUrl?: string | null;
}

export function ScreenshotModal({ isOpen, onClose, screenshotUrl, taskId, liveUrl }: ScreenshotModalProps) {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/85"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-black/50 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                  <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Deployment Evidence</p>
                  <p className="text-xs font-mono text-white/40">Task {taskId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveUrl && (
                  <>
                    <button
                      onClick={copyUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                    >
                      <Copy size={12} />
                      {copied ? 'Copied!' : 'Copy URL'}
                    </button>
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 transition-all"
                    >
                      <ExternalLink size={12} />
                      Visit Link
                    </a>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Screenshot */}
            <div className="relative max-h-[75vh] overflow-y-auto">
              <img
                src={screenshotUrl}
                alt={`Evidence for task ${taskId}`}
                className="w-full object-contain block"
              />
              {/* AI Verified watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.12]">
                <div className="transform -rotate-45 border-4 border-emerald-400 rounded-2xl px-8 py-4 text-center">
                  <p className="text-emerald-400 text-4xl font-black tracking-tight">AI VERIFIED</p>
                  <p className="text-emerald-400 text-sm font-mono mt-1">LinkFlow AI · Deployment SLA Met</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}












