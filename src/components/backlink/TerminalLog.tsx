'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskStatus } from './TaskCard';

interface LogLine {
  id: number;
  text: string;
  ts: string;
}

const STATUS_LOGS: Record<TaskStatus, string[]> = {
  pending: [
    'AI Agent boot sequence started...',
    'Routing task to available operator thread...',
    'Preflight checks passed. Waiting in dispatch queue...',
  ],
  processing: [
    'AI Agent analyzing DOM structure and anti-bot signals...',
    'Evaluating platform templates for natural anchor placement...',
    'Loading target platform with human-like pacing profile...',
    'Calibrating stealth fingerprint and interaction cadence...',
    'Generating context-rich paragraph around target anchor...',
    'Simulating editorial typing flow at variable speed...',
    'Submitting draft and waiting for publication acknowledgement...',
    'Verifying post visibility and indexing footprint...',
  ],
  need_2fa: [
    'Security challenge detected: 2FA gate intercepted.',
    'Agent execution paused. Human confirmation required.',
    'Awaiting your verification code to resume autonomous flow.',
  ],
  success: [
    'Live post detected and backlink signature validated.',
    'Capturing screenshot evidence for audit trail...',
    'Uploading proof artifacts to secure storage...',
    'Mission complete. SLA target preserved.',
  ],
  failed: [
    'Execution halted due to unrecoverable platform response.',
    'Failure state confirmed. Refund pipeline triggered if eligible.',
    'Task closed. Ready for retry with adjusted strategy.',
  ],
};

function nowTs() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

interface TerminalLogProps {
  status: TaskStatus;
  agentLog?: string | null;
}

export function TerminalLog({ status, agentLog }: TerminalLogProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [counter, setCounter] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // If we have a real agent log, parse and show it
    if (agentLog) {
      const parsed = agentLog
        .split('\n')
        .filter(Boolean)
        .map((text, i) => ({ id: i, text, ts: nowTs() }));
      setLines(parsed);
      return;
    }

    const pool = STATUS_LOGS[status] ?? [];
    if (!pool.length) return;

    // Reset on status change
    setLines([]);
    indexRef.current = 0;

    const addLine = () => {
      const text = pool[indexRef.current % pool.length];
      setCounter((c) => {
        const id = c + 1;
        setLines((prev) => {
          const next = [...prev, { id, text, ts: nowTs() }];
          // Keep max 6 lines visible
          return next.slice(-6);
        });
        return id;
      });
      indexRef.current += 1;
    };

    // First line immediately
    addLine();

    // Subsequent lines every 3-5s
    if (!['success', 'failed'].includes(status)) {
      timerRef.current = setInterval(addLine, 3800);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, agentLog]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!lines.length) return null;

  return (
    <div
      className="rounded-xl overflow-hidden border border-white/8 mb-4"
      style={{ background: '#0a0f1a' }}
    >
      {/* Terminal title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5" style={{ background: '#060a12' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-[10px] text-white/20 font-mono">agent.log</span>
      </div>

      {/* Log lines */}
      <div className="px-3 py-2 min-h-[4rem] max-h-28 overflow-y-auto space-y-0.5">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 text-[11px] font-mono leading-relaxed"
            >
              <span className="text-white/20 shrink-0">[{line.ts}]</span>
              <span
                className={
                  line.text.toLowerCase().includes('error') ||
                  line.text.toLowerCase().includes('fail')
                    ? 'text-rose-400'
                    : line.text.toLowerCase().includes('success') ||
                      line.text.toLowerCase().includes('complete') ||
                      line.text.toLowerCase().includes('live')
                    ? 'text-emerald-400'
                    : line.text.toLowerCase().includes('waiting') ||
                      line.text.toLowerCase().includes('paused') ||
                      line.text.toLowerCase().includes('permission')
                    ? 'text-amber-400'
                    : 'text-cyan-300/80'
                }
              >
                {'> '}{line.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}














