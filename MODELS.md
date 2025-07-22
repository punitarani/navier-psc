# Data Models Documentation

## Overview

This document explains the data structures used in the parameter-sweep configurator for storing and managing CFD/FEA simulation configurations.

## Core Data Models

### Parameter Sweep Configuration

The main data structure that represents a complete simulation study. Each configuration contains:

- **Name**: A descriptive title for the study (e.g., "Wing Optimization Study")
- **Description**: Optional detailed explanation of what the study investigates
- **Parameters**: A list of variable parameters to sweep across
- **Metadata**: Timestamps and unique identifier for tracking

### Individual Parameters

Each parameter in a sweep represents a variable that will be changed across simulation runs. Parameters have:

- **Key**: A unique identifier used in simulation files (e.g., "angle_of_attack")
- **Type**: The data type (float, integer, enum, or boolean)
- **Values**: An array of specific values to test

### Parameter Types

#### Float Parameters
Used for continuous numerical values that can have decimal places:
- Geometric dimensions (chord length: 0.5, 1.0, 1.5, 2.0 meters)
- Physical properties (velocity: 10.5, 25.3, 40.7 m/s)
- Angles (attack angle: 0°, 2.5°, 5°, 7.5°, 10°)

#### Integer Parameters
Used for whole numbers only:
- Mesh resolution levels (1, 2, 3, 4)
- Number of processors (2, 4, 8, 16)
- Iteration counts (1000, 2000, 5000)

#### Enum Parameters
Used for categorical choices from a predefined set:
- Solver types ("RANS", "LES", "DNS")
- Turbulence models ("k-epsilon", "k-omega-sst", "spalart-allmaras")
- Material types ("aluminum", "steel", "composite")

#### Boolean Parameters
Used for simple on/off switches:
- Enable turbulence modeling (true/false)
- Use adaptive meshing (true/false)
- Include heat transfer (true/false)

### Simulation Status Tracking

For monitoring long-running simulations, the system tracks:

- **Progress**: Completion percentage (0-100%)
- **State**: Current status (QUEUED, RUNNING, COMPLETED, FAILED)
- **Configuration Link**: Which parameter sweep is being executed
- **Timestamps**: When the simulation started

## Database Storage

The system stores parameter sweep configurations in a PostgreSQL database with the following structure:

### Parameter Sweep Configurations Table

- **ID**: Unique UUID identifier for each configuration
- **Name**: Study title (up to 100 characters)
- **Description**: Detailed study explanation (unlimited text)
- **Parameters**: JSON structure containing the parameter array
- **Parameter Count**: Computed field for quick access to number of parameters
- **Created/Updated**: Timestamps for tracking when configurations were created and last modified

### Simulation Status Table

- **ID**: Unique identifier for each simulation run
- **Configuration ID**: Links back to the parameter sweep configuration
- **Progress**: Integer from 0-100 representing completion percentage  
- **State**: Current status (QUEUED, RUNNING, COMPLETED, or FAILED)
- **Created At**: When the simulation was started

## Data Validation Rules

### Parameter Keys
- Must start with a letter
- Can contain letters, numbers, and underscores
- Maximum 50 characters
- Must be unique within a configuration

### Parameter Values
- Must have at least 2 values (needed for a meaningful sweep)
- Float parameters: numeric values only
- Integer parameters: whole numbers only
- Boolean parameters: exactly true and false
- Enum parameters: any text strings

### Configuration Limits
- Name: 1-100 characters required
- Description: optional, up to 500 characters
- Must have at least 1 parameter

## Parameter Value Generation

The system provides utilities for generating parameter value arrays:

### Linear Spacing
Creates evenly spaced values between a start and end point:
- Input: start=0, end=10, steps=5
- Output: [0, 2.5, 5.0, 7.5, 10.0]

### Logarithmic Spacing  
Creates values spaced logarithmically for wide ranges:
- Input: start=1000, end=1000000, steps=4
- Output: [1000, 10000, 100000, 1000000]

## Common Parameter Presets

The system includes predefined parameter sets for typical CFD/FEA studies:

### Geometry Parameters
- **Angle of Attack**: Float values from 0° to 15° in 2.5° increments
- **Chord Length**: Float values representing wing chord dimensions

### Flow Parameters  
- **Reynolds Number**: Logarithmically spaced values from 10,000 to 10,000,000
- **Mach Number**: Float values for subsonic to transonic flow regimes

### Solver Parameters
- **Turbulence Model**: Enum choices (k-epsilon, k-omega, k-omega-sst, spalart-allmaras)
- **Mesh Refinement**: Integer levels (1, 2, 3, 4) representing mesh density

## Example Data Structure

### Complete Parameter Sweep Configuration
```json
{
  "name": "Wing Optimization Study",
  "description": "Exploring wing performance across flight conditions",
  "parameters": [
    {
      "key": "angle_of_attack",
      "type": "float",
      "values": [0, 2.5, 5, 7.5, 10, 12.5, 15]
    },
    {
      "key": "reynolds_number", 
      "type": "float",
      "values": [100000, 316227, 1000000, 3162277, 10000000]
    },
    {
      "key": "turbulence_model",
      "type": "enum", 
      "values": ["k-epsilon", "k-omega", "k-omega-sst", "spalart-allmaras"]
    },
    {
      "key": "mesh_refinement",
      "type": "integer",
      "values": [1, 2, 3, 4]
    },
    {
      "key": "enable_heat_transfer",
      "type": "boolean",
      "values": [true, false]
    }
  ]
}
```

This configuration would generate 7 × 5 × 4 × 4 × 2 = 1,120 individual simulation runs, testing every combination of the parameter values.
