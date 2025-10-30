import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ControlButton,
  type Node as ReactFlowNode,
  type Edge as ReactFlowEdge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DataProductNode from './DataProductNode';

import { mockApi } from '../services/mockApi';
import { getLayoutedNodes } from '../utils/layoutUtils';
import { findCompleteLineage, findNodeLineage } from '../utils/lineageUtils';
import type {
  DataProductNodeData,
  Relationship,
  ExpandedNodesState,
  VisiblePortsState,
  CompleteLineageResult,
} from '../types';

const nodeTypes = {
  dataproduct: DataProductNode,
};

interface FlowCanvasProps {
  onViewColumnLineage?: (portId: string) => void;
}

function FlowCanvas({ onViewColumnLineage }: FlowCanvasProps) {
  const { fitView, getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<DataProductNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]); // Store relationships from API
  const [manualEdges, setManualEdges] = useState<ReactFlowEdge[]>([]); // Store manually created edges
  const [selectedNode, setSelectedNode] = useState<string | null>(null); // Track selected port for edge highlighting
  const [expandedNodes, setExpandedNodes] = useState<ExpandedNodesState>({});
  const [visiblePorts, setVisiblePorts] = useState<VisiblePortsState>({}); // Track visible ports per node
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(false); // Track background visibility
  const [lineage, setLineage] = useState<CompleteLineageResult>({
    nodes: new Set(),
    edges: new Set(),
    ports: new Set(),
    upstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
    downstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
  }); // Track lineage

  // Calculate layout using Dagre
  const calculateLayout = useCallback(
    async (
      nodes: ReactFlowNode<DataProductNodeData>[],
      edges: ReactFlowEdge[],
      expandedNodes: ExpandedNodesState
    ) => {
      return await getLayoutedNodes(nodes, edges, expandedNodes, {});
    },
    []
  );

  // Build edges dynamically from relationships
  const buildEdgesFromRelationships = useCallback(() => {
    const builtEdges: ReactFlowEdge[] = [];

    relationships.forEach((rel) => {
      // Direct node-to-node edges (shown when at least one node is collapsed)
      if (rel.type === 'direct') {
        const sourceCollapsed = !expandedNodes[rel.sourceNode];
        const targetCollapsed = !expandedNodes[rel.targetNode];

        // Show direct edge if at least one node is collapsed
        // (can't show port-to-port edges if one is collapsed)
        if (sourceCollapsed || targetCollapsed) {
          builtEdges.push({
            id: `edge-${rel.id}`,
            source: rel.sourceNode,
            target: rel.targetNode,
            type: 'default',
            style: rel.style,
          });
        }
      }

      // Port-to-port edges (shown when both nodes are expanded)
      if (rel.type === 'port') {
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
            type: 'default',
            style: rel.style,
          });
        }
      }
    });

    // Internal edges: Connect related ports within the same node using internal handles
    nodes.forEach((node) => {
      if (node.type === 'dataproduct' && expandedNodes[node.id]) {
        const nodeVisiblePorts = visiblePorts[node.id];
        const visibleInputs = nodeVisiblePorts?.inputs || [];
        const visibleOutputs = nodeVisiblePorts?.outputs || [];

        // For each visible input port, create edges to its related output ports
        node.data.inputs?.forEach((input) => {
          // Only process if this input is visible
          if (!visibleInputs.includes(input.id)) return;

          // For each related output port
          input.relatedPorts?.forEach((relatedPortId) => {
            // Only create edge if the related output port is also visible
            if (visibleOutputs.includes(relatedPortId)) {
              builtEdges.push({
                id: `internal-${node.id}-${input.id}-${relatedPortId}`,
                source: node.id,
                sourceHandle: `${input.id}-internal`, // Use internal handle on right side of input
                target: node.id,
                targetHandle: `${relatedPortId}-internal`, // Use internal handle on left side of output
                type: 'default', // Use default bezier curves for smooth, curvy internal edges
                style: {
                  stroke: '#f59e0b', // Amber color for internal transformations
                  strokeWidth: 1.5,
                  strokeDasharray: '5,5', // Dotted line to distinguish from external edges
                },
              });
            }
          });
        });
      }
    });

    // Add manual edges to the built edges
    manualEdges.forEach((edge) => {
      // Only add manual edge if it's not already in builtEdges (avoid duplicates)
      if (!builtEdges.some((e) => e.id === edge.id)) {
        builtEdges.push(edge);
      }
    });

    return builtEdges;
  }, [relationships, expandedNodes, visiblePorts, nodes, manualEdges]);

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

        // Add default positions for initial load (layout will override these)
        const nodesWithDefaultPositions = data.nodes.map((node) => ({
          ...node,
          position: { x: 0, y: 0 },
        }));

        // Build initial edges (will be empty for collapsed nodes)
        const initialEdges: ReactFlowEdge[] = [];
        data.relationships?.forEach((rel) => {
          if (rel.type === 'direct') {
            initialEdges.push({
              id: `edge-${rel.id}`,
              source: rel.sourceNode,
              target: rel.targetNode,
              type: 'default',
              style: rel.style,
            });
          }
        });

        // Calculate layout assuming all nodes will be expanded for proper spacing
        // This prevents overlapping when nodes expand for the first time
        const assumeAllExpanded: ExpandedNodesState = {};
        nodesWithDefaultPositions.forEach((node) => {
          assumeAllExpanded[node.id] = true;
        });

        const layoutNodes = await calculateLayout(nodesWithDefaultPositions, initialEdges, assumeAllExpanded);
        setNodes(layoutNodes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [setNodes, calculateLayout]);

  // Suppress handle-related errors during pagination transitions
  const onError = useCallback((code: string, message: string) => {
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
    (nodeId: string) => {
      // Determine if we're expanding or collapsing
      setExpandedNodes((prev) => {
        const isExpanding = !prev[nodeId];
        const newState = { ...prev, [nodeId]: isExpanding };

        // If expanding, also expand all directly connected nodes (radius 1)
        if (isExpanding) {
          // Find all edges connected to this node
          const connectedNodeIds = new Set<string>();

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

          console.log(
            `Expanding ${nodeId} and ${connectedNodeIds.size} connected nodes:`,
            Array.from(connectedNodeIds)
          );

          // Center on all expanded nodes after expansion with a slight delay
          setTimeout(() => {
            const expandedNodeIds = [nodeId, ...Array.from(connectedNodeIds)];

            // Get the actual node objects
            const nodesToFit = expandedNodeIds.map((id) => getNode(id)).filter(Boolean);

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
        }
        // When collapsing, do not center - keep current viewport position

        return newState;
      });
    },
    [fitView, getNode, edges]
  );

  const handlePortSelect = useCallback(
    (portId: string | null) => {
      // Toggle selection: if clicking the same port, deselect it
      setSelectedNode((prev) => {
        const newSelection = prev === portId ? null : portId;

        // Calculate lineage for the selected port
        if (newSelection) {
          const lineageData = findCompleteLineage(newSelection, relationships, nodes);
          setLineage(lineageData);
        } else {
          // Clear lineage when deselecting
          setLineage({
            nodes: new Set(),
            edges: new Set(),
            ports: new Set(),
            upstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
            downstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
          });
        }

        return newSelection;
      });
    },
    [relationships, nodes]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      // Toggle selection: if clicking the same node, deselect it
      setSelectedNode((prev) => {
        const newSelection = prev === nodeId ? null : nodeId;

        // Calculate lineage for the selected node (when collapsed)
        if (newSelection) {
          const lineageData = findNodeLineage(newSelection, relationships, nodes);
          setLineage({
            ...lineageData,
            ports: new Set(),
            upstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
            downstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
          });
        } else {
          // Clear lineage when deselecting
          setLineage({
            nodes: new Set(),
            edges: new Set(),
            ports: new Set(),
            upstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
            downstream: { nodes: new Set(), edges: new Set(), ports: new Set() },
          });
        }

        return newSelection;
      });
    },
    [relationships, nodes]
  );

  const handleVisiblePortsChange = useCallback((nodeId: string, visibleInputs: string[], visibleOutputs: string[]) => {
    setVisiblePorts((prev) => ({
      ...prev,
      [nodeId]: {
        inputs: visibleInputs,
        outputs: visibleOutputs,
      },
    }));
  }, []);

  // Handle manual edge creation
  const handleConnect = useCallback((connection: any) => {
    // Create a new manual edge
    const newEdge: ReactFlowEdge = {
      id: `manual-${connection.source}-${connection.sourceHandle || 'default'}-${connection.target}-${connection.targetHandle || 'default'}`,
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: connection.target,
      targetHandle: connection.targetHandle,
      type: connection.source === connection.target ? 'smoothstep' : 'default',
      style: {
        stroke: connection.source === connection.target ? '#a855f7' : '#10b981', // Purple for internal, green for external
        strokeWidth: 2,
        strokeDasharray: connection.source === connection.target ? '5,5' : undefined,
      },
    };

    setManualEdges((prev) => [...prev, newEdge]);
    console.log('Manual edge created:', newEdge);
  }, []);

  // Handle edge deletion (when user presses delete/backspace on selected edge)
  const handleEdgesDelete = useCallback((edgesToDelete: ReactFlowEdge[]) => {
    edgesToDelete.forEach((edge) => {
      // Only allow deletion of manual edges
      if (edge.id.startsWith('manual-')) {
        setManualEdges((prev) => prev.filter((e) => e.id !== edge.id));
        console.log('Manual edge deleted:', edge.id);
      }
    });
  }, []);

  // Note: We don't recalculate layout on expand/collapse
  // Layout is only calculated once on initial load
  // Nodes expand/collapse in place to preserve positions

  // Add callbacks to dataproduct nodes
  const nodesWithCallback = nodes.map((node) => {
    if (node.type === 'dataproduct') {
      const expanded = expandedNodes[node.id];
      const inLineage = lineage.nodes.has(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          onToggleExpansion: () => handleToggleExpansion(node.id),
          onNodeClick: () => handleNodeClick(node.id),
          onPortSelect: handlePortSelect,
          onVisiblePortsChange: (visibleInputs: string[], visibleOutputs: string[]) =>
            handleVisiblePortsChange(node.id, visibleInputs, visibleOutputs),
          onViewColumnLineage: onViewColumnLineage,
          selected: selectedNode === node.id,
          selectedPortId: selectedNode, // Pass the globally selected port ID
          expanded,
          inLineage,
          lineagePorts: lineage.ports,
        },
      };
    }
    return node;
  });

  // Style edges based on lineage
  const styledEdges = edges.map((edge) => {
    const isInLineage = lineage.edges.has(edge.id);
    const hasLineage = lineage.edges.size > 0;
    const isInternalEdge = edge.id.startsWith('internal-');
    const isManualEdge = edge.id.startsWith('manual-');

    // Also check if edge is connected to a lineage node
    const sourceInLineage = lineage.nodes.has(edge.source);
    const targetInLineage = lineage.nodes.has(edge.target);
    const connectedToLineageNode = sourceInLineage || targetInLineage;

    // Determine edge color based on type and lineage
    let stroke = edge.style?.stroke || '#9ca3af';
    if (isInLineage) {
      stroke = '#3b82f6'; // Direct lineage color (blue)
    } else if (connectedToLineageNode && hasLineage) {
      stroke = '#6b7280'; // Connected to lineage node (gray)
    } else if (isInternalEdge) {
      stroke = '#f59e0b'; // Amber for internal edges
    } else if (isManualEdge) {
      // Keep manual edge's original color (already set in handleConnect)
      stroke = edge.style?.stroke || '#10b981';
    }

    return {
      ...edge,
      style: {
        ...edge.style,
        stroke,
        strokeWidth: isInLineage ? 3 : connectedToLineageNode && hasLineage ? 2 : edge.style?.strokeWidth || 1,
        opacity: !hasLineage ? 1 : isInLineage ? 1 : 0.2,
        strokeDasharray: (isInternalEdge || (isManualEdge && edge.source === edge.target)) && !isInLineage ? '5,5' : undefined,
      },
      animated: false, // No animation
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
        onConnect={handleConnect}
        onEdgesDelete={handleEdgesDelete}
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
        }}
      >
        <Controls>
          <ControlButton
            onClick={() => setShowBackground(!showBackground)}
            title={showBackground ? 'Hide Grid' : 'Show Grid'}
          >
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
