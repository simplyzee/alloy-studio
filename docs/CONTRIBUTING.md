# Contributing to Alloy Studio

Thank you for your interest in contributing to Alloy Studio! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/alloy-studio.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

See the main [README.md](../README.md) for detailed setup instructions.

## Code Style

### Frontend (TypeScript/React)

- Use TypeScript for type safety
- Follow React best practices and hooks
- Use functional components
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic

### Backend (Go)

- Follow standard Go conventions
- Use `gofmt` for formatting
- Add error handling
- Write tests for new functionality
- Keep functions small and focused

## Adding New Components

To add a new Alloy component to the catalog:

1. Add the component definition to `backend/pkg/catalog/data/components.json`
2. Follow the existing schema structure
3. Include all required fields:
   - `id`: Unique identifier
   - `category`: Component category
   - `name`: Full component name
   - `displayName`: Human-readable name
   - `description`: Brief description
   - `stability`: Stability level
   - `signals`: Array of signal types
   - `type`: Component type
   - `documentationUrl`: Link to official docs

Example:
```json
{
  "id": "prometheus.scrape",
  "category": "prometheus",
  "name": "prometheus.scrape",
  "displayName": "Prometheus Scrape",
  "description": "Scrape Prometheus metrics from targets",
  "stability": "stable",
  "signals": ["metrics"],
  "type": "source",
  "documentationUrl": "https://grafana.com/docs/alloy/latest/reference/components/prometheus.scrape/"
}
```

## Adding New Recipes

To add a new recipe:

1. Add the recipe to `backend/pkg/catalog/data/recipes.json`
2. Test the configuration with actual Alloy
3. Include comprehensive documentation

Example:
```json
{
  "id": "my-recipe",
  "title": "My Recipe Title",
  "category": "category-name",
  "description": "Brief description",
  "difficulty": "beginner",
  "tags": ["tag1", "tag2"],
  "signals": ["metrics"],
  "configuration": "// Your Alloy config here"
}
```

## Testing

### Frontend Tests

```bash
cd frontend
npm run lint
npm run build
```

### Backend Tests

```bash
cd backend
go test ./...
go vet ./...
```

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include tests for new functionality
- Update documentation as needed
- Ensure all CI checks pass
- Provide a clear description of changes
- Reference related issues

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, browser, etc.)
- Screenshots if applicable

## Questions?

Feel free to open an issue for questions or discussions.

## Code of Conduct

Be respectful and inclusive. We're all here to build something great together.
