import { getParticipantById, type Participant } from '../data/participants'
import { getSupabase, isAcotadoMode, isSupabaseConfigured } from '../lib/supabase'

export type AssignmentResult = {
  giver: Participant
  receiver: Participant
  claimedAt: string | null
}

export class AssignmentError extends Error {
  code: 'PIN_INVALID' | 'PIN_REQUIRED' | 'CLAIM_FAILED' | 'SUPABASE_NOT_CONFIGURED'

  constructor(
    code: AssignmentError['code'],
    message: string,
  ) {
    super(message)
    this.code = code
    this.name = 'AssignmentError'
  }
}

type RpcPayload = {
  giver: { id: string; name: string; image_path: string }
  receiver: { id: string; name: string; image_path: string }
  claimed_at: string | null
}

function mapPerson(p: { id: string; name: string; image_path: string }): Participant {
  const local = getParticipantById(p.id)
  return {
    id: p.id,
    name: local?.name ?? p.name,
    image: local?.image ?? p.image_path,
  }
}

/**
 * Solicita (o recupera) la asignación del participante.
 * Requiere PIN. Idempotente: llamadas repetidas → mismo destinatario.
 * Pasa VITE_ACOTADO solo cuando todavía no hay sorteo (la BD lo aplica al generar).
 */
export async function claimAssignment(
  participantId: string,
  accessPin: string,
): Promise<AssignmentResult> {
  if (!isSupabaseConfigured()) {
    throw new AssignmentError('SUPABASE_NOT_CONFIGURED', 'Supabase no configurado')
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('claim_assignment', {
    p_participant_id: participantId,
    p_access_pin: accessPin.trim(),
    p_acotado: isAcotadoMode(),
  })

  if (error) {
    console.error('[claim_assignment]', error)
    const msg = error.message || ''
    if (msg.includes('PIN_INVALID')) {
      throw new AssignmentError('PIN_INVALID', 'PIN incorrecto')
    }
    if (msg.includes('PIN_REQUIRED')) {
      throw new AssignmentError('PIN_REQUIRED', 'PIN requerido')
    }
    throw new AssignmentError('CLAIM_FAILED', msg || 'CLAIM_FAILED')
  }

  const payload = data as RpcPayload
  if (!payload?.giver || !payload?.receiver) {
    throw new AssignmentError('CLAIM_FAILED', 'INVALID_RESPONSE')
  }

  return {
    giver: mapPerson(payload.giver),
    receiver: mapPerson(payload.receiver),
    claimedAt: payload.claimed_at,
  }
}
