import asyncio
import json
from uuid import UUID


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
        """Run a demo simulation that sends status updates every second."""
        total_steps = 10

        for step in range(total_steps + 1):
            if not self.has_listeners(config_id):
                # No listeners, skip this update
                await asyncio.sleep(1)
                continue

            status_data = {
                "config_id": str(config_id),
                "status": "running" if step < total_steps else "completed",
                "progress": step / total_steps,
                "step": step,
                "total_steps": total_steps,
                "timestamp": asyncio.get_event_loop().time(),
                "parameters": (
                    [
                        {
                            "type": param.type,
                            "datatype": param.datatype.value,
                            "values": param.values,
                        }
                        for param in parameters
                    ]
                    if step == 0
                    else None
                ),  # Only send parameters on first update
            }

            await self.broadcast_status(config_id, status_data)

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
