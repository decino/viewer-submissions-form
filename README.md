## Getting started

> **Important!** this requires Node `^20.19`, `^22.13` or `>=24.11` (TypeORM 1.x) and TypeScript 7.

`.env` file must be created for this application to work. rename `.envExample` to `.env` and fill out the SMTP info.

The site is a React app in `frontend/`. The backend serves the built app from `static/`, and in development the Vite dev server proxies `/rest` and `/socket.io` to the backend on `127.0.0.1:8081` (set `PORT=127.0.0.1:8081` in `.env`, or change `BACKEND` in `frontend/vite.config.ts`).

```batch
# add directories (once after cloning)
    mkdir customWads

# install dependencies
    npm install
    cd frontend && npm install

# build database
    npm run runmigration

# serve the backend in development mode (builds it first)
    npm run start:dev

# serve the frontend with hot reload, in a second terminal, then open http://localhost:5173
    cd frontend && npm run dev

# build for production
    cd frontend && npm run build
    npm run build
    npm run start:prod
```

`npm run start:dev` is for dev and `npm run start:prod` is for prod

### production

In order for production to work (and to an extent, docker), you will need to fill in all SMTP info for the system to use when sending emails.

in your `.env` file you will need:

```dotenv
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
REPLY_TO=
```

These settings are validated on startup, however, they are NOT required if your `NODE_ENV` is `development` because in this case, a fake SMTP service is started, look at the logs in startup for the user/pass and the URL to log in to the smtp server

### captcha

Cloudflare Turnstile protects the submission form and the admin login. Leave `CAPTCHA_SERVICE` unset to turn it off.

```dotenv
CAPTCHA_SERVICE=turnstile
CAPTCHA_SITE_KEY=
CAPTCHA_SECRET_KEY=
```

## Docker

```
# build docker image
docker compose build

# start docker image
docker compose up
```
