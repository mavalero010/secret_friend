import { useEffect, useMemo, useState } from 'react'
import type { Participant } from '../data/participants'
import { getOtherParticipants } from '../data/participants'
import { gameConfig } from '../config/game'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

type Props = {
  giverId: string
  receiver: Participant
  onDone: () => void
  onTick?: () => void
  onFanfare?: () => void
}

export function RevealAnimation({
  giverId,
  receiver,
  onDone,
  onTick,
  onFanfare,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const pool = useMemo(() => {
    const others = getOtherParticipants(giverId)
    // Mezcla visual: no garantiza el orden real de asignaciones
    return [...others].sort(() => Math.random() - 0.5)
  }, [giverId])

  const [phase, setPhase] = useState<'spin' | 'lock' | 'show'>('spin')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced) {
      setPhase('show')
      onFanfare?.()
      const t = window.setTimeout(onDone, 400)
      return () => window.clearTimeout(t)
    }

    const tickMs = gameConfig.spinTickMs
    const duration = gameConfig.spinDurationMs
    const started = Date.now()
    let frame = 0

    const id = window.setInterval(() => {
      frame += 1
      setIndex((i) => (i + 1) % Math.max(pool.length, 1))
      onTick?.()

      const elapsed = Date.now() - started
      if (elapsed >= duration) {
        window.clearInterval(id)
        setPhase('lock')
        window.setTimeout(() => {
          setPhase('show')
          onFanfare?.()
          window.setTimeout(onDone, 900)
        }, 450)
      } else if (elapsed > duration * 0.7) {
        // ralentiza visualmente cerca del final
        if (frame % 2 !== 0) return
      }
    }, tickMs)

    return () => window.clearInterval(id)
  }, [reduced, pool.length, onDone, onTick, onFanfare])

  const current = phase === 'show' || phase === 'lock' ? receiver : pool[index] ?? receiver

  return (
    <div className={`reveal-anim reveal-anim--${phase}`} aria-live="polite">
      <p className="reveal-anim__label">
        {phase === 'show' ? '🎁 ¡RESULTADO!' : 'El destino baraja cartas...'}
      </p>

      <div className="reveal-anim__stage">
        <div key={phase === 'show' ? receiver.id : `spin-${index}`} className="reveal-anim__card">
          <img src={current.image} alt="" className="reveal-anim__photo" />
          <p className="reveal-anim__name">
            {phase === 'show' ? (
              <>
                TE TOCÓ
                <strong>{receiver.name}</strong>
              </>
            ) : phase === 'lock' ? (
              <span className="reveal-anim__censor">████████</span>
            ) : (
              current.name
            )}
          </p>
        </div>
      </div>

      {phase !== 'show' && (
        <div className="reveal-anim__sparks" aria-hidden>
          <span>✨</span>
          <span>🎰</span>
          <span>✨</span>
        </div>
      )}

      {phase === 'show' && <div className="confetti" aria-hidden />}
    </div>
  )
}
