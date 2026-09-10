/**
 * Lista de participantes (frontend).
 * Los `id` DEBEN coincidir con los de supabase/schema.sql.
 * Fotos en /public/participants/
 */
export type Participant = {
  id: string
  name: string
  image: string
}

export const participants: Participant[] = [
  { id: 'michael', name: 'Michael', image: './participants/michael.jpg' },
  { id: 'JuanDavid', name: 'Juan David', image: './participants/juandavid.jpeg' },
  { id: 'kley', name: 'Kley', image: './participants/kley.jpeg' },
  { id: 'JuanLuis', name: 'Juan Luis', image: './participants/juanluis.jpeg' },
  { id: 'Maryuris', name: 'Maryuris', image: './participants/maryu.jpeg' },
  { id: 'Paula', name: 'Paula', image: './participants/paula.jpeg' },
  { id: 'Yeiner', name: 'Yeiner', image: './participants/yeiner.png' },
  { id: 'diana', name: 'Diana', image: './participants/diana.jpeg' },
]

export function getParticipantById(id: string): Participant | undefined {
  return participants.find((p) => p.id === id)
}

export function getOtherParticipants(excludeId: string): Participant[] {
  return participants.filter((p) => p.id !== excludeId)
}
