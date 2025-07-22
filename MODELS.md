# Data Models

## Overview

Data structures for parameter sweep configurations and simulation tracking in the Parameter-Sweep Configurator.

## Database Schema

### Parameter Sweep Configurations

Stored in PostgreSQL table `parameter_sweep_configs`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | VARCHAR(100) | Configuration name |
| `description` | TEXT | Optional description |
| `parameters` | JSONB | Array of parameter definitions |
| `parameter_count` | INTEGER | Number of parameters |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last modified time |

### Simulation Status

Stored in table `simulation_status`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `config_id` | UUID | Links to configuration |
| `progress` | INTEGER | Completion (0-100) |
| `state` | VARCHAR(20) | Status (QUEUED/RUNNING/COMPLETED/FAILED) |
| `created_at` | TIMESTAMP | Start time |

## Parameter Types

### Float Parameters
Numerical values with decimals:
```json
{
  "key": "angle_of_attack",
  "type": "float", 
  "values": [0.0, 2.5, 5.0, 7.5, 10.0]
}
```

### Integer Parameters  
Whole numbers only:
```json
{
  "key": "mesh_levels",
  "type": "integer",
  "values": [1, 2, 3, 4]
}
```

### Enum Parameters
Categorical choices:
```json
{
  "key": "turbulence_model",
  "type": "enum",
  "values": ["k-epsilon", "k-omega"]
}
```

## Data Validation

### Parameter Rules
- Keys must be unique within configuration
- Minimum 2 values per parameter required
- Float/integer values must be valid numbers
- Enum values can be any strings

### Configuration Rules
- Name: required, 1-100 characters
- Description: optional
- Must have at least 1 parameter

## Example Configuration

```json
{
  "name": "Wing Study",
  "description": "Basic wing parameter sweep",
  "parameters": [
    {
      "key": "angle_of_attack",
      "type": "float",
      "values": [0, 5, 10, 15]
    },
    {
      "key": "speed", 
      "type": "float",
      "values": [10.0, 20.0, 30.0]
    },
    {
      "key": "turbulence_model",
      "type": "enum",
      "values": ["k-epsilon", "k-omega"]
    }
  ]
}
```

This creates 4 × 3 × 2 = 24 parameter combinations.

## WebSocket Status Updates

Real-time simulation progress via WebSocket:

```json
{
  "progress": 75,
  "state": "RUNNING"
}
```

Progress values: 0-100  
States: QUEUED, RUNNING, COMPLETED, FAILED