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
  onPortHover?: (portId: string | null) => void;
  // State
  selected?: boolean;
  selectedPortId?: string | null;
  expanded?: boolean;
  inLineage?: boolean;
  lineagePorts?: Set<string>;
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
 * Flow data from API
 */
export interface FlowData {
  nodes: ReactFlowNode<DataProductNodeData>[];
  relationships: Relationship[];
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
 * Column lineage structure with embedded relationships
 */
export interface ColumnLineageColumn {
  id: string;
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  description?: string;
  tags?: string[];
  relatedColumns?: string[]; // IDs of related columns in other tables
}

export interface ColumnLineageTableData {
  dp_name: string;
  dp_id: string;
  op_id?: string;
  op_name?: string;
  schema?: string; // URL
  owner?: string;
  tags?: string[];
  columns: ColumnLineageColumn[];
}

export interface ColumnLineageTable {
  id: string;
  type?: 'source' | 'transformation' | 'mart';
  data: ColumnLineageTableData;
}

export interface ColumnLineageData {
  datasets: ColumnLineageTable[];
}

/**
 * Mock API interface
 */
export interface MockApi {
  getFlowData: () => Promise<FlowData>;
  getTableColumnLineage: () => Promise<ColumnLineageData>;
}
