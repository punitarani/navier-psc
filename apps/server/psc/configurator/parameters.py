from typing import Literal

from .models import BaseParameter, ParameterType, ValidationRule


class AngleOfAttackParameter(BaseParameter[float]):
    """Angle of attack parameter model."""

    name: str = "Angle of Attack"
    description: str = "Angle of attack in degrees for aerodynamic analysis"

    key: Literal["angle_of_attack"] = "angle_of_attack"
    type: ParameterType = ParameterType.FLOAT
    values: list[float]

    @property
    def allowed_values(self) -> list[float] | None:
        """Get allowed values for angle of attack (None for continuous range)."""
        return None

    @property
    def validation_rules(self) -> list[ValidationRule] | None:
        """Validation rules for angle of attack."""
        return [ValidationRule(type="value", min_value=-90.0, max_value=90.0)]


class SpeedParameter(BaseParameter[float]):
    """Speed parameter model."""

    name: str = "Speed"
    description: str = "Flow speed for fluid dynamics simulation"

    key: Literal["speed"] = "speed"
    type: ParameterType = ParameterType.FLOAT
    values: list[float]

    @property
    def allowed_values(self) -> list[float] | None:
        """Get allowed values for speed (None for continuous range)."""
        return None

    @property
    def validation_rules(self) -> list[ValidationRule] | None:
        """Validation rules for speed."""
        return [ValidationRule(type="value", min_value=0.0)]


class TurbulenceModelParameter(BaseParameter[str]):
    """Turbulence model parameter model."""

    name: str = "Turbulence Model"
    description: str = "Turbulence model for CFD simulation"

    key: Literal["turbulence_model"] = "turbulence_model"
    type: ParameterType = ParameterType.ENUM
    values: list[str]

    @property
    def allowed_values(self) -> list[str] | None:
        """Get allowed values for turbulence model."""
        return ["k-epsilon", "k-omega"]

    @property
    def validation_rules(self) -> list[ValidationRule] | None:
        """Validation rules for turbulence model."""
        return None
