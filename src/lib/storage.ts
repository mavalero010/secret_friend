import { gameConfig } from '../config/game'

export function loadParticipantId(): string | null {
  try {
    return localStorage.getItem(gameConfig.storageKeys.participantId)
  } catch {
    return null
  }
}

export function saveParticipantId(id: string): void {
  try {
    localStorage.setItem(gameConfig.storageKeys.participantId, id)
  } catch {
    /* ignore */
  }
}

export function loadRevealed(): boolean {
  try {
    return localStorage.getItem(gameConfig.storageKeys.revealed) === '1'
  } catch {
    return false
  }
}

export function saveRevealed(value: boolean): void {
  try {
    localStorage.setItem(gameConfig.storageKeys.revealed, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function loadAccessPin(): string | null {
  try {
    return localStorage.getItem(gameConfig.storageKeys.accessPin)
  } catch {
    return null
  }
}

export function saveAccessPin(pin: string): void {
  try {
    localStorage.setItem(gameConfig.storageKeys.accessPin, pin)
  } catch {
    /* ignore */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(gameConfig.storageKeys.participantId)
    localStorage.removeItem(gameConfig.storageKeys.revealed)
    localStorage.removeItem(gameConfig.storageKeys.accessPin)
  } catch {
    /* ignore */
  }
}

export function loadSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(gameConfig.storageKeys.soundEnabled)
    return v === '1'
  } catch {
    return false
  }
}

export function saveSoundEnabled(value: boolean): void {
  try {
    localStorage.setItem(gameConfig.storageKeys.soundEnabled, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}
