# Tree Plantation Calculator – Node.js Backend

A lightweight **Express.js** server that:
- Serves the static `legacy/` frontend at `http://localhost:5000`
- Provides the same REST API as the Python/Flask backend
- Persists all `ecotree_*` localStorage keys in **SQLite** via `better-sqlite3`
- Falls back to **in-memory** storage if SQLite is unavailable

## Quick Start

```bash
cd server
npm install
npm start
```

Open your browser at **http://localhost:5000**

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + version |
| `GET` | `/api/bootstrap` | Return all stored key-value pairs |
| `POST` | `/api/store` | Bulk save `[{ key, value }, ...]` |
| `GET` | `/api/store/:key` | Read a single key |
| `PUT` | `/api/store/:key` | Write a single key |
| `DELETE` | `/api/store/:key` | Delete a single key |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP port to listen on |

## Files

```
server/
├── app.js           → Express entry point
├── package.json     → Dependencies
├── routes/
│   └── api.js       → All /api/* endpoints
└── README.md        → This file
```

## Alternatives

You can also use the original **Python/Flask** backend in `legacy/backend/`:

```bash
cd legacy/backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Both backends expose identical API contracts and use the same localStorage key naming convention (`ecotree_*`). Run whichever you prefer — the frontend auto-detects which backend is active.

## Notes

- The SQLite file `eco_tree.db` is created in `server/` and is safe to back up.
- If `better-sqlite3` fails to build (e.g., missing build tools), the server falls back to in-memory storage automatically and still serves all static files.
- For production, consider using `pm2` or a similar process manager.
