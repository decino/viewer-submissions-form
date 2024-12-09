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
