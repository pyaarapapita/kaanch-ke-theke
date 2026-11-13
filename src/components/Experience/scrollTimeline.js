import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

const SEGMENT_EASE = 'sine.inOut'
const SCRUB_SECONDS = 0.7
const REBUILD_DEBOUNCE_MS = 200

const pageTop = (selector) => {
  const element = document.querySelector(selector)
  return element ? element.getBoundingClientRect().top + window.scrollY : null
}

/**
 * Where each storyboard stage lands, read from the real page. A stage is reached when its
 * section has climbed to the given share of the viewport. Nothing here is a fixed pixel
 * value, and a section that is absent is simply skipped.
 */
function measureStages() {
  const viewport = document.documentElement.clientHeight
  const maxScroll = ScrollTrigger.maxScroll(window)
  const hero = document.querySelector('.vinyl-hero-container')
  const heroHeight = hero ? hero.offsetHeight : viewport
  const at = (selector, share) => {
    const top = pageTop(selector)
    return top === null ? null : top - viewport * share
  }

  const wanted = [
    ['hero', 0],
    ['approach', heroHeight * 0.34],
    // Dimmed by the time the counter's heading rises into the frame.
    ['counter', at('#theka-counter-experience', 0.5)],
    ['chronicles', at('#theka-chronicles-section', 0.35)],
    ['shayari', at('.theka-shayari-card', 0.25)],
    ['playlist', at('.theka-vibes-wrapper', 0.4)],
    ['story', at('.story-section', 0.5)],
    ['final', maxScroll]
  ]

  // Keep positions strictly increasing so a layout change can never reverse the story.
  const stages = []
  for (const [name, position] of wanted) {
    if (position === null) continue
    const previous = stages.length ? stages[stages.length - 1].position : -1
    const clamped = Math.min(Math.max(position, previous + 1), Math.max(maxScroll, previous + 1))
    stages.push({ name, position: clamped })
  }
  return { stages, heroHeight, maxScroll }
}

/**
 * One timeline drives the whole page, with one ScrollTrigger scrubbing it. fromTo is used
 * for every segment so a rebuild after a layout change starts from known poses, not from
 * wherever the rig happened to be.
 */
function buildTimeline({ rig, poses, textFadeShare, onUpdate }) {
  const { stages, heroHeight } = measureStages()
  const timeline = gsap.timeline({ paused: true, onUpdate })

  for (let i = 0; i < stages.length - 1; i++) {
    const from = stages[i]
    const to = stages[i + 1]
    timeline.fromTo(
      rig,
      { ...poses[from.name] },
      { ...poses[to.name], duration: to.position - from.position, ease: SEGMENT_EASE, immediateRender: false },
      from.position
    )
  }

  // The hero text recedes through opacity and position only: the title keeps its font size.
  const textPanel = document.querySelector('.vinyl-hero-text-panel')
  if (textPanel) {
    timeline.fromTo(
      textPanel,
      { y: 0, opacity: 1 },
      { y: -48, opacity: 0, duration: heroHeight * textFadeShare, ease: 'power1.in', immediateRender: false },
      0
    )
  }

  const trigger = ScrollTrigger.create({
    animation: timeline,
    start: 0,
    end: 'max',
    scrub: SCRUB_SECONDS
  })

  // Land on the current scroll position at once, with no scrub catch-up after a rebuild.
  timeline.progress(trigger.progress)
  return { timeline, trigger, stages }
}

export function createScrollTimeline({ rig, poses, textFadeShare, onUpdate, onRebuild }) {
  let built = null
  let timer = 0
  const context = gsap.context(() => {})

  const measureKey = () => `${document.documentElement.scrollHeight}|${document.documentElement.clientWidth}`
  let lastKey = ''

  const rebuild = () => {
    lastKey = measureKey()
    context.add(() => {
      if (built) {
        built.trigger.kill()
        built.timeline.kill()
      }
      built = buildTimeline({ rig, poses, textFadeShare, onUpdate })
    })
    onUpdate()
    onRebuild?.(built)
  }

  // Sections change height (the shayari card, the Time Machine, fonts), which moves every
  // anchor below them. Rebuilding keeps the story pinned to where the sections really are.
  const scheduleRebuild = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (measureKey() !== lastKey) rebuild()
    }, REBUILD_DEBOUNCE_MS)
  }

  const observer = new ResizeObserver(scheduleRebuild)
  const page = document.querySelector('.landing-container')
  if (page) observer.observe(page)
  window.addEventListener('resize', scheduleRebuild)
  document.fonts?.ready.then(scheduleRebuild)

  rebuild()

  return {
    kill() {
      clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('resize', scheduleRebuild)
      if (built) {
        built.trigger.kill()
        built.timeline.kill()
      }
      built = null
      context.revert()
    },
    get stages() {
      return built?.stages ?? []
    }
  }
}

export const countScrollTriggers = () => ScrollTrigger.getAll().length
