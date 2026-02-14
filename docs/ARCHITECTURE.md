# Alloy Studio Architecture

## Overview

Alloy Studio is a full-stack web application designed to simplify the creation and validation of Grafana Alloy configuration files. The architecture follows a clean separation between frontend and backend, with a focus on modularity and extensibility.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Vite                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Builder   │  │    Editor    │  │   Recipes   │  │  │
│  │  │     Mode    │  │     Mode     │  │   Library   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  Monaco Editor (Syntax Highlighting, IntelliSense)│ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  Zustand State Management                         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Go + Fiber Framework                                 │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │  API Layer  │  │  Validation  │  │   Catalog   │  │  │
│  │  │  (Handlers) │  │    Layer     │  │   Service   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│                   ┌──────────────────┐                       │
│                   │   Alloy CLI      │                       │
│                   │  (validate, fmt) │                       │
│                   └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── editor/           # Code editor components
│   │   ├── MonacoEditor.tsx
│   │   ├── Toolbar.tsx
│   │   └── IntelliSense.ts
│   ├── builder/          # Guided builder
│   │   ├── ComponentPicker.tsx
│   │   ├── DynamicForm.tsx
│   │   └── LivePreview.tsx
│   ├── navigation/       # Navigation components
│   │   ├── SignalNav.tsx
│   │   └── RecipeLibrary.tsx
│   └── ui/              # Reusable UI components
│       └── button.tsx
├── lib/
│   ├── api.ts           # API client
│   ├── store.ts         # State management
│   ├── types.ts         # TypeScript definitions
│   └── utils.ts         # Utility functions
└── data/
    ├── components.json  # (Embedded in backend)
    └── recipes.json     # (Embedded in backend)
```

### State Management

Using Zustand for lightweight state management:

- **App Mode**: Builder vs Editor
- **Current Config**: Active configuration text
- **Selected Components**: Components in builder mode
- **Settings**: User preferences
- **Recipe Selection**: Currently loaded recipe

### Monaco Editor Integration

Custom language support for Alloy:
- Syntax highlighting
- Autocomplete (IntelliSense)
- Inline diagnostics
- Format on save
- Bracket matching

## Backend Architecture

### Layer Structure

```
backend/
├── cmd/server/          # Application entry point
│   └── main.go
├── pkg/
│   ├── api/            # HTTP layer
│   │   └── handlers.go
│   ├── validation/     # Validation logic
│   │   └── alloy.go
│   └── catalog/        # Component & recipe catalog
│       ├── components.go
│       ├── recipes.go
│       └── data/
│           ├── components.json
│           └── recipes.json
```

### API Endpoints

#### Validation Endpoint
- **Path**: `POST /api/validate`
- **Purpose**: Validate Alloy configuration
- **Process**:
  1. Receive config and settings
  2. Write to temporary file
  3. Execute `alloy validate` CLI
  4. Parse results
  5. Return validation response

#### Format Endpoint
- **Path**: `POST /api/format`
- **Purpose**: Format Alloy configuration
- **Process**:
  1. Receive config
  2. Write to temporary file
  3. Execute `alloy fmt` CLI
  4. Return formatted config

#### Catalog Endpoints
- **Path**: `GET /api/components`
- **Purpose**: Retrieve component catalog
- **Filters**: category, signal, stability, search

- **Path**: `GET /api/recipes`
- **Purpose**: Retrieve recipe library
- **Filters**: category, signal, difficulty

## Data Models

### Component Schema
```typescript
interface Component {
  id: string;
  category: string;
  name: string;
  displayName: string;
  description: string;
  stability: StabilityLevel;
  signals: SignalType[];
  type: ComponentType;
  documentationUrl: string;
}
```

### Recipe Schema
```typescript
interface Recipe {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  signals: SignalType[];
  configuration: string;
}
```

## Security Considerations

### Backend Security
- CORS configured for specific origins
- Input validation on all endpoints
- Temporary files cleaned up after use
- No execution of arbitrary code
- Rate limiting (to be implemented)

### Frontend Security
- XSS protection via React
- Content Security Policy headers
- No inline script execution
- Sanitized user inputs

## Performance Optimizations

### Frontend
- Code splitting for routes
- Lazy loading for components
- Debounced API calls
- Virtual scrolling for large lists
- Service worker for offline catalog

### Backend
- Embedded JSON catalogs (no DB queries)
- Lightweight Fiber framework
- Concurrent request handling
- Efficient temp file management

## Deployment Architecture

### Development
```
Docker Compose:
├── Frontend (Vite dev server)
├── Backend (Go server)
└── Alloy (CLI binary container)
```

### Production
```
Frontend:
├── Build: Static files
└── Deploy: GitHub Pages

Backend:
├── Build: Go binary
└── Deploy: Cloud platform (Railway, Render, Fly.io)
```

## Extension Points

### Adding New Components
1. Update `components.json`
2. No code changes required
3. Automatic catalog refresh

### Adding New Recipes
1. Update `recipes.json`
2. No code changes required
3. Automatic library refresh

### Custom Validation Rules
1. Extend `validation/alloy.go`
2. Add custom validators
3. Update API responses

## Future Architecture Enhancements

- **GraphQL API**: Replace REST with GraphQL
- **Database Layer**: Store user configurations
- **Authentication**: User accounts and saved configs
- **Collaborative Editing**: Real-time multi-user
- **WebAssembly**: Run Alloy validation in browser
- **Plugin System**: Community-contributed components

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 | UI components |
| Frontend Build | Vite | Fast builds & HMR |
| Frontend Language | TypeScript | Type safety |
| Frontend UI | shadcn/ui + Tailwind | Beautiful components |
| Frontend State | Zustand | State management |
| Frontend Editor | Monaco Editor | Code editing |
| Backend Framework | Go + Fiber | HTTP server |
| Backend Validation | Alloy CLI | Config validation |
| Backend Data | Embedded JSON | Component catalog |
| Deployment | Docker Compose | Development |
| CI/CD | GitHub Actions | Automation |
| Hosting | GitHub Pages | Static frontend |

## Monitoring & Observability

(To be implemented)

- Frontend error tracking
- Backend request logging
- Performance metrics
- User analytics
- Validation success rates
