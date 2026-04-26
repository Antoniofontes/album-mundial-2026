#!/bin/bash
# Reaplica todas las env vars al proyecto en Vercel.
# Antes de correrlo: cargá las variables locales (las podés tener en .env.local)
# o exportalas a mano:
#   export VERCEL_TOKEN=...
#   export VERCEL_SCOPE=antoniofontes2001-gmailcoms-projects
#   export NEXT_PUBLIC_SUPABASE_URL=...
#   export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   export SUPABASE_SERVICE_ROLE_KEY=...
#   export ANTHROPIC_API_KEY=...
#   export NEXT_PUBLIC_SITE_URL=https://...
set -e

if [ -f .env.local ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

: "${VERCEL_TOKEN:?Falta VERCEL_TOKEN}"
: "${VERCEL_SCOPE:?Falta VERCEL_SCOPE (ej: antoniofontes2001-gmailcoms-projects)}"
: "${NEXT_PUBLIC_SUPABASE_URL:?Falta NEXT_PUBLIC_SUPABASE_URL}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?Falta NEXT_PUBLIC_SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Falta SUPABASE_SERVICE_ROLE_KEY}"
: "${ANTHROPIC_API_KEY:?Falta ANTHROPIC_API_KEY}"
: "${NEXT_PUBLIC_SITE_URL:=http://localhost:3000}"

T="$VERCEL_TOKEN"
S="$VERCEL_SCOPE"

add () {
  local name="$1"
  local value="$2"
  local target="$3"
  echo "  → $name [$target]"
  printf '%s\n' "$value" | vercel env add "$name" "$target" --token=$T --scope=$S --force 2>&1 | tail -2
}

for env in production preview development; do
  add "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "$env"
  add "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$env"
  add "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$env"
  add "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "$env"
  add "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL" "$env"
done

echo "✅ Done"
