import asyncio
import json
from uuid import UUID

from psc.db import async_session_factory
from psc.schemas import SimulationStatus


class SimulationManager:
    """Manages simulation tasks and WebSocket connections."""

    def __init__(self):
        """Initialize simulation manager with empty connection and task tracking."""
        self._active_connections: dict[UUID, set] = {}
        self._running_tasks: dict[UUID, asyncio.Task] = {}

    def add_connection(self, config_id: UUID, websocket) -> None:
        """Add a WebSocket connection for a configuration."""
        if config_id not in self._active_connections:
            self._active_connections[config_id] = set()
        self._active_connections[config_id].add(websocket)

    def remove_connection(self, config_id: UUID, websocket) -> None:
        """Remove a WebSocket connection for a configuration."""
        if config_id in self._active_connections:
            self._active_connections[config_id].discard(websocket)
            if not self._active_connections[config_id]:
                del self._active_connections[config_id]

    def has_listeners(self, config_id: UUID) -> bool:
        """Check if there are active listeners for a configuration."""
        return (
            config_id in self._active_connections and len(self._active_connections[config_id]) > 0
        )

    async def broadcast_status(self, config_id: UUID, status_data: dict) -> None:
        """Broadcast status update to all listeners of a configuration."""
        if config_id not in self._active_connections:
            return

        message = json.dumps(status_data)
        disconnected = set()

        for websocket in self._active_connections[config_id]:
            try:
                await websocket.send_text(message)
            except Exception:
                disconnected.add(websocket)

        # Remove disconnected websockets
        for ws in disconnected:
            self.remove_connection(config_id, ws)

    async def run_simulation(self, config_id: UUID, parameters: list) -> None:
        """Run a demo simulation that sends status updates every second from 0 to 100."""
        total_steps = 100

        for step in range(total_steps + 1):
            # Create new database entry for each state update
            async with async_session_factory() as session:
                simulation = SimulationStatus(
                    config_id=config_id,
                    progress=step,
                    state="RUNNING" if step < total_steps else "COMPLETED",
                )
                session.add(simulation)
                await session.commit()
                await session.refresh(simulation)

                # Get the complete simulation object for broadcasting
                simulation_data = simulation.to_dict()

            # Broadcast the complete simulation object
            await self.broadcast_status(config_id, simulation_data)

            if step < total_steps:
                await asyncio.sleep(1)

        # Clean up task reference
        if config_id in self._running_tasks:
            del self._running_tasks[config_id]

    def start_simulation(self, config_id: UUID, parameters: list) -> None:
        """Start a simulation as a background task."""
        if config_id in self._running_tasks:
            # Simulation already running
            return

        task = asyncio.create_task(self.run_simulation(config_id, parameters))
        self._running_tasks[config_id] = task

    def is_running(self, config_id: UUID) -> bool:
        """Check if simulation is currently running for a configuration."""
        return config_id in self._running_tasks and not self._running_tasks[config_id].done()


# Global simulation manager instance
simulation_manager = SimulationManager()
