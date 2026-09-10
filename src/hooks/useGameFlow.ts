import { useCallback, useEffect, useReducer, useRef } from 'react'
import { pickRevealPhrase } from '../data/phrases'
import { getParticipantById, type Participant } from '../data/participants'
import {
  loadAccessPin,
  loadParticipantId,
  loadRevealed,
  saveAccessPin,
  saveParticipantId,
  saveRevealed,
} from '../lib/storage'
import {
  AssignmentError,
  claimAssignment,
  type AssignmentResult,
} from '../services/assignment'
import { gameConfig } from '../config/game'

export type Screen =
  | 'welcome'
  | 'identify'
  | 'confirm'
  | 'assigning'
  | 'mystery'
  | 'write-hint'
  | 'read-hint'
  | 'revealing'
  | 'revealed'
  | 'error'

type State = {
  screen: Screen
  returnTo: 'mystery' | 'revealed'
  selected: Participant | null
  assignment: AssignmentResult | null
  accessPin: string | null
  phrase: string
  errorMessage: string | null
  pinError: string | null
  loading: boolean
}

type Action =
  | { type: 'ENTER' }
  | { type: 'SELECT'; participant: Participant }
  | { type: 'CANCEL_CONFIRM' }
  | { type: 'START_ASSIGN' }
  | { type: 'ASSIGN_OK'; assignment: AssignmentResult; pin: string }
  | { type: 'ASSIGN_FAIL'; message: string }
  | { type: 'PIN_FAIL'; message: string }
  | { type: 'GO_MYSTERY' }
  | { type: 'OPEN_WRITE_HINT' }
  | { type: 'OPEN_READ_HINT' }
  | { type: 'CLOSE_HINT' }
  | { type: 'START_REVEAL' }
  | { type: 'FINISH_REVEAL' }
  | { type: 'UNDERSTOOD' }
  | { type: 'GO_HOME' }
  | { type: 'RETRY' }
  | {
      type: 'HYDRATE'
      participant: Participant
      assignment: AssignmentResult
      pin: string
      revealed: boolean
    }

const initial: State = {
  screen: 'welcome',
  returnTo: 'mystery',
  selected: null,
  assignment: null,
  accessPin: null,
  phrase: '',
  errorMessage: null,
  pinError: null,
  loading: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ENTER':
      return { ...state, screen: 'identify', pinError: null }
    case 'SELECT':
      return {
        ...state,
        selected: action.participant,
        screen: 'confirm',
        pinError: null,
      }
    case 'CANCEL_CONFIRM':
      return { ...state, selected: null, screen: 'identify', pinError: null }
    case 'START_ASSIGN':
      return {
        ...state,
        screen: 'assigning',
        loading: true,
        errorMessage: null,
        pinError: null,
      }
    case 'ASSIGN_OK':
      return {
        ...state,
        assignment: action.assignment,
        accessPin: action.pin,
        loading: false,
        phrase: pickRevealPhrase(),
        pinError: null,
      }
    case 'ASSIGN_FAIL':
      return {
        ...state,
        loading: false,
        screen: 'error',
        errorMessage: action.message,
      }
    case 'PIN_FAIL':
      return {
        ...state,
        loading: false,
        screen: 'confirm',
        pinError: action.message,
      }
    case 'GO_MYSTERY':
      return { ...state, screen: 'mystery', returnTo: 'mystery' }
    case 'OPEN_WRITE_HINT':
      return {
        ...state,
        returnTo: state.screen === 'revealed' ? 'revealed' : 'mystery',
        screen: 'write-hint',
      }
    case 'OPEN_READ_HINT':
      return {
        ...state,
        returnTo: state.screen === 'revealed' ? 'revealed' : 'mystery',
        screen: 'read-hint',
      }
    case 'CLOSE_HINT':
      return { ...state, screen: state.returnTo }
    case 'START_REVEAL':
      return { ...state, screen: 'revealing' }
    case 'FINISH_REVEAL':
      return { ...state, screen: 'revealed', returnTo: 'revealed' }
    case 'UNDERSTOOD':
      return { ...state, screen: 'revealed' }
    case 'GO_HOME':
      return {
        ...state,
        screen: 'welcome',
        returnTo: 'mystery',
        // Mantiene assignment/pin en memoria; al recargar vuelve a hidratar
      }
    case 'RETRY':
      return {
        ...state,
        screen: state.selected ? 'confirm' : 'identify',
        errorMessage: null,
        pinError: null,
        loading: false,
      }
    case 'HYDRATE':
      return {
        ...state,
        selected: action.participant,
        assignment: action.assignment,
        accessPin: action.pin,
        phrase: pickRevealPhrase(),
        screen: action.revealed ? 'revealed' : 'mystery',
        returnTo: action.revealed ? 'revealed' : 'mystery',
        loading: false,
        pinError: null,
      }
    default:
      return state
  }
}

