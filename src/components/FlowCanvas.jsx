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
  const [expandedNodes, setExpandedNodes] = useState({});
  const [visibleHandles, setVisibleHandles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const originalEdgesRef = useRef([]);

  // Calculate layout using Dagre
  const calculateDagreLayout = useCallback((nodes, edges, expandedNodes) => {
    return getLayoutedNodes(nodes, edges, expandedNodes);
  }, []);

  // Load data from mock API
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getFlowData();
        originalEdgesRef.current = data.edges;

        // Add default positions for initial load (Dagre will override these)
        const nodesWithDefaultPositions = data.nodes.map((node) => ({
          ...node,
          position: { x: 0, y: 0 },
        }));

        const layoutNodes = calculateDagreLayout(
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
  }, [setNodes, setEdges, calculateDagreLayout]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleChildSelect = useCallback(
    (childId) => {
      setSelectedChild(childId);

      // Update edges with highlighting
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            stroke: edge.targetHandle === childId ? "#3b82f6" : "#9ca3af",
            strokeWidth: edge.targetHandle === childId ? 2 : 1,
          },
        }))
      );
    },
    [setEdges]
  );

  const handleInputSelect = useCallback(
    (inputId) => {
      setSelectedInput(inputId);

      // Update edges with highlighting for input connections
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            stroke:
              edge.sourceHandle === inputId
                ? "#10b981"
                : edge.targetHandle === selectedChild
                ? "#3b82f6"
                : "#9ca3af",
            strokeWidth:
              edge.sourceHandle === inputId
                ? 2
                : edge.targetHandle === selectedChild
                ? 2
                : 1,
          },
        }))
      );
    },
    [setEdges, selectedChild]
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
          const dependencyDataProducts = originalEdgesRef.current
            .filter((edge) => {
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (targetNode?.type === "inputGroup") {
                const dependentDP = getDataProductForInputGroup(edge.target);
                return dependentDP === nodeId;
              }
              return false;
            })
            .map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              if (sourceNode?.type === "group") {
                return getDataProductForGroup(edge.source);
              }
              return null;
            })
            .filter(Boolean);

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
          const dependentDataProducts = originalEdgesRef.current
            .filter((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              if (sourceNode?.type === "group") {
                const sourceDP = getDataProductForGroup(edge.source);
                return sourceDP === nodeId;
              }
              return false;
            })
            .map((edge) => {
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (targetNode?.type === "inputGroup") {
                return getDataProductForInputGroup(edge.target);
              }
              return null;
            })
            .filter(Boolean);

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
    [fitView, getNode]
  );

  const handleVisibleHandlesChange = useCallback((nodeId, handles) => {
    setVisibleHandles((prev) => ({
      ...prev,
      [nodeId]: handles,
    }));
  }, []);

  // Update layout when expansion state changes
  useEffect(() => {
    console.log("Layout effect triggered, expandedNodes:", expandedNodes);
    if (originalEdgesRef.current.length > 0) {
      setNodes((currentNodes) => {
        console.log("Recalculating layout with nodes:", currentNodes.length);
        return calculateDagreLayout(
          currentNodes,
          originalEdgesRef.current,
          expandedNodes
        );
      });
    }
  }, [expandedNodes, calculateDagreLayout, setNodes]);

  // Helper function to check if edges exist between two nodes
  const hasConnectingEdges = (sourceNodeId, targetNodeId) => {
    return originalEdgesRef.current.some(
      (edge) => edge.source === sourceNodeId && edge.target === targetNodeId
    );
  };

  // Dynamic helper functions based on edge data
  const getDataProductForGroup = (groupNodeId) => {
    // Find which dataproduct connects to this group
    const edge = originalEdgesRef.current.find(
      (edge) =>
        edge.target === groupNodeId &&
        nodes.find((n) => n.id === edge.source)?.type === "dataproduct"
    );
    return edge?.source;
  };

  const getDataProductForInputGroup = (inputGroupId) => {
    // Find which dataproduct this inputGroup connects to
    const edge = originalEdgesRef.current.find(
      (edge) =>
        edge.source === inputGroupId &&
        nodes.find((n) => n.id === edge.target)?.type === "dataproduct"
    );
    return edge?.target;
  };

  const getInputGroupsConnectedToGroup = (groupId) => {
    // Find inputGroups that receive from this group
    return originalEdgesRef.current
      .filter(
        (edge) =>
          edge.source === groupId &&
          nodes.find((n) => n.id === edge.target)?.type === "inputGroup"
      )
      .map((edge) => edge.target);
  };

  const getGroupsConnectedToInputGroup = (inputGroupId) => {
    // Find groups that feed into this inputGroup
    return originalEdgesRef.current
      .filter(
        (edge) =>
          edge.target === inputGroupId &&
          nodes.find((n) => n.id === edge.source)?.type === "group"
      )
      .map((edge) => edge.source);
  };

  // Filter nodes based on expansion state and edge connectivity
  const nodesWithCallback = nodes
    .filter((node) => {
      // Hide input/output group nodes when their corresponding dataproduct is not expanded
      // AND only show them if there are connecting edges
      if (node.type === "group") {
        const dataProductId = getDataProductForGroup(node.id);
        if (dataProductId) {
          return (
            expandedNodes[dataProductId] &&
            hasConnectingEdges(dataProductId, node.id)
          );
        }
        return false;
      }
      if (node.type === "inputGroup") {
        const dataProductId = getDataProductForInputGroup(node.id);
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
        const dataProductId = getDataProductForGroup(node.id);
        const expanded = dataProductId ? expandedNodes[dataProductId] : false;
        return {
          ...node,
          data: {
            ...node.data,
            onChildSelect: handleChildSelect,
            onVisibleHandlesChange: (handles) =>
              handleVisibleHandlesChange(node.id, handles),
            expanded,
          },
        };
      }
      if (node.type === "inputGroup") {
        const dataProductId = getDataProductForInputGroup(node.id);
        const expanded = dataProductId ? expandedNodes[dataProductId] : false;
        return {
          ...node,
          data: {
            ...node.data,
            onInputSelect: handleInputSelect,
            onVisibleHandlesChange: (handles) =>
              handleVisibleHandlesChange(node.id, handles),
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
            expanded,
          },
        };
      }
      return node;
    });

  // Filter edges to only show when nodes are expanded and handles exist, and apply styling
  const filteredEdges = originalEdgesRef.current
    .filter((edge) => {
      const sourceNode = nodesWithCallback.find((n) => n.id === edge.source);
      const targetNode = nodesWithCallback.find((n) => n.id === edge.target);

      // Only include edges if both nodes exist in the filtered node list
      if (!sourceNode || !targetNode) {
        return false;
      }

      // For inputGroup edges FROM inputGroup
      if (sourceNode.type === "inputGroup") {
        const dataProductId = getDataProductForInputGroup(sourceNode.id);
        return dataProductId ? expandedNodes[dataProductId] : false;
      }

      // For edges TO inputGroup nodes
      if (targetNode.type === "inputGroup") {
        const dataProductId = getDataProductForInputGroup(targetNode.id);
        return dataProductId ? expandedNodes[dataProductId] : false;
      }

      // For edges FROM dataproduct TO group nodes
      if (sourceNode.type === "dataproduct" && targetNode.type === "group") {
        return expandedNodes[sourceNode.id];
      }

      // For edges FROM group nodes TO inputGroup nodes
      if (sourceNode.type === "group" && targetNode.type === "inputGroup") {
        const sourceDataProductId = getDataProductForGroup(sourceNode.id);
        const targetDataProductId = getDataProductForInputGroup(targetNode.id);
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
        const sourceDataProductId = getDataProductForGroup(sourceNode.id);
        return sourceDataProductId ? expandedNodes[sourceDataProductId] : false;
      }

      // For direct edges between dataproduct nodes - show if edge exists in data
      if (
        sourceNode.type === "dataproduct" &&
        targetNode.type === "dataproduct"
      ) {
        // Show direct edge when both dataproducts exist (always visible)
        return true;
      }

      return false;
    })
    .map((edge) => {
      const sourceNode = nodesWithCallback.find((n) => n.id === edge.source);
      const targetNode = nodesWithCallback.find((n) => n.id === edge.target);

      // Hide direct DP-DP edges when either dataproduct is expanded
      if (
        sourceNode?.type === "dataproduct" &&
        targetNode?.type === "dataproduct"
      ) {
        const sourceExpanded = expandedNodes[edge.source];
        const targetExpanded = expandedNodes[edge.target];

        if (sourceExpanded || targetExpanded) {
          return {
            ...edge,
            style: {
              ...edge.style,
              opacity: 0,
            },
          };
        }
      }

      return edge;
    });

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            Loading flow data...
          </div>
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid #e5e7eb",
              borderTop: "2px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            background: "white",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            color: "#dc2626",
          }}
        >
          <div
            style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}
          >
            Error loading flow data
          </div>
          <div style={{ fontSize: "12px" }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
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
          animated: false,
          style: { strokeWidth: 2 },
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
