import { memo, useEffect, useRef, useState } from 'react'
import { CHAPTERS, toDevanagari } from './homeContent'

/**
 * Where you are in the story. A thin progress line under the header on every screen, and
 * on wide screens a rail of chapter marks in the left gutter that jump to each chapter.
 */
export const ChapterRail = memo(function ChapterRail() {
  const [activeId, setActiveId] = useState(null)
  const progressRef = useRef(null)

  // The chapter crossing the middle of the screen is the active one.
  useEffect(() => {
    const sections = CHAPTERS.map((chapter) => document.getElementById(chapter.id)).filter(Boolean)
    if (!sections.length || !('IntersectionObserver' in window)) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          } else {
            setActiveId((current) => (current === entry.target.id ? null : current))
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  // The progress line is written straight to the element: no React render per scroll frame.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const handleJump = (id) => {
    const target = document.getElementById(id)
    if (!target) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <>
      <div className="story-progress" aria-hidden="true">
        <div ref={progressRef} className="story-progress-fill" />
      </div>

      <nav className="chapter-rail" aria-label="पृष्ठ के अध्याय">
        <ol className="chapter-rail-list">
          {CHAPTERS.map((chapter, index) => {
            const isActive = chapter.id === activeId
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  className={`chapter-rail-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleJump(chapter.id)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="chapter-rail-no" aria-hidden="true">{toDevanagari(String(index + 1).padStart(2, '0'))}</span>
                  <span className="chapter-rail-tick" aria-hidden="true" />
                  <span className="chapter-rail-label">{chapter.label}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
})
