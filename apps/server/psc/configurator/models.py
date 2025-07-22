from abc import ABC, abstractmethod
from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel

from psc.models import ValidationRule

from .errors import (
    InvalidParameterValueError,
    ValidationLengthError,
    ValidationValueError,
)

T = TypeVar("T")


class ParameterKey(Enum):
    """Parameter key enum."""

    ANGLE_OF_ATTACK = "angle_of_attack"
    SPEED = "speed"
    TURBULENCE_MODEL = "turbulence_model"


class ParameterType(Enum):
    """Parameter data type enum."""

    FLOAT = "float"
    INTEGER = "integer"
    ENUM = "enum"


class BaseParameter(BaseModel, Generic[T], ABC):
    """Abstract base parameter model."""

    name: str
    description: str

    key: str
    type: ParameterType
    values: list[T]

    def serialize(self) -> dict:
        """Serialize the parameter to a dictionary."""
        return {
            "key": self.key,
            "type": self.type.value,
            "values": self.values,
        }

    @property
    def schema(self) -> dict:
        """Get the schema for the parameter."""
        return {
            "name": self.name,
            "description": self.description,
            "key": self.key,
            "type": self.type.value,
            "allowed_values": self.allowed_values,
            "validation_rules": (
                [rule.model_dump() for rule in self.validation_rules]
                if self.validation_rules
                else None
            ),
        }

    @classmethod
    def get_schema(cls) -> dict:
        """Get the schema for the parameter class without requiring instance values."""
        return cls(values=[]).schema

    @property
    @abstractmethod
    def allowed_values(self) -> list[T] | None:
        """Get allowed values for the parameter."""
        pass

    @property
    @abstractmethod
    def validation_rules(self) -> list[ValidationRule] | None:
        """Validation rules for the parameter."""
        pass

    def validate(self) -> None:
        """Validate the parameter."""

        # Check if each value is allowed
        if self.allowed_values:
            for value in self.values:
                if value not in self.allowed_values:
                    raise InvalidParameterValueError(value, self.allowed_values)

        # Run the validation rules
        for rule in self.validation_rules or []:
            match rule.type:
                case "length":
                    if (rule.min_value is not None and len(self.values) < rule.min_value) or (
                        rule.max_value is not None and len(self.values) > rule.max_value
                    ):
                        raise ValidationLengthError(self.values, rule.min_value, rule.max_value)

                case "value":
                    for value in self.values:
                        if (rule.min_value is not None and value < rule.min_value) or (
                            rule.max_value is not None and value > rule.max_value
                        ):
                            raise ValidationValueError(value, rule.min_value, rule.max_value)
