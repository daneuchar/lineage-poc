import dagre from 'dagre';

/**
 * Calculate automatic layout using Dagre for hierarchical flow
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} expandedNodes - State of expanded nodes
 * @param {Object} showAllStates - State of "show all" for each node (unused, kept for compatibility)
 * @returns {Promise<Array>} - Nodes with calculated positions
 */
export const getLayoutedNodes = async (nodes, edges, expandedNodes = {}, showAllStates = {}) => {
  // For debugging
  console.log('Layout: Expanded nodes:', expandedNodes);

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
    const nodeWidth = getNodeWidth(node, expandedNodes);
    const nodeHeight = getNodeHeight(node, expandedNodes);

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
const getNodeWidth = (node, expandedNodes) => {
  if (node.type === 'dataproduct') {
    const isExpanded = expandedNodes[node.id];
    return isExpanded ? 420 : 120;
  }
  if (node.type === 'columnport') {
    return 350; // Fixed width for column port nodes (between min 320px and max 420px)
  }
  return 150; // Default width
};

/**
 * Get dynamic height for different node types based on content
 */
const getNodeHeight = (node, expandedNodes) => {
  if (node.type === 'dataproduct') {
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
  if (node.type === 'columnport') {
    // Calculate height based on number of columns with pagination
    const columnCount = node.data?.columns?.length || 0;
    const ITEMS_PER_PAGE = 5;

    // Show max 5 items per page
    const visibleColumns = Math.min(columnCount, ITEMS_PER_PAGE);
    const needsPagination = columnCount > ITEMS_PER_PAGE;

    // header (60) + section padding (20) + column items (49px each) + pagination (32 if needed)
    const paginationHeight = needsPagination ? 32 : 0;
    return 80 + (visibleColumns * 49) + paginationHeight;
  }
  return 100; // Default height
};