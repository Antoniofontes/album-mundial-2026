# Álbum Mundial 2026 ⚽🏆

App web (PWA instalable en celular) para llevar la cuenta del **álbum Panini FIFA World Cup 2026** — 980 figuritas, 48 selecciones.

## Funcionalidades

- ✅ Marcar las 980 figuritas como "tengo / repetida / falta" (un toque cicla los estados)
- 📸 **Escanear el álbum con la cámara**: la IA (Claude Vision) detecta las figuritas pegadas y las marca automáticamente
- 👥 **Comunidad**: anotar quién (amigos no registrados o usuarios públicos) tiene cada figurita para arreglar intercambios
- 🏆 **Leaderboard** público de los que más tienen
- 🔗 **Modo invitado**: cualquiera puede ver tu álbum por link sin registrarse
- 📱 **PWA**: instalable como app en iOS/Android sin pasar por App/Play Store
- 🔒 Auth por **link mágico** (sin contraseñas) con Supabase

## Stack

- Next.js 16 + React 19 + TypeScript + Tailwind 4
- Supabase (auth + Postgres + storage de fotos + RLS)
- Anthropic Claude `claude-sonnet-4-5` para visión OCR
- Zustand para estado optimista local
- Vercel para deploy

## Setup local

```bash
npm install
cp .env.example .env.local  # completar valores
npm run dev
```

### Variables de entorno

| Var | Dónde se obtiene |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → `Project URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon public` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `NEXT_PUBLIC_SITE_URL` | URL pública (Vercel la setea sola) |

## Setup Supabase (una vez)

1. Crear proyecto en https://supabase.com
2. SQL Editor → pegar el contenido de [`supabase/schema.sql`](./supabase/schema.sql) → Run
3. Authentication → Providers → habilitar **Email** (con magic link)
4. Authentication → URL Configuration → agregar tu dominio de Vercel a **Redirect URLs** (ej: `https://album-mundial-2026.vercel.app/auth/callback`)

El bucket de storage `album-scans` se crea solo desde el SQL.

## Deploy en Vercel

```bash
npx vercel --prod
```

Después en el dashboard cargá las 3 env vars (las `NEXT_PUBLIC_*` y `ANTHROPIC_API_KEY`).

## Estructura

```
src/
  app/
    (app)/              # rutas con auth requerida + tabbar
      album/            # álbum interactivo
      comunidad/        # amigos + asignar figuritas
      leaderboard/      # top coleccionistas
      scan/             # subir foto y escanear
      perfil/           # configuración + compartir
    api/scan/           # endpoint Claude Vision
    auth/callback/      # OAuth callback Supabase
    u/[username]/       # perfil público (modo invitado)
    login/              # magic link
    page.tsx            # landing
  components/           # StickerCell, TabBar, PWAInstaller, etc.
  lib/
    teams.ts            # 48 selecciones con grupos
    album.ts            # generador de los 980 stickers
    store.ts            # Zustand + sync optimista a Supabase
    supabase/           # clientes browser/server + types
  proxy.ts              # session refresh (Next 16 "proxy")

supabase/schema.sql      # tablas + RLS + storage + trigger
public/
  manifest.webmanifest   # PWA manifest
  sw.js                  # service worker offline-first
  icons/                 # iconos generados
scripts/generate-icons.mjs  # genera iconos a partir de SVG
```

## Cómo se cuentan las 980 figuritas

```
12   intro/historia/trofeo
48   escudos de selección
864  jugadores (48 equipos × 18 jugadores)
16   estadios (sedes USA + México + Canadá)
12   exclusivas Coca-Cola
8    leyendas históricas del Mundial
20   especiales brillantes/foil
---- ----------
980  total
```

Los nombres de jugadores se cargan con plantillas tentativas para Argentina, Brasil, Francia, España, Inglaterra, Portugal y Alemania (al 04/2026). Para los demás equipos quedan placeholders editables (`Jugador 1`, `Jugador 2`...). Cuando Panini publique la checklist final se pueden completar fácil editando `src/lib/album.ts`.

## Licencia / Disclaimer

App **no oficial**. Hecha por hinchas, para hinchas. Las marcas Panini, FIFA y los nombres de jugadores son propiedad de sus respectivos dueños.
