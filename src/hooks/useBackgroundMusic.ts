import { useCallback, useEffect, useRef } from 'react'
import { gameConfig } from '../config/game'

const MUSIC_SRC = './audio/bg-music.mp3'

/**
 * Música de fondo en bucle.
 * Los navegadores bloquean autoplay con sonido: hay que llamar start()
 * tras un click (p. ej. "ENTRAR AL JUEGO").
 */
export function useBackgroundMusic(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startedRef = useRef(false)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = gameConfig.musicVolume
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !startedRef.current) return

    if (enabled) {
      void audio.play().catch(() => {
        /* ignore */
      })
    } else {
      audio.pause()
    }
  }, [enabled])

  const start = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    startedRef.current = true
    audio.volume = gameConfig.musicVolume
    if (enabledRef.current) {
      void audio.play().catch(() => {
        /* ignore */
      })
    }
  }, [])

  return { start }
}
