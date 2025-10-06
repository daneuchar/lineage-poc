/**
 * Utility functions for analyzing graph structure and node relationships
 */

/**
 * Find the dataproduct node that owns a group node
 * @param {string} groupNodeId - The group node ID
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @returns {string|null} - The dataproduct node ID or null
 */
export const getDataProductForGroup = (groupNodeId, edges, nodes) => {
  // Find which dataproduct connects to this group
  const edge = edges.find(
    (edge) =>
      edge.target === groupNodeId &&
      nodes.find((n) => n.id === edge.source)?.type === "dataproduct"
  );
  return edge?.source || null;
};

/**
 * Find the dataproduct node that owns an inputGroup node
 * @param {string} inputGroupId - The inputGroup node ID
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @returns {string|null} - The dataproduct node ID or null
 */
export const getDataProductForInputGroup = (inputGroupId, edges, nodes) => {
  // Find which dataproduct this inputGroup connects to
  const edge = edges.find(
    (edge) =>
      edge.source === inputGroupId &&
      nodes.find((n) => n.id === edge.target)?.type === "dataproduct"
  );
  return edge?.target || null;
};

/**
 * Check if a group/inputGroup node should be expanded based on its parent dataproduct
 * @param {string} nodeId - The node ID to check
 * @param {string} nodeType - The node type ('group' or 'inputGroup')
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @param {Object} expandedNodes - Object tracking which dataproducts are expanded
 * @returns {boolean} - Whether the node should be expanded
 */
export const isNodeExpanded = (nodeId, nodeType, edges, nodes, expandedNodes) => {
  if (nodeType === 'group') {
    const dataProductId = getDataProductForGroup(nodeId, edges, nodes);
    return dataProductId ? expandedNodes[dataProductId] : false;
  }

  if (nodeType === 'inputGroup') {
    const dataProductId = getDataProductForInputGroup(nodeId, edges, nodes);
    return dataProductId ? expandedNodes[dataProductId] : false;
  }

  return false;
};

/**
 * Get all dataproducts that depend on a given dataproduct
 * (i.e., dataproducts that receive data from this one via group->inputGroup connections)
 * @param {string} dataProductId - The dataproduct node ID
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @returns {Array} - Array of dependent dataproduct IDs
 */
export const getDependentDataProducts = (dataProductId, edges, nodes) => {
  return edges
    .filter((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode?.type === "group") {
        const sourceDP = getDataProductForGroup(edge.source, edges, nodes);
        return sourceDP === dataProductId;
      }
      return false;
    })
    .map((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode?.type === "inputGroup") {
        return getDataProductForInputGroup(edge.target, edges, nodes);
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Get all dataproducts that this dataproduct depends on
 * (i.e., dataproducts that provide data to this one via group->inputGroup connections)
 * @param {string} dataProductId - The dataproduct node ID
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @returns {Array} - Array of dependency dataproduct IDs
 */
export const getDependencyDataProducts = (dataProductId, edges, nodes) => {
  return edges
    .filter((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode?.type === "inputGroup") {
        const dependentDP = getDataProductForInputGroup(edge.target, edges, nodes);
        return dependentDP === dataProductId;
      }
      return false;
    })
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode?.type === "group") {
        return getDataProductForGroup(edge.source, edges, nodes);
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Check if there are connecting edges between two nodes
 * @param {string} sourceNodeId - Source node ID
 * @param {string} targetNodeId - Target node ID
 * @param {Array} edges - All edges in the graph
 * @returns {boolean} - Whether edges exist
 */
export const hasConnectingEdges = (sourceNodeId, targetNodeId, edges) => {
  return edges.some(
    (edge) => edge.source === sourceNodeId && edge.target === targetNodeId
  );
};

/**
 * Get all inputGroup nodes connected to a group node
 * @param {string} groupId - The group node ID
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @returns {Array} - Array of inputGroup node IDs
 */
export const getInputGroupsConnectedToGroup = (groupId, edges, nodes) => {
  return edges
    .filter(
      (edge) =>
        edge.source === groupId &&
        nodes.find((n) => n.id === edge.target)?.type === "inputGroup"
    )
    .map((edge) => edge.target);
};

/**
 * Get all group nodes connected to an inputGroup node
 * @param {string} inputGroupId - The inputGroup node ID
 * @param {Array} edges - All edges in the graph
 * @param {Array} nodes - All nodes in the graph
 * @returns {Array} - Array of group node IDs
 */
export const getGroupsConnectedToInputGroup = (inputGroupId, edges, nodes) => {
  return edges
    .filter(
      (edge) =>
        edge.target === inputGroupId &&
        nodes.find((n) => n.id === edge.source)?.type === "group"
    )
    .map((edge) => edge.source);
};
