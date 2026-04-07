# tms-geosun-base

Angular 21 application for GeoSun transport management scenarios.

## Tech stack

- Angular `21.2.x`
- Angular Material/CDK `21.2.x`
- TypeScript `5.9.x`
- i18n: `@ngx-translate/core` + `@ngx-translate/http-loader`

## Requirements

- Node.js `>=20`
- npm `>=10`

## Getting started

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm start
```

Application is available at `http://localhost:4200/`.

## Build

Production build:

```bash
npm run build
```

Artifacts are generated in `dist/tms-geosun-base`.

## Tests

Unit tests are temporarily disabled in `package.json` (`npm test` returns a placeholder message).

To restore Karma tests, set script `test` back to:

```bash
ng test
```

## Deployment

### GitHub Actions

Deployment is configured via `.github/workflows/deploy.yml` and runs on push to `main` or `master`.

### Manual deploy to GitHub Pages

```bash
npm run deploy
```

The deploy command uses:

- base href: `/tms-geosun-base/`
- output directory: `dist/tms-geosun-base`

## Useful commands

```bash
npm run watch
npm run ng -- version
```
