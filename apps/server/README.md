# Parameter-Sweep Configurator Server

A FastAPI-based server for configuring and managing parameter sweeps.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **Pydantic**: Data validation and serialization using Python type hints
- **Ruff**: Fast Python linter and formatter
- **Poetry**: Dependency management and packaging

## Setup

1. Install dependencies:
   ```bash
   cd apps/server
   poetry install
   ```

2. Activate the virtual environment:
   ```bash
   poetry shell
   ```

## Development

### Running the Server

```bash
# From the apps/server directory
poetry run python src/server/main.py
```

The server will be available at `http://localhost:8000`.

### API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

### Code Formatting and Linting

This project uses Ruff for both linting and formatting:

```bash
# Format code
poetry run ruff format .

# Lint code
poetry run ruff check .

# Lint and fix auto-fixable issues
poetry run ruff check --fix .
```

### Testing

```bash
# Run tests
poetry run pytest

# Run tests in parallel
poetry run pytest -n auto
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `POST /config` - Create parameter sweep configuration
- `GET /config/{config_name}` - Get parameter sweep configuration

## Database

This project uses SQLAlchemy with asyncpg for async PostgreSQL operations and Alembic for database migrations.

### Prerequisites

- PostgreSQL database running
- Python dependencies installed via Poetry

### Database Configuration

The database connection is configured in `src/db.py` with the following default URL:
```
postgresql+asyncpg://postgres:postgres@localhost:5432/psc
```

Override with the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql+asyncpg://username:password@host:port/database"
```

### Migration Commands

#### Create a new migration
```bash
poetry run alembic revision --autogenerate -m "description of changes"
```

#### Apply migrations
```bash
poetry run alembic upgrade head
```

#### View migration history
```bash
poetry run alembic history
```

#### Downgrade to previous migration
```bash
poetry run alembic downgrade -1
```

### Database Models

Models should inherit from `Base` imported from `src.db`:

```python
from src.db import Base
from sqlalchemy import Column, Integer, String

class ExampleModel(Base):
    __tablename__ = "example"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
```

### Database Sessions

Use the `get_db_session` dependency in FastAPI endpoints:

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.db import get_db_session

@app.get("/example")
async def example_endpoint(db: AsyncSession = Depends(get_db_session)):
    # Database operations here
    pass
```

## Configuration

The Ruff configuration is defined in `pyproject.toml` with the following settings:
- Line length: 100 characters
- Target Python version: 3.12+
- Enabled lints: pycodestyle, pyflakes, isort, flake8-bugbear, flake8-comprehensions, pyupgrade, pydocstyle
- Code formatting with double quotes and 4-space indentation
