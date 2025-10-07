import dagre from 'dagre';
import { getDataProductForGroup, getDataProductForInputGroup } from './graphUtils';

/**
 * Calculate automatic layout using Dagre for hierarchical flow
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} expandedNodes - State of expanded nodes
 * @param {Object} showAllStates - State of "show all" for each node
 * @returns {Promise<Array>} - Nodes with calculated positions
 */
export const getLayoutedNodes = async (nodes, edges, expandedNodes = {}, showAllStates = {}) => {
  // For debugging
  console.log('Layout: Expanded nodes:', expandedNodes);
  console.log('Layout: ShowAll states:', showAllStates);

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure the graph layout
  dagreGraph.setGraph({
    rankdir: 'LR', // Left to Right
    nodesep: 80,   // Vertical spacing between nodes
    ranksep: 150,  // Horizontal spacing between layers
    edgesep: 50,   // Edge spacing
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre graph with dynamic dimensions
  nodes.forEach((node) => {
    const nodeWidth = getNodeWidth(node, nodes, edges, expandedNodes);
    const nodeHeight = getNodeHeight(node, nodes, edges, expandedNodes, showAllStates);

    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    // Only add edges without handles for layout calculation
    // (direct dataproduct to dataproduct edges)
    if (!edge.sourceHandle && !edge.targetHandle) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        // Dagre returns center position, adjust to top-left
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return layoutedNodes;
};

/**
 * Get dynamic width for different node types
 */
const getNodeWidth = (node, allNodes, edges, expandedNodes) => {
  switch (node.type) {
    case 'dataproduct': {
      const isExpanded = expandedNodes[node.id];
      return isExpanded ? 420 : 120;
    }
    case 'inputGroup': {
      const dataProductId = getDataProductForInputGroup(node.id, edges, allNodes);
      const isExpanded = dataProductId ? expandedNodes[dataProductId] : false;
      return isExpanded ? 180 : 150;
    }
    case 'group': {
      const dataProductId = getDataProductForGroup(node.id, edges, allNodes);
      const isExpanded = dataProductId ? expandedNodes[dataProductId] : false;
      return isExpanded ? 180 : 150;
    }
    default:
      return 150;
  }
};

/**
 * Get dynamic height for different node types based on content
 */
const getNodeHeight = (node, allNodes, edges, expandedNodes, showAllStates = {}) => {
  switch (node.type) {
    case 'dataproduct': {
      const isExpanded = expandedNodes[node.id];
      if (!isExpanded) return 80;

      // Calculate height based on number of ports with pagination
      const inputCount = node.data?.inputs?.length || 0;
      const outputCount = node.data?.outputs?.length || 0;
      const ITEMS_PER_PAGE = 5;

      // Show max 5 items per page
      const visibleInputs = Math.min(inputCount, ITEMS_PER_PAGE);
      const visibleOutputs = Math.min(outputCount, ITEMS_PER_PAGE);
      const maxVisiblePorts = Math.max(visibleInputs, visibleOutputs);

      // Check if pagination is needed
      const needsInputPagination = inputCount > ITEMS_PER_PAGE;
      const needsOutputPagination = outputCount > ITEMS_PER_PAGE;
      const needsPagination = needsInputPagination || needsOutputPagination;

      // header (50) + port header (30) + items (28 each) + pagination (36 if needed) + padding (20)
      const paginationHeight = needsPagination ? 36 : 0;
      return 100 + (maxVisiblePorts * 28) + paginationHeight;
    }
    case 'inputGroup': {
      const dataProductId = getDataProductForInputGroup(node.id, edges, allNodes);
      const isExpanded = dataProductId ? expandedNodes[dataProductId] : false;

      if (!isExpanded) return 60;

      // Check if "show all" is enabled for this node
      const showAllInputs = showAllStates[node.id] || false;
      const inputCount = node.data?.inputs?.length || 0;
      const visibleInputs = showAllInputs ? inputCount : Math.min(3, inputCount);
      const hasViewMore = inputCount > 3;
      // header (40) + search box (40) + items (32 each) + view more button (32 if needed)
      return 80 + (visibleInputs * 32) + (hasViewMore ? 32 : 0);
    }
    case 'group': {
      const dataProductId = getDataProductForGroup(node.id, edges, allNodes);
      const isExpanded = dataProductId ? expandedNodes[dataProductId] : false;

      if (!isExpanded) return 60;

      // Check if "show all" is enabled for this node
      const showAllChildren = showAllStates[node.id] || false;
      const childCount = node.data?.children?.length || 0;
      const visibleChildren = showAllChildren ? childCount : Math.min(3, childCount);
      const hasViewMoreButton = childCount > 3;
      // header (40) + search box (40) + items (32 each) + view more button (32 if needed)
      return 80 + (visibleChildren * 32) + (hasViewMoreButton ? 32 : 0);
    }
    default:
      return 100;
  }
};