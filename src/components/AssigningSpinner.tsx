import { useEffect, useState } from 'react'
import { gameConfig } from '../config/game'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export function AssigningSpinner() {
  const reduced = usePrefersReducedMotion()
  const messages = gameConfig.assigningMessages
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length)
    }, 700)
    return () => window.clearInterval(id)
  }, [messages.length, reduced])

  return (
    <div className="assigning" role="status" aria-live="polite">
      <div className="assigning__orb" aria-hidden>
        <span className="assigning__gift">🎁</span>
      </div>
      <p className="assigning__msg">{messages[index]}</p>
      <div className="assigning__dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
