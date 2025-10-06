import ELK from 'elkjs';
import { getDataProductForGroup, getDataProductForInputGroup } from './graphUtils';

const elk = new ELK();

/**
 * Calculate automatic layout using ELK (Eclipse Layout Kernel) for hierarchical flow
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

  // Convert React Flow nodes to ELK format
  const elkNodes = nodes.map((node) => {
    const nodeWidth = getNodeWidth(node, nodes, edges, expandedNodes);
    const nodeHeight = getNodeHeight(node, nodes, edges, expandedNodes, showAllStates);

    return {
      id: node.id,
      width: nodeWidth,
      height: nodeHeight,
    };
  });

  // Convert React Flow edges to ELK format
  const elkEdges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  // ELK graph configuration
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',  // Horizontal spacing between layers
      'elk.layered.spacing.edgeNodeBetweenLayers': '40',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.thoroughness': '100',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
      'elk.spacing.componentComponent': '50',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  try {
    // Calculate layout using ELK
    const layoutedGraph = await elk.layout(graph);

    // Apply calculated positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children.find((n) => n.id === node.id);

      return {
        ...node,
        position: {
          x: elkNode?.x ?? 0,
          y: elkNode?.y ?? 0,
        },
      };
    });

  // Post-process: Organize nodes for hierarchical stacking

  // Step 1: Find sibling dataproducts (dataproducts that share the same parent)
  const dataproductEdges = edges.filter(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    const targetNode = nodes.find(n => n.id === e.target);
    return sourceNode?.type === 'dataproduct' && targetNode?.type === 'dataproduct';
  });

  // Group children by parent
  const childrenByParent = {};
  dataproductEdges.forEach(edge => {
    if (!childrenByParent[edge.source]) {
      childrenByParent[edge.source] = [];
    }
    childrenByParent[edge.source].push(edge.target);
  });

  // Step 2: Stack siblings vertically
  const stackedNodes = layoutedNodes.map(node => {
    // Check if this node has siblings (other dataproducts with same parent)
    if (node.type === 'dataproduct') {
      // Find the parent of this dataproduct
      const parentEdge = dataproductEdges.find(e => e.target === node.id);
      if (parentEdge) {
        const siblings = childrenByParent[parentEdge.source] || [];

        if (siblings.length > 1) {
          // This node has siblings, need to stack them
          const siblingIndex = siblings.indexOf(node.id);
          const parentNode = layoutedNodes.find(n => n.id === parentEdge.source);

          if (parentNode && siblingIndex !== -1) {
            // Calculate vertical position based on sibling index
            const totalSiblings = siblings.length;
            const spacing = 200; // vertical spacing between siblings
            const totalHeight = (totalSiblings - 1) * spacing;
            const startY = parentNode.position.y - (totalHeight / 2);

            return {
              ...node,
              position: {
                ...node.position,
                y: startY + (siblingIndex * spacing),
              },
            };
          }
        }
      }
    }

    return node;
  });

  // Step 3: Align input/output groups with their parent dataproduct
  return stackedNodes.map(node => {
    // Align group nodes vertically centered with their parent dataproduct
    if (node.type === 'group') {
      const parentDP = getDataProductForGroup(node.id, edges, nodes);
      if (parentDP) {
        const dpNode = stackedNodes.find(n => n.id === parentDP);
        if (dpNode) {
          // Center align with parent dataproduct
          const dpHeight = 80; // dataproduct height
          const groupHeight = getNodeHeight(node, nodes, edges, expandedNodes, showAllStates);
          const yOffset = (dpHeight - groupHeight) / 2;

          return {
            ...node,
            position: {
              ...node.position,
              y: dpNode.position.y + yOffset,
            },
          };
        }
      }
    }

    // Align inputGroup nodes vertically centered with their parent dataproduct
    if (node.type === 'inputGroup') {
      const parentDP = getDataProductForInputGroup(node.id, edges, nodes);
      if (parentDP) {
        const dpNode = stackedNodes.find(n => n.id === parentDP);
        if (dpNode) {
          // Center align with parent dataproduct
          const dpHeight = 80; // dataproduct height
          const inputGroupHeight = getNodeHeight(node, nodes, edges, expandedNodes, showAllStates);
          const yOffset = (dpHeight - inputGroupHeight) / 2;

          return {
            ...node,
            position: {
              ...node.position,
              y: dpNode.position.y + yOffset,
            },
          };
        }
      }
    }

    return node;
  });
  } catch (error) {
    console.error('ELK layout error:', error);
    // Return nodes with default positions if layout fails
    return nodes;
  }
};

/**
 * Get dynamic width for different node types
 */
const getNodeWidth = (node, allNodes, edges, expandedNodes) => {
  switch (node.type) {
    case 'dataproduct':
      return 120;
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
    case 'dataproduct':
      return 80;
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