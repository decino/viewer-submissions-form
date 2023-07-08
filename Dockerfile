ARG NODE_VERSION=16.20.1

FROM node:${NODE_VERSION}-alpine as runtime
ENV WORKDIR /opt
WORKDIR $WORKDIR
COPY . .
COPY processes.config.js .

RUN apk update && apk add build-base git curl
RUN npm install -g pm2

RUN npm install
RUN npm run build

EXPOSE 8081
ENV PORT 8081
ENV NODE_ENV production
CMD ["pm2-runtime", "start", "processes.config.js", "--env", "production"]
