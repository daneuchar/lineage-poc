import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
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
      setExpandedNodes((prev) => ({
        ...prev,
        [nodeId]: !prev[nodeId],
      }));

      // Center on the node after expansion with a slight delay
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
    },
    [fitView, getNode]
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
      // Show only when both dataproducts are expanded AND both ports are visible
      if (edge.sourceHandle && edge.targetHandle) {
        const bothExpanded = expandedNodes[edge.source] && expandedNodes[edge.target];
        if (!bothExpanded) return false;

        // Check if source port is visible
        const sourceVisiblePorts = visiblePorts[edge.source];
        const sourcePortVisible = sourceVisiblePorts?.outputs?.includes(edge.sourceHandle);

        // Check if target port is visible
        const targetVisiblePorts = visiblePorts[edge.target];
        const targetPortVisible = targetVisiblePorts?.inputs?.includes(edge.targetHandle);

        return sourcePortVisible && targetPortVisible;
      }

      // For direct dataproduct to dataproduct edges (without handles)
      // Show only when both dataproducts are collapsed
      if (sourceNode.type === "dataproduct" && targetNode.type === "dataproduct") {
        return !expandedNodes[edge.source] && !expandedNodes[edge.target];
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
            ? "#3b82f6" // Highlighted color (blue)
            : edge.style?.stroke || "#9ca3af", // Default or original color
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
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default FlowCanvas;
