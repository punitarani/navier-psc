# Parameter-Sweep Configurator Frontend

This is the Next.js frontend for the Parameter-Sweep Configurator, a full-stack application for creating, storing, and previewing parameter sweeps for CFD/FEA simulations.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Backend API Integration

This frontend connects to a FastAPI backend that provides the following endpoints:

- `GET /` - Health check
- `GET /parameters` - Get available parameter definitions
- `POST /configs` - Create parameter sweep configuration
- `GET /configs` - List all configurations
- `GET /configs/{id}` - Get specific configuration
- `DELETE /configs/{id}` - Delete configuration
- `POST /configs/run/{id}` - Start simulation run
- `GET /configs/run/{id}` - Get simulation runs
- `WS /ws/configs/{id}` - WebSocket for progress updates

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
