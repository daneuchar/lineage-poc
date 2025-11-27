import dagre from 'dagre';
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
import type { DataProductNodeData, ExpandedNodesState } from '../types';

/**
 * Calculate automatic layout using Dagre for hierarchical flow
 */
export const getLayoutedNodes = async (
  nodes: ReactFlowNode<DataProductNodeData>[],
  edges: ReactFlowEdge[],
  expandedNodes: ExpandedNodesState = {},
  _showAllStates: Record<string, boolean> = {}
): Promise<ReactFlowNode<DataProductNodeData>[]> => {
  // For debugging
  console.log('Layout: Expanded nodes:', expandedNodes);

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure the graph layout
  dagreGraph.setGraph({
    rankdir: 'LR', // Left to Right
    nodesep: 80, // Vertical spacing between nodes
    ranksep: 150, // Horizontal spacing between layers
    edgesep: 50, // Edge spacing
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
const getNodeWidth = (
  node: ReactFlowNode<DataProductNodeData>,
  expandedNodes: ExpandedNodesState
): number => {
  if (node.type === 'dataproduct') {
    const isExpanded = expandedNodes[node.id];
    return isExpanded ? 420 : 120;
  }
  if (node.type === 'table' || node.type === 'dataset') {
    return 320; // Fixed width for dataset nodes (matches minWidth: 280px + padding)
  }
  return 150; // Default width
};

/**
 * Get dynamic height for different node types based on content
 */
const getNodeHeight = (
  node: ReactFlowNode<DataProductNodeData>,
  expandedNodes: ExpandedNodesState
): number => {
  if (node.type === 'dataproduct') {
    const data = node.data as DataProductNodeData;
    const isExpanded = expandedNodes[node.id];
    if (!isExpanded) return 80;

    // Calculate height based on number of ports with pagination
    const inputCount = data.inputs?.length || 0;
    const outputCount = data.outputs?.length || 0;
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
    return 100 + maxVisiblePorts * 28 + paginationHeight;
  }
  if (node.type === 'table' || node.type === 'dataset') {
    // Calculate height based on number of columns in the dataset node
    const tableData = node.data as any; // DatasetNodeData from ColumnLineageCanvas
    const columnCount = tableData.columns?.length || 0;

    // Header section: title (20px) + datasetType (19px) + schema (18px) + spacing (24px) = ~61px
    // Border and divider: 9px
    // Each column item: ~35px (padding 6px*2 + font 12px + border + margin)

    const headerHeight = 70; // header + borders
    const columnItemHeight = 35;

    return headerHeight + (columnCount * columnItemHeight);
  }
  return 100; // Default height
};
