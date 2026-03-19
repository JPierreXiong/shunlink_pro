'use client'

import { useEffect, useRef, useState } from 'react'

interface TerminalLogProps {
  status: 'pending' | 'processing' | 'success' | 'failed' | 'need_2fa'
  taskId: string
}

// Realistic-looking log lines per phase
const BOOT_LINES = [
  '> Initializing LinkFlow Agent v2.1...',
  '> Loading CrewAI runtime...',
  '> Securing proxy node (residential)...',
  '> Browser context created [Chromium headless]',
]

const PROCESSING_LINES = [
  '> Navigator Agent: navigating to platform login page...',
  '> Content Agent: analyzing target URL structure...',
  '> Navigator Agent: credentials loaded, attempting login...',
  '> Content Agent: generating anchor-optimized article draft...',
  '> Navigator Agent: login successful ✓',
  '> Content Agent: injecting backlink into article body...',
  '> Navigator Agent: locating publish button...',
  '> Navigator Agent: submitting post...',
  '> Waiting for confirmation page...',
]

const SUCCESS_LINES = [
  '> Post published successfully ✓',
  '> Capturing full-page screenshot...',
  '> Uploading proof to Cloudinary...',
  '> Live URL extracted ✓',
  '> Task complete. Status → SUCCESS',
]

const TWOFA_LINES = [
  '> 2FA challenge detected on platform.',
  '> Pausing agent — awaiting human verification code...',
  '> ⚡ Please enter your 2FA code in the card above.',
]

const FAILED_LINES = [
  '> Agent encountered an error.',
  '> Retry logic triggered...',
  '> Max retries reached. Credit refunded.',
  '> Status → FAILED',
]

export default function TerminalLog({ status, taskId }: TerminalLogProps) {
  const [lines, setLines] = useState<string[]>([])
  const [phase, setPhase] = useState<string>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever lines change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  useEffect(() => {
    if (status === 'pending' && phase === 'idle') {
      setPhase('booting')
      setLines([])
      let i = 0
      const interval = setInterval(() => {
        if (i < BOOT_LINES.length) {
          setLines((prev) => [...prev, BOOT_LINES[i]])
          i++
        } else {
          clearInterval(interval)
        }
      }, 600)
      return () => clearInterval(interval)
    }

    if (status === 'processing' && phase !== 'processing') {
      setPhase('processing')
      let i = 0
      const interval = setInterval(() => {
        if (i < PROCESSING_LINES.length) {
          setLines((prev) => [...prev, PROCESSING_LINES[i]])
          i++
        } else {
          clearInterval(interval)
        }
      }, 1800)
      return () => clearInterval(interval)
    }

    if (status === 'need_2fa' && phase !== 'need_2fa') {
      setPhase('need_2fa')
      setLines((prev) => [...prev, ...TWOFA_LINES])
    }

    if (status === 'success' && phase !== 'success') {
      setPhase('success')
      let i = 0
      const interval = setInterval(() => {
        if (i < SUCCESS_LINES.length) {
          setLines((prev) => [...prev, SUCCESS_LINES[i]])
          i++
        } else {
          clearInterval(interval)
        }
      }, 400)
      return () => clearInterval(interval)
    }

    if (status === 'failed' && phase !== 'failed') {
      setPhase('failed')
      setLines((prev) => [...prev, ...FAILED_LINES])
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (lines.length === 0) return null

  return (
    <div className="mt-3 rounded-lg bg-[#080C14] border border-[#1A2540] overflow-hidden">
      {/* Terminal title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#1A2540]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]"></span>
        <span className="ml-2 text-[10px] text-[#3A4A6B] font-mono">linkflow-agent — {taskId.slice(0, 8)}</span>
      </div>

      {/* Log output */}
      <div className="p-3 max-h-32 overflow-y-auto font-mono text-[11px] space-y-1">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`
              leading-relaxed
              ${
                line.includes('SUCCESS') || line.includes('✓')
                  ? 'text-[#22C55E]'
                  : line.includes('FAILED') || line.includes('error')
                  ? 'text-[#EF4444]'
                  : line.includes('2FA') || line.includes('⚡')
                  ? 'text-[#F59E0B]'
                  : 'text-[#7AA2C8]'
              }
            `}
          >
            {line}
          </div>
        ))}
        {/* Blinking cursor */}
        {(status === 'processing' || status === 'pending') && (
          <span className="inline-block w-1.5 h-3 bg-[#00D4FF] animate-pulse ml-0.5" />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

