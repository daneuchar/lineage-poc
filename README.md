# Data Lineage Visualization - React Flow PoC

An interactive data lineage visualization application built with React Flow, demonstrating dynamic node expansion and data flow relationships between data products.

## Features

- **Interactive Data Products**: Click to expand/collapse data products and their connections
- **Dynamic Left-to-Right Layout**: Automatic positioning that flows from inputs through data products to outputs
- **Smart Lineage Logic**: 
  - DP1 expansion shows input sources and output ports
  - DP2 expansion shows DP1 outputs (its inputs) and DP2 outputs
- **Independent Expansion**: Each data product expands independently
- **Edge Highlighting**: Dynamic edge styling based on selected child nodes

## Architecture

The application demonstrates a parent-child node relationship pattern with:

- **DataProductNode**: Clickable nodes that control expansion of their input/output ports
- **InputGroupNode**: Input sources that feed into data products
- **GroupNode**: Output port collections with individual child selection
- **Mock API**: Simulated data service with configurable flow data

## Prerequisites

- **Node.js** >= 18.0.0 (recommended: latest LTS version)
- **npm** >= 9.0.0 or **yarn** >= 1.22.0

You can check your versions with:
```bash
node --version
npm --version
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daneuchar/lineage-poc.git
   cd lineage-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
Start the development server with hot reload:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Production Build
Build the application for production:
```bash
npm run build
```

### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

### Linting
Run ESLint to check code quality:
```bash
npm run lint
```

## Usage

1. **Start with collapsed view**: Only data product nodes are visible initially
2. **Click Data Product 1**: Expands to show input sources and output ports
3. **Click Data Product 2**: Shows Data Product 1's outputs (which feed DP2) and DP2's own outputs
4. **Click individual ports**: Highlights specific connections with dynamic edge styling
5. **Independent control**: Each data product can be expanded/collapsed independently

## Data Flow

```
Input Sources → Data Product 1 → Output Ports 1 → Data Product 2 → Output Ports 2
```

The visualization demonstrates how data flows through multiple processing stages, with each data product consuming inputs and producing outputs that can feed downstream processes.

## Technology Stack

- **React 18** - UI framework
- **React Flow** - Node-based editor and visualization
- **Vite** - Build tool and development server
- **ESLint** - Code linting

## Development

The application uses ReactFlow's `useNodesState` and `useEdgesState` hooks for flow state management, with custom node types and dynamic positioning logic. See `CLAUDE.md` for detailed architecture documentation.
