# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture Overview

This is a React Flow application built with Vite, featuring an interactive node-based flow diagram system. The application demonstrates a parent-child node relationship pattern with dynamic edge highlighting.

### Core Components

- **FlowCanvas** (`src/components/FlowCanvas.jsx`): Main container managing ReactFlow state, loads data from mock API, handles node/edge interactions and child selection highlighting
- **ParentNode** (`src/components/ParentNode.jsx`): Simple source node representing a data product/server
- **GroupNode** (`src/components/GroupNode.jsx`): Complex node containing multiple child items with individual click handlers and dynamic edge highlighting
- **ChildNode** (`src/components/ChildNode.jsx`): Individual child items within GroupNode (referenced but not found in current structure)

### Key Patterns

- **State Management**: Uses ReactFlow's `useNodesState` and `useEdgesState` hooks for flow state management
- **Child Selection**: Implements callback pattern where GroupNode notifies FlowCanvas of child selections via `onChildSelect` prop
- **Edge Highlighting**: Dynamic edge styling based on selected child nodes - selected edges are highlighted in blue (#3b82f6)
- **Mock API Integration**: Asynchronous data loading with loading states and error handling via `mockApi.getFlowData()`

### Mock API Service

The `mockApi` service (`src/services/mockApi.js`) provides:
- Simulated network delays (800ms default)
- Multiple data variants: default, microservices, network
- Generates 10 edges connecting parent to group node children
- Includes metadata for connections (bandwidth, connection type)

### Node Types Configuration

Custom node types are registered in FlowCanvas:
```javascript
const nodeTypes = {
  parent: ParentNode,
  group: GroupNode,
};
```

### Styling

- Main styles in `src/styles/flow.css`
- Uses CSS classes: `.parent-node`, `.group-node`, `.child-item`, `.selected`
- Inline styles for loading/error states and positioning

### Data Flow

1. FlowCanvas loads data from mockApi on mount
2. Nodes and edges are set in ReactFlow state
3. Child selections in GroupNode trigger callback to FlowCanvas
4. FlowCanvas updates edge styles based on selections
5. Nodes are dynamically enhanced with callback functions before rendering