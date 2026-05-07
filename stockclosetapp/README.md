# Stock Closet

Stock Closet is a Next.js + Supabase inventory app for quick retail lookups.

Core goals:
- Find a product instantly with search.
- View price and quantity without memorizing item details.
- Add, edit, and remove inventory records in one place.

## Tech Stack

- Next.js App Router (TypeScript)
- Supabase Postgres + RLS
- Supabase JS client SDK

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create your env file.

```bash
cp .env.example .env.local
```

3. Fill in Supabase values in `.env.local`.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. In Supabase SQL editor, run `supabase/schema.sql`.

5. Start the app.

```bash
npm run dev
```

## Current Features (MVP)

- Inventory dashboard with KPIs.
- Search by name, SKU, and category.
- Add new items.
- Edit item details (price, quantity, etc.).
- Remove items.

## Data Model

Main table: `public.inventory_items`

Fields:
- `id`
- `name`
- `sku`
- `category`
- `quantity`
- `price`
- `image_url`
- `notes`
- `created_at`
- `updated_at`

## Next Senior-Dev Priorities

1. Add auth and role-based permissions (manager vs cashier).
2. Add stock movement history (adjustments, sales, restocks).
3. Add barcode scanner flow for quick lookup.
4. Add tests (unit + integration + E2E).
5. Harden RLS policies for production.
