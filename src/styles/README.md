# Styles Directory

This directory contains all CSS modules for the React Flow application, organized by context for better maintainability.

## File Structure

```
styles/
├── index.css              # Main entry point (imports all modules)
├── variables.css          # CSS custom properties (design tokens)
├── dataproduct-node.css   # DataProduct node component styles
├── ports.css              # Port items and pagination controls
├── react-flow.css         # React Flow library overrides
├── layout.css             # Containers, loading, and error states
└── README.md              # This file
```

## Module Descriptions

### `index.css`
Main stylesheet that imports all CSS modules in the correct order. This is the only file that should be imported in JavaScript/JSX files.

**Usage:**
```javascript
import './styles/index.css'
```

### `variables.css`
Centralized CSS custom properties (CSS variables) containing all design tokens:
- Brand colors (UBS red, white)
- Node colors (background, border, text)
- Port colors (default, selected, related, lineage)
- Utility colors (shadows, grays, blues)
- State-specific colors (loading, error)

**Must be imported first** as all other modules depend on these variables.

### `dataproduct-node.css`
Styles for the `DataProductNode` component:
- Base node container (`.dataproduct-node`)
- Tag/label (`.dataproduct-tag`)
- Collapsed state (`.collapsed`)
- Expanded state (`.expanded`)
- Selected state (`.selected`)
- Header and title rows
- Node content and avatars
- Status indicators

### `ports.css`
Styles for port-related UI elements:
- Port sections and headers (`.ports-section`, `.ports-header`)
- Port items (`.port-item`)
- Port states (`.selected`, `.related`, `.in-lineage`)
- Input/output port positioning (`.input-ports`, `.output-ports`)
- Port labels
- Pagination controls (`.pagination-controls`, `.pagination-button`)

### `react-flow.css`
Overrides for React Flow library components:
- Handle styles (`.react-flow__handle`)
- Handle states (connecting, valid)
- Minimap styling (`.react-flow__minimap`)
- Controls panel (`.react-flow__controls`)

### `layout.css`
Application layout and state containers:
- Main flow container (`.flow-container`)
- Loading state (`.loading-container`, spinner animation)
- Error state (`.error-container`, `.error-content`)

## Import Order

The import order in `index.css` is critical:

1. **Variables** - Must be first (defines tokens used by all modules)
2. **Component styles** - DataProduct nodes and ports
3. **Library overrides** - React Flow customizations
4. **Layout** - Containers and utilities

## Adding New Styles

When adding new styles:

1. Determine which module the styles belong to based on context
2. If creating a new component, create a new CSS file (e.g., `new-component.css`)
3. Add the import to `index.css` in the appropriate section
4. Use existing CSS variables from `variables.css` where possible
5. Add new variables to `variables.css` if needed (don't hardcode colors)

## Naming Conventions

- **BEM-like structure**: `.component-element--modifier`
- **State classes**: `.selected`, `.expanded`, `.collapsed`, `.in-lineage`
- **CSS variables**: `--category-property` (e.g., `--port-selected-bg`)
- **Descriptive names**: Prefer clarity over brevity

## CSS Variables Usage

Always use CSS variables instead of hardcoded values:

```css
/* ✅ Good */
.my-element {
  background: var(--port-bg);
  color: var(--port-text);
  border: 1px solid var(--port-border);
}

/* ❌ Bad */
.my-element {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #e5e7eb;
}
```

## Benefits of Modular CSS

1. **Better organization** - Related styles are grouped together
2. **Easier maintenance** - Find styles quickly by context
3. **Reduced conflicts** - Smaller files reduce cognitive load
4. **Better collaboration** - Team members can work on different modules
5. **Selective loading** - Potential for code splitting in the future
6. **Clear dependencies** - Import order makes dependencies explicit
