import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const VISITOR_STORAGE_KEY = 'kaanch-ke-theke-visitor-id'

export function VisitorCounter({ className = '' }) {
  const [visitorCount, setVisitorCount] = useState(null)
  const hasRegisteredRef = useRef(false)

  useEffect(() => {
    // Avoid double execution on strict mode re-renders
    if (hasRegisteredRef.current) return
    hasRegisteredRef.current = true

    if (!supabase) {
      return
    }

    let visitorId = null
    try {
      visitorId = localStorage.getItem(VISITOR_STORAGE_KEY)
      if (!visitorId) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          visitorId = crypto.randomUUID()
        } else {
          visitorId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
          })
        }
        localStorage.setItem(VISITOR_STORAGE_KEY, visitorId)
      }
    } catch {
      // In case localStorage is disabled or restricted in browser privacy settings
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        visitorId = crypto.randomUUID()
      } else {
        visitorId = '10000000-1000-4000-8000-100000000000'
      }
    }

    async function registerAndFetchVisitorCount() {
      try {
        const { data, error } = await supabase.rpc('register_site_visit', {
          p_visitor_id: visitorId
        })

        if (error) {
          // Graceful fallback: counter stays hidden if RPC fails
          return
        }

        if (data !== undefined && data !== null && !isNaN(Number(data))) {
          setVisitorCount(Number(data))
        }
      } catch {
        // Silent failure if network or client fails
      }
    }

    registerAndFetchVisitorCount()
  }, [])

  if (visitorCount === null) {
    return null
  }

  const formattedCount = Number(visitorCount).toLocaleString('hi-IN')

  return (
    <div className={`visitor-counter-badge ${className}`}>
      <svg
        className="visitor-count-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span className="visitor-count-text">{formattedCount} बार महफ़िल सजी</span>
    </div>
  )
}
