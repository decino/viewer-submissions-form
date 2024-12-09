## Getting started

> **Important!** this requires Node >= 20, Express >= 4 and TypeScript >= 5.

`.env` file must be created for this application to work. rename `.envExample` to `.env` and fill out the SMTP info.

```batch
# add directories (once after cloning)
    mkdir customWads

# install dependencies
    npm install
    
# build database
    npm run runmigration

# serve
    npm run start

# build for production
    npm run build
    npm run start:prod
```

`npm run start` is for dev and `npm run start:prod` is for prod

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

## Docker

```
# build docker image
docker compose build

# start docker image
docker compose up
```
