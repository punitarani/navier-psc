from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class BaseResponse(BaseModel):
    """Response model for configuration status operations."""

    status: str
    message: str


class HealthResponse(BaseResponse):
    """Health check response model."""

    status: str = "healthy"
    message: str = "Server is running"


class ValidationRule(BaseModel):
    """Validation rule model."""

    type: Literal["value", "length"]
    min_value: int | float | None = None
    max_value: int | float | None = None


class ParameterDefinition(BaseModel):
    """Parameter definition model for GET /parameters endpoint.

    This matches the schema returned by parameter classes.
    """

    name: str
    description: str
    key: str
    type: str
    allowed_values: list[str] | list[float] | None = None
    validation_rules: list[ValidationRule] | None = None


class ParameterModel(BaseModel):
    """Parameter model for parameter sweep configuration."""

    key: str
    type: str
    values: list[float | str]


class ParameterSweepConfigurationRequest(BaseModel):
    """Parameter sweep configuration model."""

    name: str
    description: str
    parameters: list[ParameterModel]


class ParameterSweepConfigurationModel(ParameterSweepConfigurationRequest):
    """Response model for parameter sweep configuration."""

    id: UUID


class SimulationStatusModel(BaseModel):
    """Response model for simulation status."""

    id: UUID
    config_id: UUID
    progress: int
    state: str
    created_at: str
