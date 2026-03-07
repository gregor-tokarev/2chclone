# 2chclone

Next.js imageboard client for the 2ch API.

## Features

- **Next.js App Router** - SSR, routing, and deployment-ready build pipeline
- **TypeScript** - Type-safe app and API models
- **Tailwind CSS** - Custom UI styling
- **2ch API integration** - Board, thread, posting, and moderation flows

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Project Structure

```
2chclone/
├── src/            # Next.js application code
├── public/         # Static assets
├── app/            # Older nested Next.js workspace copy
├── apps/           # Older monorepo app workspace
├── packages/       # Older shared package workspace
```

## Available Scripts

- `npm run dev`: Start the Next.js development server
- `npm run build`: Create a production build
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
