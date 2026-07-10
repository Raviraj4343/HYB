import React from 'react'
import { Link } from 'react-router-dom'

/**
 * AppLogo — Single source of truth for brand identity.
 * Use this everywhere: sidebar, header, auth pages, landing.
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg'  — controls icon + text size
 *   to:   string               — link destination (default '/')
 *   showName: boolean          — whether to show the text name
 *   as: 'link' | 'div'        — wrapper element (default 'link')
 */
export function AppLogo({ size = 'md', to = '/', showName = true, as: Wrapper = 'link' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', text: 'text-base' },
    md: { box: 'h-10 w-10', text: 'text-lg' },
    lg: { box: 'h-14 w-14', text: 'text-2xl' },
  }
  const s = sizes[size] || sizes.md

  const content = (
    <span className="flex items-center gap-2.5">
      <span className={`${s.box} rounded-xl overflow-hidden shadow-lg shadow-primary/20 shrink-0 block`}>
        <img src="/logo.png" alt="Help Your Buddy Logo" className="h-full w-full object-cover" />
      </span>
      {showName && (
        <span className={`${s.text} font-display font-bold tracking-tight text-white whitespace-nowrap`}>
          Help Your Buddy
        </span>
      )}
    </span>
  )

  if (Wrapper === 'div') return <div>{content}</div>
  return <Link to={to}>{content}</Link>
}
