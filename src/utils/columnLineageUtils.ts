/**
 * Column Lineage Utilities
 * Functions to calculate upstream and downstream column lineage
 */

import type { ColumnRelationship, ColumnPort, Column } from '../types';

interface PortInfo {
  portId: string;
  portLabel: string;
  nodeId: string;
  nodeLabel: string;
}

interface ColumnLineageMaps {
  columnToEdges: Map<string, (ColumnRelationship & { id: string })[]>;
  columnToPort: Map<string, PortInfo>;
  portData: Map<string, ColumnPort>;
}

interface ColumnLineageResult {
  columns: Set<string>;
  edges: Set<string>;
  ports: Set<string>;
}

interface CompleteColumnLineageResult extends ColumnLineageResult {
  upstream: ColumnLineageResult;
  downstream: ColumnLineageResult;
}

interface AllPorts {
  selectedPort: ColumnPort;
  upstreamPorts?: ColumnPort[];
  downstreamPorts?: ColumnPort[];
}

/**
 * Build adjacency maps for efficient column lineage traversal
 */
export function buildColumnLineageMaps(
  columnRelationships: ColumnRelationship[],
  allPorts: AllPorts
): ColumnLineageMaps {
  const columnToEdges = new Map<string, (ColumnRelationship & { id: string })[]>();
  const columnToPort = new Map<string, PortInfo>();
  const portData = new Map<string, ColumnPort>();

  // Process all ports (selected, upstream, downstream)
  const allPortsList = [
    allPorts.selectedPort,
    ...(allPorts.upstreamPorts || []),
    ...(allPorts.downstreamPorts || []),
  ].filter(Boolean);

  allPortsList.forEach((port) => {
    portData.set(port.portId, port);

    // Map columns to their parent port
    if (port.columns) {
      port.columns.forEach((column) => {
        columnToPort.set(column.id, {
          portId: port.portId,
          portLabel: port.portLabel,
          nodeId: port.nodeId,
          nodeLabel: port.nodeLabel,
        });
      });
    }
  });

  // Build edge maps from column relationships
  columnRelationships.forEach((rel, index) => {
    const edgeId = `col-edge-${index}`;
    const sourceCol = rel.sourceColumn;
    const targetCol = rel.targetColumn;

    // Add to columnToEdges map
    if (!columnToEdges.has(sourceCol)) {
      columnToEdges.set(sourceCol, []);
    }
    if (!columnToEdges.has(targetCol)) {
      columnToEdges.set(targetCol, []);
    }

    const edgeData = { id: edgeId, ...rel };
    columnToEdges.get(sourceCol)!.push(edgeData);
    columnToEdges.get(targetCol)!.push(edgeData);
  });

  return { columnToEdges, columnToPort, portData };
}

/**
 * Find upstream column lineage (backward traversal) from a given column
 */
export function findUpstreamColumnLineage(columnId: string, maps: ColumnLineageMaps): ColumnLineageResult {
  const { columnToEdges, columnToPort } = maps;
  const visited = new Set<string>();
  const lineageColumns = new Set<string>();
  const lineageEdges = new Set<string>();
  const lineagePorts = new Set<string>();

  function traverseUpstream(currentColumnId: string): void {
    if (visited.has(currentColumnId)) return;
    visited.add(currentColumnId);
    lineageColumns.add(currentColumnId);

    const portInfo = columnToPort.get(currentColumnId);
    if (portInfo) {
      lineagePorts.add(portInfo.portId);
    }

    // Find edges where this column is the target
    const edges = columnToEdges.get(currentColumnId) || [];
    edges.forEach((edge) => {
      if (edge.targetColumn === currentColumnId) {
        lineageEdges.add(edge.id);
        // Continue upstream from source column
        traverseUpstream(edge.sourceColumn);
      }
    });
  }

  traverseUpstream(columnId);
  return { columns: lineageColumns, edges: lineageEdges, ports: lineagePorts };
}

/**
 * Find downstream column lineage (forward traversal) from a given column
 */
export function findDownstreamColumnLineage(columnId: string, maps: ColumnLineageMaps): ColumnLineageResult {
  const { columnToEdges, columnToPort } = maps;
  const visited = new Set<string>();
  const lineageColumns = new Set<string>();
  const lineageEdges = new Set<string>();
  const lineagePorts = new Set<string>();

  function traverseDownstream(currentColumnId: string): void {
    if (visited.has(currentColumnId)) return;
    visited.add(currentColumnId);
    lineageColumns.add(currentColumnId);

    const portInfo = columnToPort.get(currentColumnId);
    if (portInfo) {
      lineagePorts.add(portInfo.portId);
    }

    // Find edges where this column is the source
    const edges = columnToEdges.get(currentColumnId) || [];
    edges.forEach((edge) => {
      if (edge.sourceColumn === currentColumnId) {
        lineageEdges.add(edge.id);
        // Continue downstream to target column
        traverseDownstream(edge.targetColumn);
      }
    });
  }

  traverseDownstream(columnId);
  return { columns: lineageColumns, edges: lineageEdges, ports: lineagePorts };
}

/**
 * Find complete column lineage (both upstream and downstream) from a given column
 */
export function findCompleteColumnLineage(
  columnId: string | null,
  columnRelationships: ColumnRelationship[],
  allPorts: AllPorts
): CompleteColumnLineageResult {
  if (!columnId) {
    return {
      columns: new Set(),
      edges: new Set(),
      ports: new Set(),
      upstream: { columns: new Set(), edges: new Set(), ports: new Set() },
      downstream: { columns: new Set(), edges: new Set(), ports: new Set() },
    };
  }

  const maps = buildColumnLineageMaps(columnRelationships, allPorts);
  const upstream = findUpstreamColumnLineage(columnId, maps);
  const downstream = findDownstreamColumnLineage(columnId, maps);

  // Combine upstream and downstream
  const allColumns = new Set([...upstream.columns, ...downstream.columns]);
  const allEdges = new Set([...upstream.edges, ...downstream.edges]);
  const lineagePorts = new Set([...upstream.ports, ...downstream.ports]);

  return {
    columns: allColumns,
    edges: allEdges,
    ports: lineagePorts,
    upstream,
    downstream,
  };
}

/**
 * Get column by ID from all ports data
 */
export function getColumnById(columnId: string, allPorts: AllPorts): (Column & { portId: string; portLabel: string }) | null {
  const allPortsList = [
    allPorts.selectedPort,
    ...(allPorts.upstreamPorts || []),
    ...(allPorts.downstreamPorts || []),
  ].filter(Boolean);

  for (const port of allPortsList) {
    if (port.columns) {
      const column = port.columns.find((col) => col.id === columnId);
      if (column) {
        return { ...column, portId: port.portId, portLabel: port.portLabel };
      }
    }
  }
  return null;
}

/**
 * Get port by ID from all ports data
 */
export function getPortById(portId: string, allPorts: AllPorts): ColumnPort | null {
  if (allPorts.selectedPort?.portId === portId) {
    return allPorts.selectedPort;
  }

  const upstream = (allPorts.upstreamPorts || []).find((p) => p.portId === portId);
  if (upstream) return upstream;

  const downstream = (allPorts.downstreamPorts || []).find((p) => p.portId === portId);
  if (downstream) return downstream;

  return null;
}
