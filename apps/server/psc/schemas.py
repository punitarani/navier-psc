import uuid

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from psc.db import Base


class ParameterSweepConfig(Base):
    """Main table for storing parameter sweep configurations."""

    __tablename__ = "parameter_sweep_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False, default="")

    parameters = Column(
        JSONB,
        nullable=False,
        comment="Array of parameter objects with key, type, and values",
    )

    # Computed column for quick access
    parameter_count = Column(
        Integer, nullable=False, comment="Number of parameters in this configuration"
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Add GIN index for JSONB queries
    __table_args__ = (Index("idx_parameters_gin", "parameters", postgresql_using="gin"),)

    def __repr__(self):
        """Return string representation of ParameterSweepConfig."""
        return f"<ParameterSweepConfig(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "parameter_count": self.parameter_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_preview(self):
        """Convert to preview format for list endpoint."""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "parameter_count": self.parameter_count,
            "created_at": self.created_at.isoformat(),
        }


class SimulationStatus(Base):
    """Table for tracking simulation status.

    Persists WebSocket state across server restarts.
    """

    __tablename__ = "simulation_status"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    config_id = Column(UUID(as_uuid=True), nullable=False)

    progress = Column(Integer, nullable=False, default=0, comment="Progress from 0 to 100")

    state = Column(
        String(20),
        nullable=False,
        default="QUEUED",
        comment="QUEUED | RUNNING | COMPLETED | FAILED",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Index on config_id and created_at for quick lookups
    __table_args__ = (Index("idx_config_id_created_at", "config_id", "created_at"),)

    def __repr__(self):
        """Return string representation of SimulationStatus."""
        return (
            f"<SimulationStatus(id={self.id}, config_id={self.config_id}, "
            f"progress={self.progress}, state={self.state}, created_at={self.created_at})>"
        )

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "config_id": str(self.config_id),
            "progress": self.progress,
            "state": self.state,
            "created_at": self.created_at.isoformat(),
        }
