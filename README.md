# Parameter-Sweep Configurator

A full-stack application for creating, storing, and previewing parameter sweeps for CFD/FEA simulations.

## Quick Start

Requirements:
- Python 3.12+
- Node.js 18+
- Docker
- Bun (npm works too)
- TurboRepo

This project uses TurboRepo to manage both the Next.js frontend and the FastAPI backend.

```bash
# Install dependencies
bun install

# Start services
bun run services

# Run the app
turbo dev
```

## Background and Context

This application provides a web interface to compose parameter sweep specifications, persist them via an API, retrieve saved configurations, visualize parameter sweeps with plots, and monitor execution progress through WebSocket connections.

Parameters represent geometry properties like wing span, dihedral, and airfoil profile. No physics knowledge is required - the objective function for plotting can be arbitrary.

## Backend

**Technology**: FastAPI with Pydantic models, SQLAlchemy ORM, and OpenAPI spec

### API Endpoints

| Endpoint | Method | Purpose |
|----------|---------|----------|
| `/configs` | GET | Return list of all configs (preview format) |
| `/configs` | POST | Accept parameter sweep spec, return `{id}` (UUID) |
| `/configs/{id}` | GET | Return full spec for ID or 404 |
| `/ws/configs/{id}` | WebSocket | Stream status updates every second |

### Data Models

**Parameter Sweep Specification**:
```json
{
  "name": "string",
  "description": "string",
  "parameters": [
    {
      "key": "string",
      "type": "float | enum",
      "values": ["array of values"]
    }
  ]
}
```

**Config Preview** (GET /configs response):
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "parameter_count": "number",
    "created_at": "ISO 8601 timestamp"
  }
]
```

**WebSocket Status Message**:
```json
{
  "progress": 0-100,
  "state": "QUEUED | RUNNING | COMPLETED | FAILED"
}
```

### Requirements
- **Database**: CockroachDB (local instance)
- **ORM**: SQLAlchemy
- **Migrations**: Alembic for schema management
- **Validation**: Pydantic models returning 422 for invalid payloads
- **CORS**: Enabled for frontend communication
- **WebSocket**: Push progress updates every second (0-100)

## Frontend

**Technology**: Next.js with TypeScript and shadcn/ui components

### Application Structure

Single-page application at route `/` with state persistence via URL parameters for:
- Selected config ID (`?config=uuid`)
- View mode (`?view=create|preview|list`)

### Layout Design

#### Header
- **Left**: Application title/logo
- **Center**: Search bar (Input with search icon) for config ID lookup
- **Right**: "Create New" button (Button variant="default")

#### Main Content Area

**1. Default View (List Mode)**
- DataTable showing all configs from GET `/configs`
- Columns: Name, Description, Parameter Count, Created Date
- Row click navigates to preview mode with config ID in URL
- Pagination for large datasets

**2. Config Preview Mode**
- Triggered by: Search result, table row click, or URL param
- **Layout**: Two-column split view
  - **Left Panel (40%)**:
    - Card with config metadata (name, description)
    - Parameter list using Accordion component
    - Each parameter shows: key, type, values array
  - **Right Panel (60%)**:
    - Tabs component with:
      - "Visualization" tab: Line/scatter plot of parameter sweep
      - "JSON" tab: Formatted JSON preview using CodeBlock
      - "Status" tab: Progress bar and WebSocket status (if available)

**3. Create Mode**
- **Layout**: Two-column split view
  - **Left Panel (60%)**: Parameter Builder
    - Form with dynamic parameter list
    - Each parameter row:
      - Input for key name
      - Select for type (float/enum)
      - Dynamic value input:
        - Float: TagsInput for numeric values
        - Enum: TagsInput for string values
      - Remove button (Button variant="ghost" with X icon)
    - "Add Parameter" button at bottom
    - Config name and description inputs at top
  - **Right Panel (40%)**: Live Preview
    - Sticky Card showing:
      - Real-time JSON preview
      - "Save Configuration" button
      - Validation errors (if any)

### Component Specifications

**Search Functionality**
- Command/CommandInput for search bar
- Debounced API calls to `/configs/{id}`
- Toast notifications for not found errors

**Create Form**
- Form with react-hook-form integration
- Field validation:
  - Required: name, at least one parameter
  - Parameter key: unique, alphanumeric with underscores
  - Values: minimum 2 values per parameter
- Error display using Alert components

**Data Visualization**
- Recharts for plotting parameter sweeps
- X-axis: Parameter combinations
- Y-axis: Mock objective function (e.g., sin(x) * parameter_value)
- Interactive tooltips showing parameter values

**WebSocket Integration**
- Progress component for status display
- Auto-connect when config ID present
- Badge showing connection state
- Real-time progress updates

### State Management

**URL Parameters**
```typescript
interface URLState {
  config?: string;  // Selected config UUID
  view?: 'create' | 'preview' | 'list';
}
```

**Application State** (Context/Zustand)
```typescript
interface AppState {
  configs: ConfigPreview[];
  selectedConfig: FullConfig | null;
  isCreating: boolean;
  wsStatus: WebSocketStatus | null;
}
```

### UI Components Usage

- **Layout**: Sheet for mobile menu, Separator for visual breaks
- **Forms**: Form, Input, Select, Label, Button
- **Display**: Card, Badge, Alert, Tabs, Accordion
- **Feedback**: Toast, Progress, Skeleton (loading states)
- **Data**: DataTable with sorting and filtering
- **Visualization**: Custom Recharts integration

### Responsive Considerations

While primarily desktop-focused:
- Minimum viewport: 1024px
- Collapsible panels for smaller screens
- Sheet component for mobile navigation

### Error Handling & Edge Cases

**Backend**
- 404 for non-existent config IDs
- 422 for validation errors with detailed field messages
- WebSocket auto-reconnection with exponential backoff

**Frontend**
- Loading skeletons during data fetching
- Empty states for no configs
- Graceful WebSocket disconnection handling
- Form validation before submission
- Confirmation dialog for destructive actions

### User Flow Examples

**Creating a Config**
1. Click "Create New" → URL changes to `/?view=create`
2. Fill form with parameters → Live JSON preview updates
3. Click "Save Configuration" → POST to `/configs`
4. Success → Redirect to `/?config=uuid&view=preview`

**Searching for a Config**
1. Enter UUID in search bar
2. Debounced GET request to `/configs/{id}`
3. Found → Navigate to `/?config=uuid&view=preview`
4. Not found → Toast error, stay on current view

**Browsing Configs**
1. Default view shows DataTable of all configs
2. Click row → Navigate to preview
3. View visualization, JSON, or connect to WebSocket status
