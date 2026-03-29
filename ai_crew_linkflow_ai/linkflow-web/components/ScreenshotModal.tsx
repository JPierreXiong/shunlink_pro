'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface ScreenshotModalProps {
  screenshotUrl: string | null
  onClose: () => void
}

export default function ScreenshotModal({ screenshotUrl, onClose }: ScreenshotModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!screenshotUrl) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-brand-bg/80 backdrop-blur-sm
        animate-fade-in
      "
    >
      <div className="
        relative w-full max-w-4xl mx-4
        glass-card overflow-hidden
        animate-fade-up
      ">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green"></span>
            <h3 className="text-sm font-semibold text-brand-text">Submission Proof</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-cyan hover:underline px-3 py-1.5 rounded-lg
                         bg-brand-cyan/10 border border-brand-cyan/20 transition-colors"
            >
              Open full size ↗
            </a>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-brand-muted hover:text-brand-text hover:bg-brand-border
                         transition-all text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Screenshot image */}
        <div className="relative w-full bg-brand-bg" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <img
            src={screenshotUrl}
            alt="Backlink submission screenshot"
            className="w-full h-auto block"
            loading="lazy"
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-brand-border bg-brand-green/5">
          <p className="text-xs text-brand-green text-center">
            ✓ Screenshot captured at time of submission — proof of successful backlink deployment
          </p>
        </div>
      </div>
    </div>
  )
}


