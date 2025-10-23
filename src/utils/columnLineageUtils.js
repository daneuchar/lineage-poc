/**
 * Column Lineage Utilities
 * Functions to calculate upstream and downstream column lineage
 */

/**
 * Build adjacency maps for efficient column lineage traversal
 * @param {Array} columnRelationships - Array of column-to-column relationships
 * @param {Object} allPorts - Object containing selectedPort, upstreamPorts, downstreamPorts
 * @returns {Object} - { columnToEdges, columnToPort, portData }
 */
export function buildColumnLineageMaps(columnRelationships, allPorts) {
  const columnToEdges = new Map(); // column -> edges connected to this column
  const columnToPort = new Map(); // column -> parent port info
  const portData = new Map(); // portId -> port data

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
    columnToEdges.get(sourceCol).push(edgeData);
    columnToEdges.get(targetCol).push(edgeData);
  });

  return { columnToEdges, columnToPort, portData };
}

/**
 * Find upstream column lineage (backward traversal) from a given column
 * @param {String} columnId - Starting column ID
 * @param {Object} maps - { columnToEdges, columnToPort, portData }
 * @returns {Object} - { columns: Set, edges: Set, ports: Set }
 */
export function findUpstreamColumnLineage(columnId, maps) {
  const { columnToEdges, columnToPort } = maps;
  const visited = new Set();
  const lineageColumns = new Set();
  const lineageEdges = new Set();
  const lineagePorts = new Set();

  function traverseUpstream(currentColumnId) {
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
 * @param {String} columnId - Starting column ID
 * @param {Object} maps - { columnToEdges, columnToPort, portData }
 * @returns {Object} - { columns: Set, edges: Set, ports: Set }
 */
export function findDownstreamColumnLineage(columnId, maps) {
  const { columnToEdges, columnToPort } = maps;
  const visited = new Set();
  const lineageColumns = new Set();
  const lineageEdges = new Set();
  const lineagePorts = new Set();

  function traverseDownstream(currentColumnId) {
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
 * @param {String} columnId - Starting column ID
 * @param {Array} columnRelationships - Array of column-to-column relationships
 * @param {Object} allPorts - Object containing selectedPort, upstreamPorts, downstreamPorts
 * @returns {Object} - { columns: Set, edges: Set, ports: Set, upstream: Object, downstream: Object }
 */
export function findCompleteColumnLineage(columnId, columnRelationships, allPorts) {
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
 * @param {String} columnId - Column ID to find
 * @param {Object} allPorts - Object containing selectedPort, upstreamPorts, downstreamPorts
 * @returns {Object|null} - Column object or null if not found
 */
export function getColumnById(columnId, allPorts) {
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
 * @param {String} portId - Port ID to find
 * @param {Object} allPorts - Object containing selectedPort, upstreamPorts, downstreamPorts
 * @returns {Object|null} - Port object or null if not found
 */
export function getPortById(portId, allPorts) {
  if (allPorts.selectedPort?.portId === portId) {
    return allPorts.selectedPort;
  }

  const upstream = (allPorts.upstreamPorts || []).find((p) => p.portId === portId);
  if (upstream) return upstream;

  const downstream = (allPorts.downstreamPorts || []).find((p) => p.portId === portId);
  if (downstream) return downstream;

  return null;
}
