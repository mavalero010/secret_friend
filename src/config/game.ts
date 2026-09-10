/** Configuración central del juego — edita aquí sin tocar componentes. */

export const gameConfig = {
  name: 'AMIGO SECRETO 3000',
  shortName: 'Amigo Secreto',
  welcomeSubtitle: 'El destino está a punto de arruinar tus expectativas.',
  enterButton: 'ENTRAR AL JUEGO',

  identifyTitle: '🕵️ Identifícate, Cvga...',
  identifyHint: 'Selecciona tu carta. Prometemos no juzgarte.',

  confirmTitle: (name: string) => `¿Confirmas que eres ${name}?`,
  confirmHint: 'Una vez cruces esta puerta, no hay vuelta atrás.',
  confirmHintAlt: 'Esta decisión cambiará tu destino para siempre.',
  confirmPinLabel: 'Tu clave secreta',
  confirmPinPlaceholder: 'Ingresa tu PIN',
  confirmPinHint: 'Solo tú deberías conocerla. Si no la tienes, pregunta al organizador.',
  confirmPinInvalid: 'Clave incorrecta. Intenta de nuevo.',
  confirmYes: 'SÍ, SOY YO',
  confirmNo: 'ESPERA, ME EQUIVOQUÉ',

  assigningMessages: [
    'Analizando tus posibilidades...',
    'Consultando al comité internacional del chisme...',
    'Calculando quién te debe regalo...',
    'El destino está tomando una decisión cuestionable...',
    'Negociando con el universo...',
    'Barajando destinos prohibidos...',
  ],

  mysteryTitle: '🎁 TU DESTINO ESTÁ LISTO',
  mysteryHint: '¿Realmente quieres saber quién te tocó?',
  revealButton: '🔥 DESCUBRIR MI DESTINO 🔥',
  giveHintButton: '✍️ Dar pista a mi amigo secreto',
  myHintButton: '🕵️ Pista para mí',

  writeHintTitle: 'Deja una pista',
  writeHintIntro:
    'Escribe un acertijo o adivinanza para la persona a la que le darás regalo. La idea es que intente adivinar quién eres… sin decir tu nombre.',
  writeHintTips:
    'Puede ser algo que te guste, un recuerdo, una frase típica tuya o una pista absurda. Sé creativo/a.',
  writeHintPlaceholder: 'Ej: Me encanta el café y siempre llego tarde a las reuniones…',
  writeHintSave: 'GUARDAR PISTA',
  writeHintSaved: '¡Pista guardada! Tu amigo secreto podrá verla.',
  writeHintBack: 'VOLVER',
  writeHintTooShort: 'La pista es muy corta. Escribe al menos unas palabras.',
  writeHintError: 'No se pudo guardar. Intenta de nuevo.',

  readHintTitle: 'Pista para ti',
  readHintEmpty: 'Aún no tienes pistas. Tu amigo secreto todavía no dejó ninguna.',
  readHintIntro: 'Alguien te dejó esta pista. ¿Puedes adivinar quién te dará regalo?',
  readHintBack: 'VOLVER',
  readHintLoading: 'Buscando pistas secretas...',
  readHintError: 'No se pudo cargar la pista. Intenta de nuevo.',

  resultLabel: 'TE TOCÓ',
  understoodButton: 'ENTENDIDO 🤫',
  afterUnderstood: 'Ahora cierra esta página y actúa como si no supieras nada.',
  backHomeButton: '🏠 VOLVER AL INICIO',
  /** Se abre en otra pestaña al pulsar ENTENDIDO */
  understoodYoutubeUrl: 'https://www.youtube.com/watch?v=k85mRPqvMbE',

  errorTitle: '😬 El comité secreto tuvo un pequeño problema.',
  errorHint: 'No cierres la misión. Intenta nuevamente.',
  retryButton: 'REINTENTAR',

  /** Duraciones en ms */
  assigningDurationMs: 3200,
  spinDurationMs: 4200,
  spinTickMs: 120,

  /** Volumen de la música de fondo (0–1). Archivo: public/audio/bg-music.mp3 */
  musicVolume: 0.35,

  colors: {
    bgDeep: '#0b1220',
    bgMid: '#132238',
    crimson: '#c41e3a',
    gold: '#e8b84a',
    goldSoft: '#f5d78e',
    mint: '#3dd6c6',
    cream: '#f7f1e5',
    ink: '#0a0f18',
  },

  storageKeys: {
    participantId: 'sf3000_participant_id',
    revealed: 'sf3000_revealed',
    accessPin: 'sf3000_access_pin',
    soundEnabled: 'sf3000_sound',
  },
} as const

export type GameConfig = typeof gameConfig
