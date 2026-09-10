# 🎁 Amigo Secreto 3000

Aplicación web estática (React + TypeScript + Vite) para un juego de **Amigo Secreto / Amigo Invisible**, con asignaciones atómicas en **Supabase** y despliegue en **GitHub Pages**.

## Claves de acceso (PINs) — para los participantes

Dale a cada persona **solo su clave**, en privado. Al confirmar su carta en la app, deben ingresarla.

| Participante | PIN    |
|--------------|--------|
| Michael      | `4812` |
| Kley         | `7390` |
| Juan Luis    | `1564` |
| Juan David   | `9023` |
| Maryuris     | `4471` |
| Paula        | `6288` |
| Yeiner       | `3157` |
| Diana        | `8841` |

Para cambiar un PIN en Supabase:

```sql
update public.participants set access_pin = 'NUEVO' where id = 'michael';
```

## 1. Instalar

```bash
cd secret_friend
npm install
```

## 2. Ejecutar en local

1. Copia `.env.example` → `.env.local`
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Ejecuta el SQL de Supabase (paso 4)
4. Arranca:

```bash
npm run dev
```

## 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **Project Settings → API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 4. Ejecutar el SQL

1. En Supabase: **SQL Editor → New query**
2. Pega y ejecuta todo el contenido de `supabase/schema.sql`
3. Eso crea tablas, constraints, RLS y las funciones RPC

## 5. Agregar participantes

Edita **ambos** sitios (mismo `id`):

1. `src/data/participants.ts` (nombre + foto; **sin** PIN)
2. Tabla `participants` en Supabase (incluye `access_pin`)

Las claves **solo viven en la base de datos**, nunca en el frontend.

```sql
insert into public.participants (id, name, image_path, access_pin, sort_order)
values ('ana', 'Ana', '/participants/ana.webp', '4821', 8)
on conflict (id) do update set
  name = excluded.name,
  image_path = excluded.image_path,
  access_pin = excluded.access_pin,
  sort_order = excluded.sort_order;
```

Cambiar el PIN de alguien:

```sql
update public.participants set access_pin = '9999' where id = 'michael';
```

### ¿Si alguien entra varias veces le toca otro amigo?

**No.** La asignación es fija. Cada vez que entra con su PIN recibe **el mismo** destinatario. Solo cambia con `reset_game()`.

Si ya corriste el schema viejo sin PINs, ejecuta también `supabase/migration_add_pins.sql`.

Si ya hubo un sorteo, **reinicia la partida** (paso 10) para incluir a un participante nuevo.

## 6. Agregar fotografías

Coloca las imágenes en:

```text
public/participants/
```

Ejemplos: `michael.webp`, `laura.webp`, `ana.webp`

Actualiza la ruta en `participants.ts`. Puedes reemplazar los `.svg` de ejemplo.

## 7. Modificar frases / textos

| Qué | Dónde |
|-----|--------|
| Textos de pantallas, duraciones, colores | `src/config/game.ts` |
| Frases post-revelación | `src/data/phrases.ts` |
| Participantes | `src/data/participants.ts` |

## 8. Desplegar en GitHub Pages

1. Sube esta carpeta como repositorio (o el contenido de `secret_friend` como root del repo)
2. En GitHub: **Settings → Pages → Source = GitHub Actions**
3. En **Settings → Secrets and variables → Actions**, crea:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push a `main` (o ejecuta el workflow manualmente)
5. El workflow `.github/workflows/deploy.yml` construye y publica

Vite usa `base: './'` para que funcione en project pages.

## 9. Variables de entorno

Archivo local: `.env.local` (no se sube al repo)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_ACOTADO=true
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # solo para npm run claims
```

En GitHub Pages: mismos nombres como **Actions secrets** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, y si aplica `VITE_ACOTADO`).

## Modo acotado vs random

| `VITE_ACOTADO` | Comportamiento |
|----------------|----------------|
| `true` | Pares fijos: Kley→Michael, Juan Luis→Maryuris, Michael→Paula. El resto al azar (válido). |
| `false` | Sorteo **100% random** entre todos (nadie se autoasigna). |

### Para jugar random (no acotado)

1. En `.env.local` pon:

```env
VITE_ACOTADO=false
```

2. Reinicia el frontend (`Ctrl+C` y `npm run dev`) para que lea la variable.

3. En Supabase → **SQL Editor**, genera un sorteo nuevo en modo random:

```sql
update public.games set acotado = false where id = 'default';
select public._generate_derangement();
```

4. Pide a los participantes que limpien `localStorage` (o usen ventana privada) si ya habían entrado.

### Para volver al modo acotado

1. `.env.local` → `VITE_ACOTADO=true`
2. Reinicia `npm run dev`
3. En SQL:

```sql
update public.games set acotado = true where id = 'default';
select public._generate_derangement();
```

(O ejecuta `supabase/paso2_acotado_reset.sql`.)

**Importante:** cambiar solo el `.env` **no** rehace el sorteo. Siempre debes regenerar las asignaciones en SQL después de cambiar el modo.

## 10. Reiniciar una partida

Desde el **SQL Editor** de Supabase (no está expuesto al frontend):

**Random:**

```sql
update public.games set acotado = false where id = 'default';
select public._generate_derangement();
```

**Acotado:**

```sql
update public.games set acotado = true where id = 'default';
select public._generate_derangement();
```

Eso:

- borra las asignaciones anteriores
- genera un **nuevo** emparejamiento
- deja la partida lista otra vez

También conviene limpiar `localStorage` en los navegadores de los participantes (o pedirles que usen una ventana privada). Claves: `sf3000_participant_id`, `sf3000_revealed`, `sf3000_access_pin`.

---

## Cómo funciona el algoritmo de asignación

No se usa `Math.random()` en el navegador para decidir el destinatario.

1. La primera llamada a `claim_assignment(participant_id)` (o un `reset_game`) **bloquea** la fila del juego (`FOR UPDATE`).
2. Si no hay asignaciones, PostgreSQL genera un **derangement** con el **algoritmo de Sattolo**: una permutación cíclica aleatoria donde **nadie se autoasigna**.
3. Se insertan **todas** las parejas `giver → receiver` de una vez, con constraints:
   - `giver ≠ receiver`
   - `giver` único
   - `receiver` único
4. Cada participante solo **lee** su pareja precalculada. Llamadas repetidas son **idempotentes**.

Esto garantiza que el último participante siempre tiene destinatario válido (ciclo cerrado).

## Cómo se evita que dos personas reciban al mismo destinatario

- Unicidad en BD: `unique (game_id, receiver_id)`
- Generación completa bajo lock transaccional antes de servir resultados
- El frontend **no** puede insertar/leer la tabla `assignments` (RLS sin políticas de acceso)
- Solo la RPC `claim_assignment` (SECURITY DEFINER) devuelve **tu** destinatario

Dos usuarios simultáneos: uno espera el lock; ambos reciben parejas distintas del mismo derangement.

## Privacidad

- No hay pantalla de “todas las parejas”
- `localStorage` solo guarda tu id y si ya revelaste
- La animación de ruleta muestra nombres/fotos de otros solo como **decoración aleatoria**, no el orden real del sorteo

## Estructura

```text
secret_friend/
  public/participants/     # fotos
  supabase/schema.sql      # tablas + RPC
  src/
    config/game.ts
    data/participants.ts
    data/phrases.ts
    lib/
    services/
    hooks/
    components/
    pages/
    styles/
  .env.example
  .github/workflows/deploy.yml
```

## Scripts

```bash
npm run dev      # local
npm run build    # producción
npm run preview  # previsualizar build
```
