from .errors import UnkownParameterTypeError
from .parameters import AngleOfAttackParameter, SpeedParameter, TurbulenceModelParameter

ParameterUnion = AngleOfAttackParameter | SpeedParameter | TurbulenceModelParameter


class ParameterRegistry:
    """Parameter registry to safely load parameters from database."""

    parameters: dict[str, type[ParameterUnion]] = {
        "angle_of_attack": AngleOfAttackParameter,
        "speed": SpeedParameter,
        "turbulence_model": TurbulenceModelParameter,
    }

    def load(self, parameter_data: dict) -> ParameterUnion:
        """Load a parameter from a dictionary."""
        key = parameter_data.get("key")
        if key not in self.parameters:
            raise UnkownParameterTypeError(key)

        parameter_class = self.parameters[key]
        return parameter_class.model_validate(parameter_data)

    @property
    def schema(self) -> list[dict]:
        """Get the schema for the parameters in the registry."""
        return [param.get_schema() for param in self.parameters.values()]
