# ReembolsaJus

App web para upload e análise de extratos/recibos em PDF com geração de relatório, autenticação (Clerk), pagamentos (Stripe) e persistência via Postgres (Neon) + Drizzle.

## Stack

- Vite + React + TypeScript
- Express (servidor único que também serve o Vite em dev)
- Drizzle ORM + Neon/Postgres
- Clerk (auth)
- Stripe (assinaturas)

## Rodar localmente

```sh
npm i
cp .env.example .env
npm run dev
```

O servidor sobe em `http://localhost:5000` (ou na porta definida em `PORT`).

## Variáveis de ambiente

Edite o arquivo `.env` (não commitar). Template em `.env.example`.

- `DATABASE_URL`: URL do Postgres
- `VITE_CLERK_PUBLISHABLE_KEY`: chave pública do Clerk (frontend)
- `CLERK_SECRET_KEY`: chave secreta do Clerk (backend)
- `STRIPE_SECRET_KEY`: chave secreta do Stripe (backend)
- `STRIPE_PUBLISHABLE_KEY`: chave pública do Stripe (frontend, se aplicável)
- `STRIPE_PRICE_ID`: price id do plano
- `STRIPE_WEBHOOK_SECRET`: segredo do webhook (`POST /api/webhook`)
- `AI_INTEGRATIONS_OPENAI_API_KEY` (opcional): para classificação via IA

## Scripts úteis

- `npm run lint`
- `npm run build`
- `npm run start`
- `npm run db:push`
- `npm run db:studio`
