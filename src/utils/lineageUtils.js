/**
 * Lineage Utilities
 * Functions to calculate upstream and downstream lineage for data product ports
 */

/**
 * Build adjacency maps for efficient lineage traversal
 * @param {Array} relationships - Array of relationship objects from API
 * @param {Array} nodes - Array of node objects
 * @returns {Object} - { portToEdges, nodeToEdges, portToNode, nodeData }
 */
export function buildLineageMaps(relationships, nodes) {
  const portToEdges = new Map(); // port -> edges connected to this port
  const nodeToEdges = new Map(); // node -> edges connected to this node
  const portToNode = new Map(); // port -> parent node
  const nodeData = new Map(); // nodeId -> node data (for internal port relationships)

  // Build node data map
  nodes.forEach((node) => {
    nodeData.set(node.id, node.data);

    // Map ports to their parent node
    if (node.data.inputs) {
      node.data.inputs.forEach((input) => {
        portToNode.set(input.id, { nodeId: node.id, type: 'input' });
      });
    }
    if (node.data.outputs) {
      node.data.outputs.forEach((output) => {
        portToNode.set(output.id, { nodeId: node.id, type: 'output' });
      });
    }
  });

  // Build edge maps
  relationships.forEach((rel) => {
    if (rel.type === 'port') {
      // Port-to-port edges
      const sourcePort = rel.sourcePort;
      const targetPort = rel.targetPort;

      // Add to portToEdges map
      if (!portToEdges.has(sourcePort)) {
        portToEdges.set(sourcePort, []);
      }
      if (!portToEdges.has(targetPort)) {
        portToEdges.set(targetPort, []);
      }
      portToEdges.get(sourcePort).push(rel);
      portToEdges.get(targetPort).push(rel);
    }

    if (rel.type === 'direct') {
      // Node-to-node edges
      const sourceNode = rel.sourceNode;
      const targetNode = rel.targetNode;

      if (!nodeToEdges.has(sourceNode)) {
        nodeToEdges.set(sourceNode, []);
      }
      if (!nodeToEdges.has(targetNode)) {
        nodeToEdges.set(targetNode, []);
      }
      nodeToEdges.get(sourceNode).push(rel);
      nodeToEdges.get(targetNode).push(rel);
    }
  });

  return { portToEdges, nodeToEdges, portToNode, nodeData };
}

/**
 * Find all related ports within the same node (internal node transformations)
 * @param {String} portId - The port ID to start from
 * @param {String} nodeId - The node ID containing the port
 * @param {Map} nodeData - Map of node data
 * @returns {Set} - Set of related port IDs within the same node
 */
function findInternalRelatedPorts(portId, nodeId, nodeData) {
  const relatedPorts = new Set();
  const data = nodeData.get(nodeId);

  if (!data) return relatedPorts;

  // Find the port in inputs or outputs
  let sourcePort = null;
  if (data.inputs) {
    sourcePort = data.inputs.find((p) => p.id === portId);
  }
  if (!sourcePort && data.outputs) {
    sourcePort = data.outputs.find((p) => p.id === portId);
  }

  if (sourcePort && sourcePort.relatedPorts) {
    sourcePort.relatedPorts.forEach((relatedPortId) => {
      relatedPorts.add(relatedPortId);
    });
  }

  return relatedPorts;
}

/**
 * Find upstream lineage (backward traversal) from a given port
 * Traces all data sources that feed into this port
 * @param {String} portId - Starting port ID
 * @param {Object} maps - { portToEdges, nodeToEdges, portToNode, nodeData }
 * @returns {Object} - { nodes: Set, edges: Set, ports: Set }
 */
export function findUpstreamLineage(portId, maps) {
  const { portToEdges, nodeToEdges, portToNode, nodeData } = maps;
  const visited = new Set();
  const lineageNodes = new Set();
  const lineageEdges = new Set();
  const lineagePorts = new Set();

  function traverseUpstream(currentPortId) {
    if (visited.has(currentPortId)) return;
    visited.add(currentPortId);
    lineagePorts.add(currentPortId);

    const portInfo = portToNode.get(currentPortId);
    if (!portInfo) return;

    const { nodeId, type } = portInfo;
    lineageNodes.add(nodeId);

    // If this is an output port, find related input ports within the same node
    if (type === 'output') {
      const relatedPorts = findInternalRelatedPorts(currentPortId, nodeId, nodeData);
      relatedPorts.forEach((relatedPortId) => {
        lineagePorts.add(relatedPortId);
        // Continue upstream from these input ports
        traverseUpstream(relatedPortId);
      });
    }

    // If this is an input port, find edges that connect to it
    if (type === 'input') {
      const edges = portToEdges.get(currentPortId) || [];
      edges.forEach((edge) => {
        if (edge.type === 'port' && edge.targetPort === currentPortId) {
          lineageEdges.add(`edge-${edge.id}`);
          // Continue upstream from source port
          traverseUpstream(edge.sourcePort);
        }
      });
    }
  }

  traverseUpstream(portId);
  return { nodes: lineageNodes, edges: lineageEdges, ports: lineagePorts };
}

