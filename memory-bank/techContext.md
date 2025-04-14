# Technical Context

## 1. Core Technologies

- **Language:** TypeScript (confirmed by `tsconfig.json` and `.ts` files)
- **Runtime:** Node.js (confirmed by `package.json` and `#!/usr/bin/env node`)
- **Package Manager:** npm (confirmed by `package-lock.json`)
- **MCP Framework:** `@modelcontextprotocol/sdk` (core dependency for server logic)
- **Transport:** Stdio (using `@modelcontextprotocol/sdk/server/stdio.js`)
- **Testing Framework:** Jest (confirmed by configs)
- **Transpiler:** TSC (implied by `tsconfig.json` build settings, Babel config might be for Jest or other purposes).
- **External API:** Mercury Coder API (confirmed `API_CONFIG` in `src/config/index.ts`)

## 2. Key Libraries/Dependencies (from code review)

- **`@modelcontextprotocol/sdk`:** Core for MCP server functionality.
- **`axios`:** Used for making HTTP requests to the Mercury API.
- **`zod`:** Used for schema definition and validation.
- **`zlib`:** Built-in Node module used for Gzip compression.
- **`fs`, `path`, `util`:** Built-in Node modules for file system access, path manipulation, and utilities (promisify).

## 3. Development Environment

- **OS:** win32 (User's environment)
- **Setup:** Requires Node.js, npm. Requires `MERCURY_API_KEY` environment variable.
- **Build Process:** Check `package.json` scripts. Likely `tsc` via `npm run build`.
- **Running:** `node build/index.js` (as per `index.ts` structure) or `npm start` if defined.
- **Testing:** `npm test` (using Jest).

## 4. API Integration Details (Mercury API)

- **Endpoint:** `https://api.inceptionlabs.ai/v1/chat/completions` (default, configurable via `MERCURY_API_URL` env var).
- **Authentication:** Bearer Token (`MERCURY_API_KEY` env var).
- **Request/Response Format:** JSON. Sends `model`, `messages` (user role, content=prompt), `max_tokens`. Expects response like `{ choices: [{ message: { content: "..." } }] }`.

## 5. Tooling

- **Linting/Formatting:** Not explicitly identified yet (check `package.json` devDependencies).
- **CI/CD:** Not specified. 