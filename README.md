# QuantumLearn AI — Frontend (SIH26140)

React + TypeScript + Vite frontend for the QuantumLearn AI platform. It talks to the separate FastAPI backend; it never fakes simulation, scoring, or analytics data.

## Prerequisites
- Node.js 20 or newer
- The FastAPI backend running (default `http://localhost:8000`) with CORS allowing the frontend origin

## Setup
```bash
npm install
cp .env.example .env      # then edit if your backend URL differs
npm run dev               # http://localhost:5173
```

`.env` holds **public** config only:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
Never put `AI_API_KEY`, `DATABASE_URL`, `SECRET_KEY`, or `JWT_SECRET_KEY` in the frontend.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest (circuit validation, angle parsing, probability rows) |

## Backend contract (what the code assumes)
Contract endpoints are used as given. Where the contract left a shape open, the code reads several common key spellings and **never invents a value** — missing fields show as "not available". If something doesn't match your backend, fix it in one place:

| Concern | File |
| --- | --- |
| Token response keys, refresh body `{refresh_token}` | `src/api/client.ts`, `src/api/auth.ts` |
| Simulation request envelope `{ circuit }` | `buildRunPayload` in `src/api/simulations.ts` |
| Simulation response (probabilities, counts, statevector, Bloch, depth, gate counts, time) | `normalizeSimulation` in `src/api/simulations.ts` |
| Circuit save payload (flat: `name, num_qubits, shots, gates, description, tags`) | `buildPayload` in `src/api/circuits.ts` |
| Gate types (`I X Y Z H S T RX RY RZ CNOT CZ SWAP CCX`), rotation param name `theta`, qubit limit 12 | `src/quantum/circuitTypes.ts` |
| Progress / recommendations / achievements | `src/api/progress.ts` |
| AI tutor body `{ message, mode, context }` and reply keys | `src/api/ai.ts` |

**Endpoints NOT in the original contract (assumed — confirm or change):**
- `GET /challenges`, `GET /challenges/{id}`, `GET /quizzes/{id}` → `src/api/assessments.ts`
- Instructor/admin: `/instructor/students`, `/instructor/analytics`, `/admin/users`, `/admin/content`, `/admin/analytics` → `src/api/staff.ts`

Basis-state labels from the backend are shown verbatim. If it returns an unlabeled array, index `i` is written as a bitstring with q0 on the right (Qiskit order) — see `src/quantum/visualization.ts`.

## Architecture
```
src/
  api/        fetch client (auth refresh, error mapping) + one module per resource
  store/      Zustand: auth, ui (theme/level), lab (circuit + undo/redo), tutor, toast
  quantum/    gate definitions, layout, validation, visualization helpers (pure, tested)
  components/ ui/ layout/ quantum/ ai/ learning/
  pages/      Landing Auth Dashboard Learn Algorithms QuantumLab Circuits Challenges Quizzes Progress AITutor Profile Settings Role
```
- Server state: TanStack Query. Local/UI state: component state. Zustand only for cross-page state.
- Auth: access token in memory, refresh token in `localStorage`; 401 → single-flight refresh → retry; failure → login. Role routes are guarded in the UI, but the backend is the authority.
- Heavy routes (Quantum Lab, charts, staff pages) are lazy-loaded.
- Quantum Lab: click-to-place editor (keyboard accessible), multi-qubit placement by picking wires in one column, inspector with π-aware angle input, undo/redo, save/load, real simulation, probability chart, counts, paginated statevector, SVG Bloch sphere (shown only when the backend returns Bloch data).

## Keyboard shortcuts
`Ctrl/⌘ K` search · `Ctrl/⌘ S` save · `Ctrl/⌘ Enter` run · `Ctrl/⌘ Z` undo · `Ctrl/⌘ Shift Z` redo · `Ctrl/⌘ D` duplicate gate · `Delete` remove gate · arrows move gate · `Esc` cancel/deselect.

## Deploy to Vercel
1. Import the repo, framework preset **Vite**.
2. Set `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1`.
3. `vercel.json` already rewrites all routes to `index.html` (SPA).
4. On the backend, add the Vercel URL to CORS allowed origins.
