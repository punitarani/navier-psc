from uuid import UUID, uuid4

from sqlalchemy import delete, select

from psc.db import async_session_factory
from psc.schemas import ParameterSweepConfig

from .errors import ConfigurationNotFoundError
from .registry import ParameterRegistry, ParameterUnion


class ParameterSweepConfigurator:
    """Parameter sweep configurator."""

    def __init__(
        self,
        id: UUID,
        name: str,
        description: str,
        parameters: list[ParameterUnion],
    ):
        """Initialize parameter sweep configurator."""
        self.id = id
        self.name = name
        self.description = description
        self.parameters = parameters

    @classmethod
    async def create(
        cls, name: str, description: str, parameters: list[ParameterUnion]
    ) -> "ParameterSweepConfigurator":
        """Create a parameter sweep configurator."""
        id = uuid4()

        # Save to database
        async with async_session_factory() as session:
            config = ParameterSweepConfig(
                id=id,
                name=name,
                description=description,
                parameters=[param.serialize() for param in parameters],
                parameter_count=len(parameters),
            )
            session.add(config)
            await session.commit()

        return cls(id=id, name=name, description=description, parameters=parameters)

    @classmethod
    async def load(cls, id: UUID) -> "ParameterSweepConfigurator":
        """Load a parameter sweep configurator."""
        async with async_session_factory() as session:
            stmt = select(ParameterSweepConfig).where(ParameterSweepConfig.id == id)
            result = await session.execute(stmt)
            config = result.scalar_one_or_none()

            if config is None:
                raise ConfigurationNotFoundError(id)

            registry = ParameterRegistry()
            return cls(
                id=config.id,
                name=config.name,
                description=config.description,
                parameters=[registry.load(param_data) for param_data in config.parameters],
            )

    @classmethod
    async def delete(cls, id: UUID) -> None:
        """Delete a parameter sweep configurator."""
        async with async_session_factory() as session:
            # First check if the configuration exists
            stmt = select(ParameterSweepConfig).where(ParameterSweepConfig.id == id)
            result = await session.execute(stmt)
            config = result.scalar_one_or_none()

            if config is None:
                raise ConfigurationNotFoundError(id)

            # Delete the configuration
            delete_stmt = delete(ParameterSweepConfig).where(ParameterSweepConfig.id == id)
            await session.execute(delete_stmt)
            await session.commit()

    def run(self):
        """Run the parameter sweep."""
        from psc.simulation.demo import simulation_manager

        simulation_manager.start_simulation(self.id, self.parameters)
