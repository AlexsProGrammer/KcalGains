# KcalGains

Track your food and sports with a fully local, free fitness workspace.

## Development

Install dependencies with either package manager:

```bash
npm install
npm run dev
```

Or:

```bash
pnpm install
pnpm dev
```

The development server is available at `http://localhost:5173`.

To test from another device on the same network, use:

```bash
npm run dev:host
# or
pnpm dev:host
```

The pnpm configuration explicitly permits esbuild's required install step. If pnpm still reports an ignored build, run `pnpm install` once from the project root and then retry the dev command.

Build and preview the production bundle with:

```bash
npm run build
npm run preview
```
