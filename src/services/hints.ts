import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { AssignmentError } from './assignment'

export type IncomingHint = {
  hasHint: boolean
  hintText: string | null
}

export async function setMyHint(
  participantId: string,
  accessPin: string,
  hintText: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new AssignmentError('SUPABASE_NOT_CONFIGURED', 'Supabase no configurado')
  }

  const { error } = await getSupabase().rpc('set_my_hint', {
    p_participant_id: participantId,
    p_access_pin: accessPin.trim(),
    p_hint_text: hintText.trim(),
  })

  if (error) {
    console.error('[set_my_hint]', error)
    const msg = error.message || ''
    if (msg.includes('PIN_INVALID')) {
      throw new AssignmentError('PIN_INVALID', 'PIN incorrecto')
    }
    if (msg.includes('HINT_TOO_SHORT')) {
      throw new Error('HINT_TOO_SHORT')
    }
    if (msg.includes('HINT_TOO_LONG')) {
      throw new Error('HINT_TOO_LONG')
    }
    throw new AssignmentError('CLAIM_FAILED', msg)
  }
}

export async function getHintForMe(
  participantId: string,
  accessPin: string,
): Promise<IncomingHint> {
  if (!isSupabaseConfigured()) {
    throw new AssignmentError('SUPABASE_NOT_CONFIGURED', 'Supabase no configurado')
  }

  const { data, error } = await getSupabase().rpc('get_hint_for_me', {
    p_participant_id: participantId,
    p_access_pin: accessPin.trim(),
  })

  if (error) {
    console.error('[get_hint_for_me]', error)
    const msg = error.message || ''
    if (msg.includes('PIN_INVALID')) {
      throw new AssignmentError('PIN_INVALID', 'PIN incorrecto')
    }
    throw new AssignmentError('CLAIM_FAILED', msg)
  }

  const payload = data as { has_hint?: boolean; hint_text?: string | null }
  return {
    hasHint: Boolean(payload?.has_hint),
    hintText: payload?.hint_text ?? null,
  }
}

export async function getMyOutgoingHint(
  participantId: string,
  accessPin: string,
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new AssignmentError('SUPABASE_NOT_CONFIGURED', 'Supabase no configurado')
  }

  const { data, error } = await getSupabase().rpc('get_my_outgoing_hint', {
    p_participant_id: participantId,
    p_access_pin: accessPin.trim(),
  })

  if (error) {
    console.error('[get_my_outgoing_hint]', error)
    throw new AssignmentError('CLAIM_FAILED', error.message)
  }

  const payload = data as { hint_text?: string }
  return payload?.hint_text ?? ''
}