/**
 * Find downstream lineage (forward traversal) from a given port
 * Traces all consumers that use data from this port
 * @param {String} portId - Starting port ID
 * @param {Object} maps - { portToEdges, nodeToEdges, portToNode, nodeData }
 * @returns {Object} - { nodes: Set, edges: Set, ports: Set }
 */
export function findDownstreamLineage(portId, maps) {
  const { portToEdges, nodeToEdges, portToNode, nodeData } = maps;
  const visited = new Set();
  const lineageNodes = new Set();
  const lineageEdges = new Set();
  const lineagePorts = new Set();

  function traverseDownstream(currentPortId) {
    if (visited.has(currentPortId)) return;
    visited.add(currentPortId);
    lineagePorts.add(currentPortId);

    const portInfo = portToNode.get(currentPortId);
    if (!portInfo) return;

    const { nodeId, type } = portInfo;
    lineageNodes.add(nodeId);

    // If this is an input port, find related output ports within the same node
    if (type === 'input') {
      const relatedPorts = findInternalRelatedPorts(currentPortId, nodeId, nodeData);
      relatedPorts.forEach((relatedPortId) => {
        lineagePorts.add(relatedPortId);
        // Continue downstream from these output ports
        traverseDownstream(relatedPortId);
      });
    }

    // If this is an output port, find edges that originate from it
    if (type === 'output') {
      const edges = portToEdges.get(currentPortId) || [];
      edges.forEach((edge) => {
        if (edge.type === 'port' && edge.sourcePort === currentPortId) {
          lineageEdges.add(`edge-${edge.id}`);
          // Continue downstream to target port
          traverseDownstream(edge.targetPort);
        }
      });
    }
  }

  traverseDownstream(portId);
  return { nodes: lineageNodes, edges: lineageEdges, ports: lineagePorts };
}

/**
 * Find complete lineage (both upstream and downstream) from a given port
 * @param {String} portId - Starting port ID
 * @param {Array} relationships - Array of relationship objects
 * @param {Array} nodes - Array of node objects
 * @returns {Object} - { nodes: Set, edges: Set, ports: Set, upstream: Object, downstream: Object }
 */
export function findCompleteLineage(portId, relationships, nodes) {
  if (!portId) {
    return {
      nodes: new Set(),
      edges: new Set(),
      ports: new Set(),
      upstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
      downstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
    };
  }

  const maps = buildLineageMaps(relationships, nodes);
  const upstream = findUpstreamLineage(portId, maps);
  const downstream = findDownstreamLineage(portId, maps);

  // Combine upstream and downstream
  const allNodes = new Set([...upstream.nodes, ...downstream.nodes]);
  const allEdges = new Set([...upstream.edges, ...downstream.edges]);
  const allPorts = new Set([...upstream.ports, ...downstream.ports]);

  return {
    nodes: allNodes,
    edges: allEdges,
    ports: allPorts,
    upstream,
    downstream,
  };
}

/**
 * Find lineage for a node (when collapsed)
 * Finds all nodes and edges in the lineage path
 * @param {String} nodeId - Starting node ID
 * @param {Array} relationships - Array of relationship objects
 * @param {Array} nodes - Array of node objects
 * @returns {Object} - { nodes: Set, edges: Set }
 */
export function findNodeLineage(nodeId, relationships, nodes) {
  if (!nodeId) {
    return { nodes: new Set(), edges: new Set() };
  }

  const lineageNodes = new Set([nodeId]);
  const lineageEdges = new Set();
  const visited = new Set();

  function traverse(currentNodeId) {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);

    // Find all edges connected to this node
    relationships.forEach((rel) => {
      if (rel.type === 'direct') {
        if (rel.sourceNode === currentNodeId) {
          lineageEdges.add(`edge-${rel.id}`);
          lineageNodes.add(rel.targetNode);
          traverse(rel.targetNode);
        }
        if (rel.targetNode === currentNodeId) {
          lineageEdges.add(`edge-${rel.id}`);
          lineageNodes.add(rel.sourceNode);
          traverse(rel.sourceNode);
        }
      }
    });
  }

  traverse(nodeId);
  return { nodes: lineageNodes, edges: lineageEdges };
}
