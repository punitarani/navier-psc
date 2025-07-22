from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from models import (
    HealthResponse,
    ParameterSweepConfigRequest,
    ParameterSweepConfigResponse,
)

from .configurator.configurator import ParameterSweepConfigurator
from .configurator.registry import ParameterRegistry
from .simulation.demo import simulation_manager

app = FastAPI(
    title="Parameter-Sweep Configurator",
    description="API for configuring and managing parameter sweeps",
    version="0.1.0",
)


@app.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint at root."""
    return HealthResponse(status="healthy", message="Server is running")


@app.post("/config", response_model=ParameterSweepConfigResponse)
async def create_config(
    config: ParameterSweepConfigRequest,
) -> ParameterSweepConfigResponse:
    """Create a new parameter sweep configuration."""
    # Convert request parameters to internal parameter models
    registry = ParameterRegistry()
    parameters = []

    for param_req in config.parameters:
        # Map request format to internal parameter format
        param_data = {
            "type": param_req.key,  # Use key as type for now
            "datatype": param_req.type,
            "values": param_req.values,
        }
        parameters.append(registry.load(param_data))

    configurator = await ParameterSweepConfigurator.create(
        name=config.name, description=config.description, parameters=parameters
    )

    # Convert response back to API format
    return ParameterSweepConfigResponse(
        id=configurator.id,
        name=configurator.name,
        description=configurator.description,
        parameters=[
            {"key": param.type, "type": param.datatype.value, "values": param.values}
            for param in configurator.parameters
        ],
    )


@app.get("/config")
async def get_configs() -> None:
    """Query all parameter sweep configurations."""
    raise NotImplementedError("Not implemented")


@app.get("/config/{id}", response_model=ParameterSweepConfigResponse)
async def get_config(id: str) -> ParameterSweepConfigResponse:
    """Get a parameter sweep configuration."""
    from uuid import UUID

    configurator = await ParameterSweepConfigurator.load(UUID(id))

    return ParameterSweepConfigResponse(
        id=configurator.id,
        name=configurator.name,
        description=configurator.description,
        parameters=[param.serialize() for param in configurator.parameters],
    )


@app.post("/config/{id}")
async def run_config(id: str) -> dict:
    """Run a parameter sweep configuration.

    This endpoint will start a background task to run the simulation.
    Monitor the status of the simulation with `WS /ws/configs/{id}`.
    """
    from uuid import UUID

    try:
        config_id = UUID(id)
    except ValueError:
        return {"error": "Invalid UUID"}

    configurator = await ParameterSweepConfigurator.load(config_id)

    if simulation_manager.is_running(config_id):
        return {
            "status": "already_running",
            "message": "Simulation is already running for this configuration",
        }

    configurator.run()
    return {"status": "started", "message": "Simulation started successfully"}


@app.websocket("/ws/configs/{id}")
async def stream_config_status(websocket: WebSocket, id: str):
    """Stream the status of a parameter sweep configuration.

    Call `POST /config/{id}` to start the simulation.
    """
    from uuid import UUID

    try:
        config_id = UUID(id)
    except ValueError:
        await websocket.close(code=1003, reason="Invalid UUID")
        return

    await websocket.accept()

    # Add connection to simulation manager
    simulation_manager.add_connection(config_id, websocket)

    try:
        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        # Remove connection when disconnected
        simulation_manager.remove_connection(config_id, websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
