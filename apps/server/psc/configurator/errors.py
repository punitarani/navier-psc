class ConfigurationError(Exception):
    """Base exception for parameter sweep configurator errors."""

    pass


class ConfigurationNotFoundError(ConfigurationError):
    """Exception raised when a configuration is not found."""

    def __init__(self, id):
        """Initialize with configuration ID."""
        self.id = id
        super().__init__(f"Configuration with id {id} not found")


class UnkownParameterTypeError(ConfigurationError):
    """Exception raised when a parameter type is unknown."""

    def __init__(self, parameter_type):
        """Initialize with unknown parameter type."""
        self.parameter_type = parameter_type
        super().__init__(f"Unknown parameter type: {parameter_type}")
