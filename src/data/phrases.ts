/** Frases post-revelación — agrega las que quieras. */
export const revealPhrases: string[] = [
  'Buena suerte. La vas a necesitar.',
  'Ahora tienes una misión.',
  'Recuerda: nadie sabe que sabes.',
  'Actúa sorprendido cuando llegue el regalo.',
  'El destino ha hablado. No aceptamos reclamos.',
  'Felicidades. O no.',
  'Tu billetera acaba de recibir una mala noticia.',
  'Por favor, intenta que no se note que ya sabes.',
  'El comité secreto confía en tu discreción. Más o menos.',
  'Guarda este secreto mejor que tus contraseñas.',
  'Operación: fingir sorpresa. Empieza YA.',
  'Si lo cuentas, el destino te encontrará.',
]

export function pickRevealPhrase(): string {
  const i = Math.floor(Math.random() * revealPhrases.length)
  return revealPhrases[i] ?? revealPhrases[0]
}
