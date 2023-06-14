## Getting started

> **Important!** this requires Node >= 14, Express >= 4 and TypeScript >= 4.

`.env` file must be created for this application to work. rename `.envExample` to `.env` and fill out the SMTP info.

```batch
# install dependencies
    npm install

# serve
    npm run start

# build for production
    npm run build
    npm run start:prod
```
    
## Docker

```
# build docker image
docker compose build

# start docker image
docker compose up
```

## Barrelsby

This project uses [barrelsby](https://www.npmjs.com/package/barrelsby) to generate index files to import the
controllers.

Edit `.barrelsby.json` to customize it:

```json
{
  "directory": [
    "./src/controllers/rest",
    "./src/controllers/pages"
  ],
  "exclude": [
    "__mock__",
    "__mocks__",
    ".spec.ts"
  ],
  "delete": true
}
```
