import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import DataProductNode from "./DataProductNode";
import GroupNode from "./GroupNode";
import InputGroupNode from "./InputGroupNode";
import { mockApi } from "../services/mockApi";
import { getLayoutedNodes } from "../utils/layoutUtils";
import {
  getDataProductForGroup,
  getDataProductForInputGroup,
  getDependentDataProducts,
  getDependencyDataProducts,
  hasConnectingEdges as checkConnectingEdges,
  getInputGroupsConnectedToGroup,
  getGroupsConnectedToInputGroup,
} from "../utils/graphUtils";

const nodeTypes = {
  dataproduct: DataProductNode,
  group: GroupNode,
  inputGroup: InputGroupNode,
};

function FlowCanvas() {
  const { fitView, getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null); // Track selected port for edge highlighting
  const [expandedNodes, setExpandedNodes] = useState({});
  const [visiblePorts, setVisiblePorts] = useState({}); // Track visible ports per node
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBackground, setShowBackground] = useState(true); // Track background visibility

  // Calculate layout using ELK
  const calculateLayout = useCallback(async (nodes, edges, expandedNodes) => {
    return await getLayoutedNodes(nodes, edges, expandedNodes, {});
  }, []);

  // Load data from mock API
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getFlowData();

        // Add default positions for initial load (ELK will override these)
        const nodesWithDefaultPositions = data.nodes.map((node) => ({
          ...node,
          position: { x: 0, y: 0 },
        }));

        const layoutNodes = await calculateLayout(
          nodesWithDefaultPositions,
          data.edges,
          {}
        );
        setNodes(layoutNodes);
        setEdges(data.edges);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [setNodes, setEdges, calculateLayout]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleToggleExpansion = useCallback(
    (nodeId) => {
      // Determine if we're expanding or collapsing
      setExpandedNodes((prev) => {
        const isExpanding = !prev[nodeId];
        const newState = { ...prev, [nodeId]: isExpanding };

        // If expanding, also expand all directly connected nodes (radius 1)
        if (isExpanding) {
          // Find all edges connected to this node
          const connectedNodeIds = new Set();

          edges.forEach((edge) => {
            // Check if this is a direct dataproduct edge (no handles)
            if (!edge.sourceHandle && !edge.targetHandle) {
              if (edge.source === nodeId) {
                connectedNodeIds.add(edge.target);
              } else if (edge.target === nodeId) {
                connectedNodeIds.add(edge.source);
              }
            }
          });

          // Expand all connected nodes
          connectedNodeIds.forEach((connectedId) => {
            newState[connectedId] = true;
          });

          console.log(`Expanding ${nodeId} and ${connectedNodeIds.size} connected nodes:`, Array.from(connectedNodeIds));

          // Center on all expanded nodes after expansion with a slight delay
          setTimeout(() => {
            const expandedNodeIds = [nodeId, ...Array.from(connectedNodeIds)];

            // Get the actual node objects
            const nodesToFit = expandedNodeIds
              .map(id => getNode(id))
              .filter(Boolean);

            if (nodesToFit.length > 0) {
              fitView({
                nodes: nodesToFit,
                duration: 800,
                padding: 0.2,
                minZoom: 0.5,
                maxZoom: 1.0,
              });
            }
          }, 100);
        } else {
          // Just center on the collapsed node
          setTimeout(() => {
            const node = getNode(nodeId);
            if (node) {
              fitView({
                nodes: [node],
                duration: 800,
                padding: 0.3,
                minZoom: 0.8,
                maxZoom: 1.2,
              });
            }
          }, 100);
        }

        return newState;
      });
    },
    [fitView, getNode, edges]
  );

  const handlePortSelect = useCallback((portId) => {
    // Toggle selection: if clicking the same port, deselect it
    setSelectedNode((prev) => (prev === portId ? null : portId));
  }, []);

  const handleNodeClick = useCallback((nodeId) => {
    // Toggle selection: if clicking the same node, deselect it
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleVisiblePortsChange = useCallback((nodeId, visibleInputs, visibleOutputs) => {
    setVisiblePorts((prev) => ({
      ...prev,
      [nodeId]: {
        inputs: visibleInputs,
        outputs: visibleOutputs,
      },
    }));
  }, []);

  // Update layout when expansion state changes
  useEffect(() => {
    const updateLayout = async () => {
      if (edges.length > 0) {
        const layoutedNodes = await calculateLayout(nodes, edges, expandedNodes);
        setNodes(layoutedNodes);
      }
    };
    updateLayout();
  }, [expandedNodes]);

  // Add callbacks to dataproduct nodes
  const nodesWithCallback = nodes.map((node) => {
    if (node.type === "dataproduct") {
      const expanded = expandedNodes[node.id];
      return {
        ...node,
        data: {
          ...node.data,
          onToggleExpansion: () => handleToggleExpansion(node.id),
          onNodeClick: () => handleNodeClick(node.id),
          onPortSelect: handlePortSelect,
          onVisiblePortsChange: (visibleInputs, visibleOutputs) =>
            handleVisiblePortsChange(node.id, visibleInputs, visibleOutputs),
          selected: selectedNode === node.id,
          expanded,
        },
      };
    }
    return node;
  });

  // Filter and style edges
  const filteredEdges = edges
    .filter((edge) => {
      const sourceNode = nodesWithCallback.find((n) => n.id === edge.source);
      const targetNode = nodesWithCallback.find((n) => n.id === edge.target);

      // Only show edges if both nodes exist
      if (!sourceNode || !targetNode) {
        return false;
      }

      // For dataproduct to dataproduct edges with handles (port-to-port)
      // Show only when both dataproducts are expanded
      if (edge.sourceHandle && edge.targetHandle) {
        const bothExpanded = expandedNodes[edge.source] && expandedNodes[edge.target];
        return bothExpanded;
      }

      // For direct dataproduct to dataproduct edges (without handles)
      // Show when at least one dataproduct is collapsed (hide only when both are expanded)
      if (sourceNode.type === "dataproduct" && targetNode.type === "dataproduct") {
        return !(expandedNodes[edge.source] && expandedNodes[edge.target]);
      }

      return false;
    })
    .map((edge) => {
      // Highlight edges connected to the selected port
      const isConnectedToSelected = selectedNode && (
        edge.source === selectedNode ||
        edge.target === selectedNode ||
        edge.sourceHandle === selectedNode ||
        edge.targetHandle === selectedNode
      );

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isConnectedToSelected
            ? "#0097C2" // Highlighted color (Focus blue)
            : edge.style?.stroke || "#9C9C9C", // Default or original color
          strokeWidth: isConnectedToSelected ? 3 : edge.style?.strokeWidth || 1,
          opacity: selectedNode && !isConnectedToSelected ? 0.3 : 1, // Dim non-connected edges
        },
        animated: isConnectedToSelected, // Animate highlighted edges
      };
    });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-text">Loading flow data...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-title">Error loading flow data</div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-container">
      <ReactFlow
        nodes={nodesWithCallback}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          duration: 800,
        }}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: { strokeWidth: 1 },
          pathOptions: { borderRadius: 20 },
        }}
      >
        <Controls>
          <ControlButton onClick={() => setShowBackground(!showBackground)} title={showBackground ? "Hide Grid" : "Show Grid"}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              {showBackground ? (
                <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
              ) : (
                <>
                  <rect x="2" y="2" width="5" height="5" fill="currentColor" />
                  <rect x="9" y="2" width="5" height="5" fill="currentColor" />
                  <rect x="2" y="9" width="5" height="5" fill="currentColor" />
                  <rect x="9" y="9" width="5" height="5" fill="currentColor" />
                </>
              )}
            </svg>
          </ControlButton>
        </Controls>
        <MiniMap />
        {showBackground && <Background variant="dots" gap={12} size={1} />}
      </ReactFlow>
    </div>
  );
}

export default FlowCanvas;
