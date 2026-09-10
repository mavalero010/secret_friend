type Props = {
  enabled: boolean
  onToggle: () => void
}

export function SoundToggle({ enabled, onToggle }: Props) {
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Desactivar sonido' : 'Activar sonido'}
      title={enabled ? 'Sonido on' : 'Sonido off'}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  )
}