export function useGameFlow() {
  const [state, dispatch] = useReducer(reducer, initial)
  const hydrated = useRef(false)
  const assignTimer = useRef<number | null>(null)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const id = loadParticipantId()
    const pin = loadAccessPin()
    if (!id || !pin) return
    const participant = getParticipantById(id)
    if (!participant) return

    let cancelled = false
    ;(async () => {
      try {
        const assignment = await claimAssignment(id, pin)
        if (cancelled) return
        dispatch({
          type: 'HYDRATE',
          participant,
          assignment,
          pin,
          revealed: loadRevealed(),
        })
      } catch (err) {
        console.warn('[hydrate]', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (assignTimer.current) window.clearTimeout(assignTimer.current)
    }
  }, [])

  const enter = useCallback(() => dispatch({ type: 'ENTER' }), [])
  const selectParticipant = useCallback((p: Participant) => {
    dispatch({ type: 'SELECT', participant: p })
  }, [])
  const cancelConfirm = useCallback(() => dispatch({ type: 'CANCEL_CONFIRM' }), [])

  const confirmIdentity = useCallback(
    async (pin: string) => {
      if (!state.selected) return
      if (pin.trim().length < 4) {
        dispatch({ type: 'PIN_FAIL', message: gameConfig.confirmPinInvalid })
        return
      }

      const participant = state.selected
      dispatch({ type: 'START_ASSIGN' })

      const started = Date.now()
      try {
        const assignment = await claimAssignment(participant.id, pin)
        saveParticipantId(participant.id)
        saveAccessPin(pin.trim())

        const elapsed = Date.now() - started
        const wait = Math.max(0, gameConfig.assigningDurationMs - elapsed)

        assignTimer.current = window.setTimeout(() => {
          dispatch({ type: 'ASSIGN_OK', assignment, pin: pin.trim() })
          dispatch({ type: 'GO_MYSTERY' })
        }, wait)
      } catch (err) {
        console.error('[confirmIdentity]', err)
        if (err instanceof AssignmentError && err.code === 'PIN_INVALID') {
          dispatch({ type: 'PIN_FAIL', message: gameConfig.confirmPinInvalid })
          return
        }
        dispatch({
          type: 'ASSIGN_FAIL',
          message: gameConfig.errorTitle,
        })
      }
    },
    [state.selected],
  )

  const startReveal = useCallback(() => {
    dispatch({ type: 'START_REVEAL' })
  }, [])

  const finishReveal = useCallback(() => {
    saveRevealed(true)
    dispatch({ type: 'FINISH_REVEAL' })
  }, [])

  const openWriteHint = useCallback(() => dispatch({ type: 'OPEN_WRITE_HINT' }), [])
  const openReadHint = useCallback(() => dispatch({ type: 'OPEN_READ_HINT' }), [])
  const closeHint = useCallback(() => dispatch({ type: 'CLOSE_HINT' }), [])
  const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), [])

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), [])

  return {
    ...state,
    enter,
    selectParticipant,
    cancelConfirm,
    confirmIdentity,
    startReveal,
    finishReveal,
    openWriteHint,
    openReadHint,
    closeHint,
    goHome,
    retry,
  }
}
