This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Autenticación y base de datos

La app usa **NextAuth** con usuario/contraseña y **PostgreSQL** para sesiones y notas.

1. Copiá `.env.example` a `.env` y completá:
   - `DATABASE_URL`: conexión a PostgreSQL (ej. Supabase, Neon o local).
   - `NEXTAUTH_SECRET`: generá uno con `openssl rand -base64 32`.
   - `NEXTAUTH_URL`: en local `http://localhost:3000`.

2. Creá las tablas en la base:
   ```bash
   npm run db:push
   # o, para migraciones versionadas:
   npm run db:migrate
   ```

3. Registro: entrá a **Registrarse** (sidebar o `/auth/signup`) y creá una cuenta. Las notas se guardan en la BD cuando estás logueado y se sincronizan entre dispositivos.

## Docker

**Desarrollo** (PostgreSQL + app con hot reload):

```bash
docker compose up -d db
# Primera vez: aplicar schema
docker compose run --rm app bunx prisma db push
# Arrancar app en dev
docker compose up app
```

App en http://localhost:3000, DB en localhost:5432 (usuario `notions`, contraseña `notions`, base `notions`). Creá un `.env` con `NEXTAUTH_SECRET` o usá el valor por defecto del compose.

**Producción** (imagen con Bun, migraciones al arrancar):

```bash
docker build -t notions .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://tu-dominio.com" \
  notions
```

Al iniciar el contenedor se ejecuta `prisma migrate deploy` y luego `bun run start`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
