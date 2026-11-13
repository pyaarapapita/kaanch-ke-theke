import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

/**
 * One chapter of the homepage: a numbered heading and its content. Both rise into place
 * the first time they scroll into view. The reveal only moves and fades the content, so
 * it never changes the page height that the 3D scroll timeline measures.
 */
export function Chapter({ id, number, kicker, title, lede, layout = 'stack', className = '', children }) {
  const prefersReducedMotion = useReducedMotion()
  const offset = prefersReducedMotion ? 0 : 28

  return (
    <section
      id={id}
      className={`chapter chapter--${layout} ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="chapter-inner">
        <motion.header
          className="chapter-head"
          initial={{ opacity: 0, y: offset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="chapter-mark">
            <span className="chapter-no" aria-hidden="true">{number}</span>
            <span className="chapter-kicker">{kicker}</span>
          </div>
          <h2 id={`${id}-title`} className="chapter-title">{title}</h2>
          {lede && <p className="chapter-lede">{lede}</p>}
        </motion.header>

        <motion.div
          className="chapter-body"
          initial={{ opacity: 0, y: offset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: EASE, delay: prefersReducedMotion ? 0 : 0.12 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}
