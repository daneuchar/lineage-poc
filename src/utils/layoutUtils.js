import dagre from 'dagre';

/**
 * Calculate automatic layout using Dagre for left-to-right flow
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} expandedNodes - State of expanded nodes
 * @returns {Array} - Nodes with calculated positions
 */
export const getLayoutedNodes = (nodes, edges, expandedNodes = {}) => {
  const dagreGraph = new dagre.graphlib.Graph();
  
  // Set graph layout options - left to right
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'LR',  // Left to Right
    nodesep: 50,    // Horizontal spacing between nodes in same rank
    ranksep: 40,   // Vertical spacing between ranks (left-to-right distance)
    marginx: 30,
    marginy: 30,
    align: 'UL'     // Align upper-left
  });

  // For debugging - always include all nodes initially, let FlowCanvas handle filtering
  console.log('Layout: Expanded nodes:', expandedNodes);
  
  // Include all nodes for layout calculation - filtering will be done in FlowCanvas
  const visibleNodes = nodes;

  // Add nodes to dagre graph with dynamic sizing
  visibleNodes.forEach((node) => {
    const nodeWidth = getNodeWidth(node, expandedNodes);
    const nodeHeight = getNodeHeight(node, expandedNodes);
    
    dagreGraph.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    });
  });

  // Add all edges to dagre graph for proper layout
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  return visibleNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });
};

/**
 * Get dynamic width for different node types
 */
const getNodeWidth = (node, expandedNodes) => {
  switch (node.type) {
    case 'dataproduct':
      return 120;
    case 'inputGroup':
      return expandedNodes['dataproduct-1'] ? 180 : 150;
    case 'group':
      if (node.id === 'group-1') {
        return (expandedNodes['dataproduct-1'] || expandedNodes['dataproduct-2']) ? 180 : 150;
      } else if (node.id === 'group-2') {
        return expandedNodes['dataproduct-2'] ? 180 : 150;
      }
      return 150;
    default:
      return 150;
  }
};

/**
 * Get dynamic height for different node types based on content
 */
const getNodeHeight = (node, expandedNodes) => {
  switch (node.type) {
    case 'dataproduct':
      return 80;
    case 'inputGroup':
      if (!expandedNodes['dataproduct-1']) return 60;
      // Calculate height based on visible items (3 items + header + view more button if needed)
      const inputCount = node.data?.inputs?.length || 0;
      const visibleInputs = Math.min(3, inputCount);
      const hasViewMore = inputCount > 3;
      return 40 + (visibleInputs * 32) + (hasViewMore ? 32 : 0); // header + items + view more
    case 'group':
      const isExpanded = (node.id === 'group-1' && (expandedNodes['dataproduct-1'] || expandedNodes['dataproduct-2'])) ||
                        (node.id === 'group-2' && expandedNodes['dataproduct-2']);
      
      if (!isExpanded) return 60;
      
      // Calculate height based on visible items (3 items + header + view more button if needed)
      const childCount = node.data?.children?.length || 0;
      const visibleChildren = Math.min(3, childCount);
      const hasViewMoreButton = childCount > 3;
      return 40 + (visibleChildren * 32) + (hasViewMoreButton ? 32 : 0); // header + items + view more
    default:
      return 100;
  }
};