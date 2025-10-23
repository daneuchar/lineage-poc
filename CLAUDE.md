# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server with hot reload (http://localhost:5173)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture Overview

This is a **data product lineage visualization** application built with React Flow and Vite. It displays interactive data products with expandable ports, demonstrating data flow relationships and lineage tracking across multiple products.

### Core Components

#### **FlowCanvas** ([src/components/FlowCanvas.jsx](src/components/FlowCanvas.jsx))
Main container managing ReactFlow state and lineage visualization (409 lines).

**Key Responsibilities:**
- Loads data products and relationships from mock API
- Manages node expansion state and visible ports tracking
- Builds edges dynamically based on expansion state (dual edge system)
- Calculates and highlights lineage paths (upstream + downstream)
- Applies Dagre layout on initial load
- Handles node and port click events

**State Management:**
- `nodes`, `edges`: ReactFlow state hooks
- `expandedNodes`: Tracks which data products are expanded
- `visiblePorts`: Maps visible ports per node (handles pagination)
- `selectedNode`: Currently selected port/node for lineage highlighting
- `lineage`: Complete lineage data (nodes, edges, ports)
- `relationships`: Raw relationship data from API

**Key Features:**
- **Dual Edge System**: Shows "direct" node-to-node edges when collapsed, "port" port-to-port edges when both nodes expanded
- **Smart Expansion**: Expanding a node auto-expands all directly connected nodes (radius 1)
- **Lineage Highlighting**: Three-tier system - direct lineage (blue), connected nodes (gray), others (faded)
- **Handle Debouncing**: 1ms setTimeout for proper React Flow handle registration
- **Error Suppression**: Handles temporary React Flow errors during pagination transitions

#### **DataProductNode** ([src/components/DataProductNode.jsx](src/components/DataProductNode.jsx))
Custom node component representing a data product with expandable input/output ports (289 lines).

**Collapsed State:**
- Shows title with avatar
- Displays port count badges (e.g., "8 in", "5 out")
- Expand button with chevron icon
- Simple handles (left: target, right: source)

**Expanded State:**
- Full header with avatar, title, and collapse button
- Two sections: Input Ports (left) and Output Ports (right)
- Port pagination: 5 items per page with navigation controls
- Each port is clickable for lineage selection
- Ports are sorted with lineage ports appearing first

**Port Highlighting:**
- **Green background**: Port is in the selected lineage path
- **Purple background**: Port is currently selected
- **Yellow background**: Related port (currently disabled in code)
- **Gray background**: Default unselected state

**Technical Details:**
- Uses Material-UI `Avatar` component
- Updates ReactFlow's handle registry via `useUpdateNodeInternals`
- Notifies parent about visible ports for dynamic edge building
- Manages independent pagination state for inputs and outputs

### Utilities

#### **layoutUtils.js** ([src/utils/layoutUtils.js](src/utils/layoutUtils.js))
Dagre-based hierarchical layout engine (107 lines).

- **Layout Configuration**: Left-to-right (LR) direction
- **Spacing**: 150px horizontal (ranksep), 80px vertical (nodesep)
- **Dynamic Sizing**:
  - Collapsed nodes: 120px × 80px
  - Expanded nodes: 420px × (100 + visible_ports × 28 + pagination_height)
- **Edge Filtering**: Only uses "direct" edges (no handles) for layout calculation
- Assumes all nodes expanded for initial layout to prevent overlapping

#### **lineageUtils.js** ([src/utils/lineageUtils.js](src/utils/lineageUtils.js))
Comprehensive lineage traversal system (284 lines).

**Key Functions:**
- `buildLineageMaps()`: Creates adjacency structures for efficient traversal
- `findUpstreamLineage()`: Backward traversal from port to all source ports
- `findDownstreamLineage()`: Forward traversal from port to all consumer ports
- `findCompleteLineage()`: Combined upstream + downstream lineage
- `findNodeLineage()`: Simplified lineage for collapsed nodes
- `findInternalRelatedPorts()`: Finds related ports within same node (internal transformations)

**Traversal Logic:**
- Maps ports to parent nodes and edges
- Handles port-to-port relationships across nodes
- Includes internal port relationships (relatedPorts metadata)
- Returns Sets of nodes, edges, and ports in lineage

### Services

#### **mockApi.js** ([src/services/mockApi.js](src/services/mockApi.js))
Mock data provider (206 lines) with 800ms simulated delay.

**Data Structure:**
- **3 Data Products**:
  - `dataproduct-1`: "WMA Account" - 8 inputs, 8 outputs
  - `dataproduct-2`: "WMA Analytics" - 6 inputs, 7 outputs
  - `dataproduct-3`: "WMA Insights" - 6 inputs, 5 outputs

- **13 Relationships**:
  - 3 "direct" (node-to-node) relationships
  - 10 "port" (port-to-port) relationships

**Port Metadata:**
- Each port includes `relatedPorts` array defining internal node transformations
- Example: Input "Raw Data" relates to outputs "Web App" and "Database"

### Styling System

**CSS Architecture** ([src/styles/](src/styles/)):

