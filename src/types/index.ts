/**
 * Core Type Definitions for Data Product Lineage Application
 */

import type { Node as ReactFlowNode } from '@xyflow/react';

/**
 * Port interface representing an input or output port on a data product
 */
export interface Port {
  id: string;
  label: string;
  relatedPorts: string[];
}

/**
 * Data Product Node Data interface
 */
export interface DataProductNodeData extends Record<string, unknown> {
  label: string;
  avatar?: string;
  inputs: Port[];
  outputs: Port[];
  // Callbacks
  onToggleExpansion?: () => void;
  onNodeClick?: () => void;
  onPortSelect?: (portId: string | null) => void;
  onVisiblePortsChange?: (visibleInputs: string[], visibleOutputs: string[]) => void;
  onViewColumnLineage?: (portId: string) => void;
  // State
  selected?: boolean;
  selectedPortId?: string | null;
  expanded?: boolean;
  inLineage?: boolean;
  lineagePorts?: Set<string>;
}

/**
 * Column interface for column lineage
 */
export interface Column {
  id: string;
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  description: string;
  upstreamColumns?: string[];
  downstreamColumns?: string[];
}

/**
 * Port with columns for column lineage
 */
export interface ColumnPort {
  portId: string;
  portLabel: string;
  nodeId: string;
  nodeLabel: string;
  columns: Column[];
}

/**
 * Column Port Node Data interface
 */
export interface ColumnPortNodeData extends Record<string, unknown> {
  portId: string;
  portLabel: string;
  nodeId: string;
  nodeLabel: string;
  columns: Column[];
  portType: 'input' | 'output';
  // Callbacks
  onColumnSelect?: (columnId: string | null) => void;
  onVisibleColumnsChange?: (visibleColumnIds: string[]) => void;
  onViewColumnLineage?: (portId: string) => void;
  // State
  selected?: boolean;
  inLineage?: boolean;
  selectedColumnId?: string | null;
  lineageColumns?: Set<string>;
}

/**
 * Relationship types
 */
export type RelationshipType = 'direct' | 'port';

/**
 * Direct relationship (node-to-node)
 */
export interface DirectRelationship {
  id: string;
  sourceNode: string;
  targetNode: string;
  type: 'direct';
  style?: React.CSSProperties;
}

/**
 * Port relationship (port-to-port)
 */
export interface PortRelationship {
  id: string;
  sourceNode: string;
  sourcePort: string;
  targetNode: string;
  targetPort: string;
  type: 'port';
  style?: React.CSSProperties;
}

/**
 * Union type for relationships
 */
export type Relationship = DirectRelationship | PortRelationship;

/**
 * Column-to-column relationship
 */
export interface ColumnRelationship {
  sourceColumn: string;
  targetColumn: string;
}

/**
 * Flow data from API
 */
export interface FlowData {
  nodes: ReactFlowNode<DataProductNodeData>[];
  relationships: Relationship[];
}

/**
 * Column lineage data from API
 */
export interface ColumnLineageData {
  selectedPort: ColumnPort;
  upstreamPorts: ColumnPort[];
  downstreamPorts: ColumnPort[];
  columnRelationships: ColumnRelationship[];
}

/**
 * Lineage result containing nodes, edges, and ports
 */
export interface LineageResult {
  nodes: Set<string>;
  edges: Set<string>;
  ports: Set<string>;
}

/**
 * Complete lineage result with upstream and downstream breakdown
 */
export interface CompleteLineageResult extends LineageResult {
  upstream: LineageResult;
  downstream: LineageResult;
}

/**
 * Lineage maps for efficient traversal
 */
export interface LineageMaps {
  portToEdges: Map<string, Relationship[]>;
  nodeToEdges: Map<string, Relationship[]>;
  portToNode: Map<string, { nodeId: string; type: 'input' | 'output' }>;
  nodeData: Map<string, DataProductNodeData>;
}

/**
 * Visible ports state
 */
export interface VisiblePorts {
  inputs: string[];
  outputs: string[];
}

/**
 * Expanded nodes state (Record for better type safety than object literal)
 */
export type ExpandedNodesState = Record<string, boolean>;

/**
 * Visible ports state (Record for better type safety)
 */
export type VisiblePortsState = Record<string, VisiblePorts>;

/**
 * View mode for the application
 */
export type ViewMode = 'port' | 'column';

/**
 * Mock API interface
 */
export interface MockApi {
  delay: (ms?: number) => Promise<void>;
  useMockApi: boolean;
  setUseMockApi: (flag: boolean) => void;
  getFlowData: () => Promise<FlowData>;
  getColumnLineage: (portId: string) => Promise<ColumnLineageData>;
}
