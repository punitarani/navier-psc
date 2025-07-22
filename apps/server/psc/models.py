from uuid import UUID

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str = "healthy"
    message: str = "Server is running"


class ParameterRequest(BaseModel):
    """Single parameter in a sweep configuration request."""

    key: str
    type: str  # "float" or "enum"
    values: list[float | str]


class ParameterSweepConfigRequest(BaseModel):
    """Request model for creating parameter sweep configuration."""

    name: str
    description: str
    parameters: list[ParameterRequest]


class ParameterResponse(BaseModel):
    """Single parameter in a sweep configuration response."""

    key: str
    type: str
    values: list[float | str]


class ParameterSweepConfigResponse(BaseModel):
    """Response model for parameter sweep configuration."""

    id: UUID
    name: str
    description: str
    parameters: list[ParameterResponse]