1. **variables.css** - Design token system with CSS custom properties:
   - Brand colors: UBS Red (#e60000), White
   - Node states: Default white, selected purple (#f5f3ff)
   - Port states: Base gray, selected purple, lineage green, related yellow
   - Shadows, borders, and utility colors

2. **dataproduct-node.css** (281 lines) - Node component styles:
   - Collapsed/expanded node layouts
   - Button styles with hover states
   - Avatar and header styles
   - Port badge styles with animated dots

3. **ports.css** (144 lines) - Port item and pagination styles:
   - Port item base styles
   - Port state classes (`.selected`, `.related`, `.in-lineage`)
   - Pagination controls and page indicators
   - Input/output section positioning

4. **layout.css** (75 lines) - Container and state styles:
   - Full-screen flow container
   - Loading spinner animation
   - Error state styling

5. **react-flow.css** (43 lines) - ReactFlow library overrides:
   - Handle styling (6×6px, invisible)
   - Minimap customization
   - Control button hover states

### Node Types Configuration

Custom node types registered in [FlowCanvas.jsx:22-24](src/components/FlowCanvas.jsx#L22-L24):
```javascript
const nodeTypes = {
  dataproduct: DataProductNode,
};
```

### Key Patterns & Architecture

1. **Callback Pattern**: Parent-child communication via data callbacks
   - `onToggleExpansion()`: Handle node expand/collapse
   - `onPortSelect()`: Handle port selection for lineage
   - `onNodeClick()`: Handle collapsed node selection
   - `onVisiblePortsChange()`: Notify parent of visible ports for edge building

2. **State Debouncing**: 1ms setTimeout ensures proper React Flow handle registration before edge creation

3. **Dual Edge System**:
   - **Direct edges**: Node-to-node, shown when at least one node is collapsed
   - **Port edges**: Port-to-port, shown only when both nodes are expanded AND both ports are visible

4. **Lineage Highlighting**: Three-tier visual system
   - **Direct lineage** (blue #3b82f6, opacity 1, stroke 3px): Edges/nodes in selected lineage path
   - **Connected nodes** (gray #6b7280, opacity 0.2, stroke 2px): Nodes adjacent to lineage
   - **Other nodes** (default, opacity 0.2): All other nodes when lineage is active

5. **Smart Expansion Logic**:
   - Expanding a node triggers auto-expansion of all directly connected nodes
   - Auto-centers viewport on expanded nodes group with animation
   - Collapsing preserves viewport position

6. **Dynamic Layout**:
   - ELK/Dagre layout runs once on initial load
   - Assumes all nodes expanded for proper spacing calculation
   - Nodes expand/collapse in place to preserve positions

### Data Flow

1. **Initial Load**:
   - FlowCanvas loads data from mockApi (800ms delay)
   - Stores relationships for dynamic edge building
   - Calculates layout assuming all nodes expanded
   - Sets nodes with positions, edges start as direct edges only

2. **Node Expansion**:
   - User clicks expand button on DataProductNode
   - `handleToggleExpansion` updates `expandedNodes` state
   - Auto-expands all directly connected nodes
   - DataProductNode re-renders with port sections
   - Ports update visible handles via `useUpdateNodeInternals`
   - Notifies FlowCanvas of visible ports via callback
   - FlowCanvas rebuilds edges based on expansion state and visible ports
   - Viewport centers on expanded nodes group

3. **Port Selection**:
   - User clicks a port in expanded DataProductNode
   - `handlePortSelect` updates `selectedNode` state
   - `findCompleteLineage` calculates full lineage (upstream + downstream)
   - `lineage` state updated with Sets of nodes, edges, ports
   - Nodes re-render with lineage highlighting
   - Edges re-styled based on lineage membership

4. **Edge Building** ([FlowCanvas.jsx:45-96](src/components/FlowCanvas.jsx#L45-L96)):
   - Runs on every expansion state or visible ports change
   - For each relationship:
     - **Direct edges**: Show if at least one node is collapsed
     - **Port edges**: Show only if both nodes expanded AND both ports visible
   - Debounced with 1ms timeout for proper handle registration

5. **Pagination**:
   - User clicks pagination buttons in port section
   - Updates local page state in DataProductNode
   - Re-calculates visible ports slice
   - Updates handles and notifies FlowCanvas
   - Edges rebuild to show only visible port connections

### Dependencies

**Production:**
- `@xyflow/react` v12.8.4 - ReactFlow library
- `dagre` v0.8.5 - Graph layout engine
- `elkjs` v0.11.0 - Alternative layout (installed but not actively used)
- `react` v19.1.1, `react-dom` v19.1.1
- `@mui/material` v7.3.4 - Material-UI components (Avatar)
- `@emotion/react`, `@emotion/styled` - Styling for MUI

**Development:**
- `vite` v7.1.2 - Build tool
- `eslint` v9.33.0 with React hooks plugin
- React TypeScript support

### Recent Commits

- f5d9974: Remove stroke styles from port relationships in mock API data
- 719c0bc: Enhance DataProductNode UI with port badges and improved expand/collapse buttons
- b51cca1: Update mock API data product labels for consistency and clarity
- 6364e95: Disable related ports highlighting and ensure only lineage ports are displayed
- f20f3bb: Update related ports handling to include all lineage ports for improved visibility
