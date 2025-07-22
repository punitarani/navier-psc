# Parameter-Sweep Configurator

A full-stack application for creating, storing, and previewing parameter sweeps for CFD/FEA simulations.

## Quick Start

Requirements:
- Python 3.12+
- Node.js 18+
- Bun (npm works too)
- Docker

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Start PostgreSQL database
bun run services

# Run database migrations
bun run db:migrate

# Start development servers
turbo dev
```

## Architecture

This is a Turborepo monorepo with:

- **Frontend** (`apps/app/`): Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend** (`apps/server/`): FastAPI with PostgreSQL database

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/configs` | GET | Get all parameter sweep configurations |
| `/configs` | POST | Create new configuration, returns UUID |
| `/configs/{id}` | GET | Get specific configuration |
| `/configs/{id}` | DELETE | Delete configuration |
| `/configs/run/{id}` | POST | Start simulation for configuration |
| `/configs/run/{id}` | GET | Get simulation runs for configuration |
| `/ws/configs/{id}` | WebSocket | Stream progress updates |

## Data Format

**Parameter Sweep Configuration**:
```json
{
  "name": "string",
  "description": "string",
  "parameters": [
    {
      "key": "string",
      "type": "float | integer | enum",
      "values": ["array of values"]
    }
  ]
}
```

## Tech Stack

### Frontend
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- React Hook Form with Zod validation
- Recharts for visualization
- Zustand for state management

### Backend
- FastAPI
- PostgreSQL with SQLAlchemy ORM
- Alembic migrations
- Pydantic validation
- WebSocket support
