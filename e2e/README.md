# Pruebas E2E (Playwright) con BD

Las pruebas usan la app real contra PostgreSQL.

## Requisitos

- Node y npm
- Docker (para la base de datos)
- Navegadores Playwright instalados (`npx playwright install chromium`)

## Pasos

### 1. Levantar la base de datos

```bash
docker-compose up -d db
```

### 2. Variables de entorno

Crea `.env` en la raíz con al menos:

```
DATABASE_URL=postgresql://notions:notions@localhost:5432/notions
NEXTAUTH_SECRET=un-secreto-estable-para-jwt
```

(O exporta `DATABASE_URL` y `NEXTAUTH_SECRET` en la sesión antes de correr los tests.)

### 3. Ejecutar las pruebas

```bash
npm run test:e2e
```

Esto:

- Ejecuta el **global setup** (`db push` + `db seed`) para dejar la BD al día y crear el usuario `e2e@test.com` / `e2e-password-123`.
- Arranca la app con `npm run dev` (si no está ya en marcha).
- Lanza los tests en Chromium.

### 4. (Opcional) Interfaz de Playwright

```bash
npm run test:e2e:ui
```

## Tests incluidos

- **Sin login (localStorage):** carga inicial, crear nota, cambiar entre notas y ver título correcto.
- **Con login (BD):** login con usuario de seed, crear nota, crear dos notas y cambiar entre ellas.

Si algo falla, revisa que la BD esté arriba, que `DATABASE_URL` y `NEXTAUTH_SECRET` estén definidos y que hayas ejecutado al menos una vez `npx playwright install chromium`.
