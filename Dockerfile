FROM node:lts AS base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY . .

FROM base AS production

RUN npm run build && mkdir -p customWads data

ENV NODE_ENV=production

EXPOSE 8081

CMD ["sh", "-c", "node dist/db/runMigration.js && exec node dist/index.js"]
