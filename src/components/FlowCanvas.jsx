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
  const [relationships, setRelationships] = useState([]); // Store relationships from API
  const [selectedNode, setSelectedNode] = useState(null); // Track selected port for edge highlighting
  const [expandedNodes, setExpandedNodes] = useState({});
  const [previousExpandedCount, setPreviousExpandedCount] = useState(0); // Track expansion changes
  const [visiblePorts, setVisiblePorts] = useState({}); // Track visible ports per node
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate layout using ELK
  const calculateLayout = useCallback(async (nodes, edges, expandedNodes) => {
    return await getLayoutedNodes(nodes, edges, expandedNodes, {});
  }, []);

  // Build edges dynamically from relationships
  const buildEdgesFromRelationships = useCallback(() => {
    const builtEdges = [];

    relationships.forEach((rel) => {
      // Direct node-to-node edges (shown when collapsed)
      if (rel.type === "direct") {
        // Only show if both nodes are collapsed
        if (!expandedNodes[rel.sourceNode] && !expandedNodes[rel.targetNode]) {
          builtEdges.push({
            id: `edge-${rel.id}`,
            source: rel.sourceNode,
            target: rel.targetNode,
            type: "default",
            style: rel.style,
          });
        }
      }

      // Port-to-port edges (shown when expanded)
      if (rel.type === "port") {
        // Only show if both nodes are expanded
        const bothExpanded = expandedNodes[rel.sourceNode] && expandedNodes[rel.targetNode];
        if (!bothExpanded) return;

        // Check if both ports are visible
        const sourceVisiblePorts = visiblePorts[rel.sourceNode];
        const sourcePortVisible = sourceVisiblePorts?.outputs?.includes(rel.sourcePort);

        const targetVisiblePorts = visiblePorts[rel.targetNode];
        const targetPortVisible = targetVisiblePorts?.inputs?.includes(rel.targetPort);

        // Only create edge if both ports are visible
        if (sourcePortVisible && targetPortVisible) {
          builtEdges.push({
            id: `edge-${rel.id}`,
            source: rel.sourceNode,
            sourceHandle: rel.sourcePort,
            target: rel.targetNode,
            targetHandle: rel.targetPort,
            type: "default",
            style: rel.style,
          });
        }
      }
    });

    return builtEdges;
  }, [relationships, expandedNodes, visiblePorts]);

  // Update edges whenever expansion state or visible ports change
  // Use debounce to ensure all handles are registered before building edges
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newEdges = buildEdgesFromRelationships();
      setEdges(newEdges);
    }, 1); // 1ms debounce ensures proper execution order

    return () => clearTimeout(timeoutId);
  }, [buildEdgesFromRelationships, setEdges]);

  // Load data from mock API
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getFlowData();

        // Store relationships for dynamic edge building
        setRelationships(data.relationships || []);

        // Add default positions for initial load (ELK will override these)
        const nodesWithDefaultPositions = data.nodes.map((node) => ({
          ...node,
          position: { x: 0, y: 0 },
        }));

        // Build initial edges (will be empty for collapsed nodes)
        const initialEdges = [];
        data.relationships?.forEach((rel) => {
          if (rel.type === "direct") {
            initialEdges.push({
              id: `edge-${rel.id}`,
              source: rel.sourceNode,
              target: rel.targetNode,
              type: "default",
              style: rel.style,
            });
          }
        });

        const layoutNodes = await calculateLayout(
          nodesWithDefaultPositions,
          initialEdges,
          {}
        );
        setNodes(layoutNodes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [setNodes, calculateLayout]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Suppress handle-related errors during pagination transitions
  const onError = useCallback((code, message) => {
    // Suppress error #008 (handle not found) during pagination
    // This can happen temporarily while React Flow processes handle updates
    if (code === '008') {
      console.debug('Handle temporarily unavailable during pagination:', message);
      return;
    }
    // Log other errors normally
    console.error(`React Flow Error ${code}:`, message);
  }, []);

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

  // Update layout only when expanding, not when collapsing
  useEffect(() => {
    const currentExpandedCount = Object.values(expandedNodes).filter(Boolean).length;

    // Only recalculate layout if we're expanding (count increased)
    // Don't recalculate when collapsing (count decreased) to preserve positions
    if (currentExpandedCount > previousExpandedCount) {
      const updateLayout = async () => {
        if (edges.length > 0) {
          const layoutedNodes = await calculateLayout(nodes, edges, expandedNodes);
          setNodes(layoutedNodes);
        }
      };
      updateLayout();
    }

    // Update the previous count for next comparison
    setPreviousExpandedCount(currentExpandedCount);
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

  // Style edges based on selection
  const styledEdges = edges.map((edge) => {
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
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onError={onError}
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
