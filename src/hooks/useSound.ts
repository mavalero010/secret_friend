import { useCallback, useEffect, useRef, useState } from 'react'
import { loadSoundEnabled, saveSoundEnabled } from '../lib/storage'
import { useBackgroundMusic } from './useBackgroundMusic'

/** Beeps + música de fondo (loop). */
export function useSound() {
  const [enabled, setEnabled] = useState(true)
  const ctxRef = useRef<AudioContext | null>(null)
  const music = useBackgroundMusic(enabled)

  useEffect(() => {
    const stored = loadSoundEnabled()
    // Si nunca eligió, dejamos sonido ON (música al entrar).
    // loadSoundEnabled solo es true si guardó '1'; si es primera visita, enabled=true.
    const raw = (() => {
      try {
        return localStorage.getItem('sf3000_sound')
      } catch {
        return null
      }
    })()
    if (raw === null) {
      setEnabled(true)
    } else {
      setEnabled(stored)
    }
  }, [])

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      saveSoundEnabled(next)
      if (next) {
        try {
          void ensureCtx().resume()
        } catch {
          /* ignore */
        }
        music.start()
      }
      return next
    })
  }, [ensureCtx, music])

  const startMusic = useCallback(() => {
    try {
      void ensureCtx().resume()
    } catch {
      /* ignore */
    }
    music.start()
  }, [ensureCtx, music])

  const beep = useCallback(
    (freq = 440, duration = 0.08, type: OscillatorType = 'triangle', gain = 0.04) => {
      if (!enabled) return
      try {
        const ctx = ensureCtx()
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = type
        osc.frequency.value = freq
        g.gain.value = gain
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start()
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.stop(ctx.currentTime + duration)
      } catch {
        /* ignore */
      }
    },
    [enabled, ensureCtx],
  )

  const tick = useCallback(() => beep(660, 0.05, 'square', 0.03), [beep])
  const fanfare = useCallback(() => {
    beep(523, 0.12, 'triangle', 0.05)
    window.setTimeout(() => beep(659, 0.12, 'triangle', 0.05), 100)
    window.setTimeout(() => beep(784, 0.2, 'triangle', 0.06), 200)
  }, [beep])

  return { enabled, toggle, tick, fanfare, startMusic }
}
