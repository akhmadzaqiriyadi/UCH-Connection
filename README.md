# UCH Connection - Elysia.js Project

A modern web server built with [Elysia.js](https://elysiajs.com/) and [Bun](https://bun.sh/).

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)

## Installation

Install dependencies:

```bash
bun install
```

## Development

Run the development server with hot reload:

```bash
bun run dev
```

The server will start at `http://localhost:3000`

## Production

Build the project:

```bash
bun run build
```

Run the production server:

```bash
bun run start
```

## Available Endpoints

- `GET /` - Welcome message with timestamp
- `GET /health` - Health check and uptime information
- `GET /hello/:name` - Personalized greeting
- `POST /echo` - Echo back the request body

## Project Structure

```
uty-connection/
├── src/
│   └── index.ts        # Main application entry point
├── dist/               # Build output (generated)
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Run production server
- `bun run build` - Build for production
- `bun run clean` - Clean build output

## Learn More

- [Elysia.js Documentation](https://elysiajs.com/)
- [Bun Documentation](https://bun.sh/docs)
