from enum import Enum
from typing import Literal

from pydantic import BaseModel, field_validator


class ParameterType(Enum):
    """Parameter type enum."""

    ANGLE_OF_ATTACK = "angle_of_attack"
    SPEED = "speed"
    TURBULENCE_MODEL = "turbulence_model"


class ParameterDataType(Enum):
    """Parameter data type enum."""

    FLOAT = "float"
    INTEGER = "integer"
    ENUM = "enum"


class BaseParameter(BaseModel):
    """Base parameter model."""

    type: ParameterType
    datatype: ParameterDataType
    values: list[float] | list[int] | list[str]

    def serialize(self) -> dict:
        """Serialize the parameter to a dictionary."""
        return {
            "type": self.type.value,
            "datatype": self.datatype.value,
            "values": self.values,
        }


class AngleOfAttackParameter(BaseParameter):
    """Angle of attack parameter model."""

    type: Literal["angle_of_attack"] = "angle_of_attack"
    values: list[float]

    @field_validator("values")
    @classmethod
    def validate_angle_values(cls, v):
        """Validate angle of attack values are within reasonable range."""
        for value in v:
            if not -90 <= value <= 90:
                raise ValueError(f"Angle of attack {value} must be between -90 and 90 degrees")
        return v


class SpeedParameter(BaseParameter):
    """Speed parameter model."""

    type: Literal["speed"] = "speed"
    values: list[float]

    @field_validator("values")
    @classmethod
    def validate_speed_values(cls, v):
        """Validate speed values are positive."""
        for value in v:
            if value <= 0:
                raise ValueError(f"Speed {value} must be positive")
        return v


class TurbulenceModelParameter(BaseParameter):
    """Turbulence model parameter model."""

    type: Literal["turbulence_model"] = "turbulence_model"
    values: list[str]

    @field_validator("values")
    @classmethod
    def validate_turbulence_models(cls, v):
        """Validate turbulence model values are from allowed set."""
        allowed_models = {
            "k-epsilon",
            "k-omega",
        }
        for value in v:
            if value not in allowed_models:
                raise ValueError(
                    f"Turbulence model '{value}' not in allowed models: {allowed_models}"
                )
        return v
