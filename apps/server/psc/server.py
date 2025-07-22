from uuid import UUID

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from psc.configurator.configurator import ParameterSweepConfigurator
from psc.configurator.errors import ConfigurationNotFoundError
from psc.configurator.registry import ParameterRegistry
from psc.db import async_session_factory
from psc.models import (
    BaseResponse,
    HealthResponse,
    ParameterDefinition,
    ParameterSweepConfigurationModel,
    ParameterSweepConfigurationRequest,
    SimulationStatusModel,
)
from psc.schemas import ParameterSweepConfig, SimulationStatus
from psc.simulation import simulation_manager

app = FastAPI(
    title="Parameter-Sweep Configurator",
    description="API for configuring and managing parameter sweeps",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint at root."""
    return HealthResponse(status="healthy", message="Server is running")


@app.get("/parameters", response_model=list[ParameterDefinition])
async def get_parameters() -> list[ParameterDefinition]:
    """Get all available parameter definitions."""
    registry = ParameterRegistry()
    schemas = registry.schema
    return [ParameterDefinition.model_validate(schema) for schema in schemas]


@app.post("/configs", response_model=ParameterSweepConfigurationModel)
async def create_config(
    config: ParameterSweepConfigurationRequest,
) -> ParameterSweepConfigurationModel:
    """Create a new parameter sweep configuration."""
    # Convert request parameters to internal parameter models
    registry = ParameterRegistry()
    parameters = [registry.load(param.model_dump()) for param in config.parameters]

    # Validate the parameters before creating the configurator
    try:
        for param in parameters:
            param.validate()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Parameter validation failed: {str(e)}") from e

    configurator = await ParameterSweepConfigurator.create(
        name=config.name, description=config.description, parameters=parameters
    )

    # Convert response back to API format
    return ParameterSweepConfigurationModel(
        id=configurator.id,
        name=configurator.name,
        description=configurator.description,
        parameters=[
            {"key": param.key, "type": param.key, "values": param.values}
            for param in configurator.parameters
        ],
    )


@app.get("/configs", response_model=list[ParameterSweepConfigurationModel])
async def get_configs() -> list[ParameterSweepConfigurationModel]:
    """Query all parameter sweep configurations."""

    # TODO: this is a demo to query all the configs from the database
    # In practice, we should use query params to paginate the configs
    async with async_session_factory() as session:
        stmt = select(ParameterSweepConfig).order_by(ParameterSweepConfig.created_at.desc())
        result = await session.execute(stmt)
        configs = result.scalars().all()

        registry = ParameterRegistry()
        return [
            ParameterSweepConfigurationModel(
                id=config.id,
                name=config.name,
                description=config.description,
                parameters=[
                    registry.load(param_data).serialize() for param_data in config.parameters
                ],
            )
            for config in configs
        ]


@app.get("/configs/{id}", response_model=ParameterSweepConfigurationModel)
async def get_config(id: UUID) -> ParameterSweepConfigurationModel:
    """Get a parameter sweep configuration."""
    try:
        configurator = await ParameterSweepConfigurator.load(id)
    except ConfigurationNotFoundError as e:
        raise HTTPException(status_code=404, detail="Configuration not found") from e

    return ParameterSweepConfigurationModel(
        id=configurator.id,
        name=configurator.name,
        description=configurator.description,
        parameters=[param.serialize() for param in configurator.parameters],
    )


@app.delete("/configs/{id}", response_model=BaseResponse)
async def delete_config(id: UUID) -> BaseResponse:
    """Delete a parameter sweep configuration."""
    try:
        await ParameterSweepConfigurator.delete(id)
        return BaseResponse(status="success", message="Configuration deleted successfully")
    except ConfigurationNotFoundError as e:
        raise HTTPException(status_code=404, detail="Configuration not found") from e


@app.post("/configs/run/{id}", response_model=BaseResponse)
async def run_config(id: UUID) -> BaseResponse:
    """Run a parameter sweep configuration.

    This endpoint will start a background task to run the simulation.
    Monitor the status of the simulation with `WS /ws/configs/{id}`.
    """

    try:
        configurator = await ParameterSweepConfigurator.load(id)
    except ConfigurationNotFoundError as e:
        raise HTTPException(status_code=404, detail="Configuration not found") from e

    if simulation_manager.is_running(id):
        return BaseResponse(
            status="already_running",
            message="Simulation is already running for this configuration",
        )

    configurator.run()
    return BaseResponse(status="started", message="Simulation started successfully")


@app.get("/configs/run/{id}", response_model=list[SimulationStatusModel])
async def get_simulation_runs(id: UUID) -> list[SimulationStatusModel]:
    """Get simulation runs for a specific configuration."""
    async with async_session_factory() as session:
        stmt = (
            select(SimulationStatus)
            .where(SimulationStatus.config_id == id)
            .order_by(SimulationStatus.created_at.desc())
        )
        result = await session.execute(stmt)
        simulations = result.scalars().all()

        return [
            SimulationStatusModel(
                id=sim.id,
                config_id=sim.config_id,
                progress=sim.progress,
                state=sim.state,
                created_at=sim.created_at.isoformat(),
            )
            for sim in simulations
        ]


@app.websocket("/ws/configs/{id}")
async def stream_config_status(websocket: WebSocket, id: UUID):
    """Stream the status of a parameter sweep configuration.

    Call `POST /configs/{id}` to start the simulation.
    """
    await websocket.accept()

    # Add connection to simulation manager
    simulation_manager.add_connection(id, websocket)

    try:
        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        # Remove connection when disconnected
        simulation_manager.remove_connection(id, websocket)
