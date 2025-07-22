from .errors import UnkownParameterTypeError
from .models import AngleOfAttackParameter, SpeedParameter, TurbulenceModelParameter

ParameterUnion = AngleOfAttackParameter | SpeedParameter | TurbulenceModelParameter


class ParameterRegistry:
    """Parameter registry to safely load parameters from database."""

    def __init__(self):
        """Initialize parameter registry with available parameter types."""
        self.parameters = {
            "angle_of_attack": AngleOfAttackParameter,
            "speed": SpeedParameter,
            "turbulence_model": TurbulenceModelParameter,
        }

    def load(self, parameter_data: dict) -> ParameterUnion:
        """Load a parameter from a dictionary."""
        parameter_type = parameter_data.get("type")
        if parameter_type not in self.parameters:
            raise UnkownParameterTypeError(parameter_type)

        parameter_class = self.parameters[parameter_type]
        return parameter_class.model_validate(parameter_data)
