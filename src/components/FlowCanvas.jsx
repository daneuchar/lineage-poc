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
  const [selectedChild, setSelectedChild] = useState(null);
  const [_selectedInput, setSelectedInput] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null); // Track selected node for edge highlighting
  const [expandedNodes, setExpandedNodes] = useState({});
  const [visibleHandles, setVisibleHandles] = useState({});
  const [showAllStates, setShowAllStates] = useState({}); // Track "show all" state per node
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate layout using ELK
  const calculateLayout = useCallback(async (nodes, edges, expandedNodes, showAllStates) => {
    return await getLayoutedNodes(nodes, edges, expandedNodes, showAllStates);
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
          {},
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

  const handleChildSelect = useCallback(
    (childId) => {
      setSelectedChild(childId);
      // Set the selected node to the child ID for edge highlighting
      setSelectedNode(childId);
    },
    []
  );

  const handleInputSelect = useCallback(
    (inputId) => {
      setSelectedInput(inputId);
      // Set the selected node to the input ID for edge highlighting
      setSelectedNode(inputId);
    },
    []
  );

  const handleToggleExpansion = useCallback(
    (nodeId) => {
      console.log("Toggling expansion for:", nodeId);
      setExpandedNodes((prev) => {
        const newState = { ...prev };

        // Toggle the clicked node
        newState[nodeId] = !prev[nodeId];

        // Smart expansion logic: when expanding a dataproduct, auto-expand dependencies
        if (newState[nodeId] && !prev[nodeId]) {
          // Find all dataproducts that this one depends on (via group->inputGroup connections)
          const dependencyDataProducts = getDependencyDataProducts(nodeId, edges, nodes);

          dependencyDataProducts.forEach((depDP) => {
            if (depDP && !prev[depDP]) {
              newState[depDP] = true;
              console.log(
                `Auto-expanding ${depDP} because ${nodeId} depends on it`
              );
            }
          });
        }

        // Smart collapse logic: when collapsing a dataproduct, auto-collapse dependents
        if (!newState[nodeId] && prev[nodeId]) {
          // Find all dataproducts that depend on this one
          const dependentDataProducts = getDependentDataProducts(nodeId, edges, nodes);

          console.log({ dependentDataProducts });

          dependentDataProducts.forEach((depDP) => {
            if (depDP && prev[depDP]) {
              newState[depDP] = false;
              console.log(
                `Auto-collapsing ${depDP} because it depends on ${nodeId}`
              );
            }
          });
        }

        console.log("New expanded state:", newState);

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

        return newState;
      });
    },
    [fitView, getNode, nodes, edges]
  );

  const handleVisibleHandlesChange = useCallback((nodeId, handles) => {
    setVisibleHandles((prev) => ({
      ...prev,
      [nodeId]: handles,
    }));
  }, []);

  const handleShowAllChange = useCallback((nodeId, showAll) => {
    setShowAllStates((prev) => {
      const newState = { ...prev, [nodeId]: showAll };
      return newState;
    });
  }, []);

  const handleNodeClick = useCallback((nodeId) => {
    // Toggle selection: if clicking the same node, deselect it
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Update layout when expansion state or showAll state changes
  useEffect(() => {
    const updateLayout = async () => {
      if (edges.length > 0) {
        const layoutedNodes = await calculateLayout(nodes, edges, expandedNodes, showAllStates);
        setNodes(layoutedNodes);
      }
    };
    updateLayout();
  }, [expandedNodes, showAllStates]);

  // Helper function to check if edges exist between two nodes
  const hasConnectingEdges = (sourceNodeId, targetNodeId) => {
    return checkConnectingEdges(sourceNodeId, targetNodeId, edges);
  };

  // Filter nodes based on expansion state and edge connectivity
  const nodesWithCallback = nodes
    .filter((node) => {
      // Hide input/output group nodes when their corresponding dataproduct is not expanded
      // AND only show them if there are connecting edges
      if (node.type === "group") {
        const dataProductId = getDataProductForGroup(node.id, edges, nodes);
        if (dataProductId) {
          return (
            expandedNodes[dataProductId] &&
            hasConnectingEdges(dataProductId, node.id)
          );
        }
        return false;
      }
      if (node.type === "inputGroup") {
        const dataProductId = getDataProductForInputGroup(node.id, edges, nodes);
        if (dataProductId) {
          // Show inputGroup if its dataproduct is expanded AND there's a connection to the dataproduct
          return (
            expandedNodes[dataProductId] &&
            hasConnectingEdges(node.id, dataProductId)
          );
        }
        return false;
      }
      return true;
    })
    .map((node) => {
      if (node.type === "group") {
        const dataProductId = getDataProductForGroup(node.id, edges, nodes);
        const expanded = dataProductId ? expandedNodes[dataProductId] : false;
        return {
          ...node,
          data: {
            ...node.data,
            onChildSelect: handleChildSelect,
            onVisibleHandlesChange: (handles) =>
              handleVisibleHandlesChange(node.id, handles),
            onShowAllChange: (showAll) => handleShowAllChange(node.id, showAll),
            onNodeClick: () => handleNodeClick(node.id),
            selected: selectedNode === node.id,
            showAll: showAllStates[node.id] || false,
            expanded,
          },
        };
      }
      if (node.type === "inputGroup") {
        const dataProductId = getDataProductForInputGroup(node.id, edges, nodes);
        const expanded = dataProductId ? expandedNodes[dataProductId] : false;
        return {
          ...node,
          data: {
            ...node.data,
            onInputSelect: handleInputSelect,
            onVisibleHandlesChange: (handles) =>
              handleVisibleHandlesChange(node.id, handles),
            onShowAllChange: (showAll) => handleShowAllChange(node.id, showAll),
            onNodeClick: () => handleNodeClick(node.id),
            selected: selectedNode === node.id,
            showAll: showAllStates[node.id] || false,
            expanded,
          },
        };
      }
      if (node.type === "dataproduct") {
        const expanded = expandedNodes[node.id];
        return {
          ...node,
          data: {
            ...node.data,
            onToggleExpansion: () => handleToggleExpansion(node.id),
            onNodeClick: () => handleNodeClick(node.id),
            selected: selectedNode === node.id,
            expanded,
          },
        };
      }
      return node;
    });

  // Filter edges to only show when nodes are expanded and handles exist, and apply styling
  const filteredEdges = edges
    .filter((edge) => {
    const sourceNode = nodesWithCallback.find((n) => n.id === edge.source);
    const targetNode = nodesWithCallback.find((n) => n.id === edge.target);

    // Only include edges if both nodes exist in the filtered node list
    if (!sourceNode || !targetNode) {
      return false;
    }

    // For inputGroup edges FROM inputGroup
    if (sourceNode.type === "inputGroup") {
      const dataProductId = getDataProductForInputGroup(sourceNode.id, edges, nodes);
      return dataProductId ? expandedNodes[dataProductId] : false;
    }

    // For edges TO inputGroup nodes
    if (targetNode.type === "inputGroup") {
      const dataProductId = getDataProductForInputGroup(targetNode.id, edges, nodes);
      return dataProductId ? expandedNodes[dataProductId] : false;
    }

    // For edges FROM dataproduct TO group nodes
    if (sourceNode.type === "dataproduct" && targetNode.type === "group") {
      return expandedNodes[sourceNode.id];
    }

    // For edges FROM group nodes TO inputGroup nodes
    if (sourceNode.type === "group" && targetNode.type === "inputGroup") {
      const sourceDataProductId = getDataProductForGroup(sourceNode.id, edges, nodes);
      const targetDataProductId = getDataProductForInputGroup(targetNode.id, edges, nodes);
      // Show edges when both related dataproducts are expanded
      return (
        sourceDataProductId &&
        targetDataProductId &&
        expandedNodes[sourceDataProductId] &&
        expandedNodes[targetDataProductId]
      );
    }

    // For edges FROM group nodes TO dataproduct nodes
    if (sourceNode.type === "group" && targetNode.type === "dataproduct") {
      const sourceDataProductId = getDataProductForGroup(sourceNode.id, edges, nodes);
      return sourceDataProductId ? expandedNodes[sourceDataProductId] : false;
    }

    // For direct edges between dataproduct nodes - show if edge exists in data
    if (
      sourceNode.type === "dataproduct" &&
      targetNode.type === "dataproduct"
    ) {
      // Show direct edge when both dataproducts exist (always visible)
      return !(expandedNodes[sourceNode.id] && expandedNodes[targetNode.id]);
    }

    return false;
  })
  .map((edge) => {
    // Highlight edges connected to the selected node
    // For child nodes, check both the node ID and the handle IDs
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
