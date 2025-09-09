import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DataProductNode from './DataProductNode';
import GroupNode from './GroupNode';
import InputGroupNode from './InputGroupNode';
import { mockApi } from '../services/mockApi';
import { getLayoutedNodes } from '../utils/layoutUtils';

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
        const nodesWithDefaultPositions = data.nodes.map(node => ({
          ...node,
          position: { x: 0, y: 0 }
        }));
        
        const layoutNodes = calculateDagreLayout(nodesWithDefaultPositions, data.edges, {});
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
    [setEdges],
  );

  const handleChildSelect = useCallback((childId) => {
    setSelectedChild(childId);
    
    // Update edges with highlighting
    setEdges((eds) => 
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: edge.targetHandle === childId ? '#3b82f6' : '#9ca3af',
          strokeWidth: edge.targetHandle === childId ? 2 : 1,
        }
      }))
    );
  }, [setEdges]);

  const handleInputSelect = useCallback((inputId) => {
    setSelectedInput(inputId);
    
    // Update edges with highlighting for input connections
    setEdges((eds) => 
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: edge.sourceHandle === inputId ? '#10b981' : (edge.targetHandle === selectedChild ? '#3b82f6' : '#9ca3af'),
          strokeWidth: edge.sourceHandle === inputId ? 2 : (edge.targetHandle === selectedChild ? 2 : 1),
        }
      }))
    );
  }, [setEdges, selectedChild]);

  const handleToggleExpansion = useCallback((nodeId) => {
    console.log('Toggling expansion for:', nodeId);
    setExpandedNodes(prev => {
      const newState = { ...prev };
      
      // Toggle the clicked node
      newState[nodeId] = !prev[nodeId];
      
      // Smart expansion logic: if expanding DP2, also expand DP1 only if there are connecting edges
      if (nodeId === 'dataproduct-2' && newState['dataproduct-2']) {
        // Check if DP2 has input connections from DP1 outputs
        const hasDP1ToDP2Connection = originalEdgesRef.current.some(edge => 
          edge.source === 'group-1' && edge.target === 'input-group-2'
        );
        
        if (hasDP1ToDP2Connection) {
          newState['dataproduct-1'] = true;
          console.log('Auto-expanding DP1 because DP2 needs DP1 outputs (edges exist)');
        } else {
          console.log('Not auto-expanding DP1 - no connecting edges found');
        }
      }
      
      // If collapsing DP1 while DP2 is expanded, also collapse DP2 only if there are connecting edges
      if (nodeId === 'dataproduct-1' && !newState['dataproduct-1'] && prev['dataproduct-2']) {
        // Check if DP2 depends on DP1 outputs
        const hasDP1ToDP2Connection = originalEdgesRef.current.some(edge => 
          edge.source === 'group-1' && edge.target === 'input-group-2'
        );
        
        if (hasDP1ToDP2Connection) {
          newState['dataproduct-2'] = false;
          console.log('Auto-collapsing DP2 because DP1 is collapsing (connected via edges)');
        } else {
          console.log('Not auto-collapsing DP2 - no dependency edges found');
        }
      }
      
      console.log('New expanded state:', newState);
      
      // Center on the node after expansion with a slight delay
      setTimeout(() => {
        const node = getNode(nodeId);
        if (node) {
          fitView({
            nodes: [node],
            duration: 800,
            padding: 0.3,
            minZoom: 0.8,
            maxZoom: 1.2
          });
        }
      }, 100);
      
      return newState;
    });
  }, [fitView, getNode]);

  const handleVisibleHandlesChange = useCallback((nodeId, handles) => {
    setVisibleHandles(prev => ({
      ...prev,
      [nodeId]: handles
    }));
  }, []);

  // Update layout when expansion state changes
  useEffect(() => {
    console.log('Layout effect triggered, expandedNodes:', expandedNodes);
    if (originalEdgesRef.current.length > 0) {
      setNodes(currentNodes => {
        console.log('Recalculating layout with nodes:', currentNodes.length);
        return calculateDagreLayout(currentNodes, originalEdgesRef.current, expandedNodes);
      });
      
    }
  }, [expandedNodes, calculateDagreLayout, setNodes]);


  // Helper function to check if edges exist between two nodes
  const hasConnectingEdges = (sourceNodeId, targetNodeId) => {
    return originalEdgesRef.current.some(edge => 
      edge.source === sourceNodeId && edge.target === targetNodeId
    );
  };

  // Filter nodes based on expansion state and edge connectivity
  const nodesWithCallback = nodes
    .filter(node => {
      // Hide input/output group nodes when their corresponding dataproduct is not expanded
      // AND only show them if there are connecting edges
      if (node.type === 'group') {
        if (node.id === 'group-1') {
          // group-1 shows when DP1 is expanded AND there are edges from DP1 to group-1
          return expandedNodes['dataproduct-1'] && hasConnectingEdges('dataproduct-1', 'group-1');
        } else if (node.id === 'group-2') {
          // group-2 shows when DP2 is expanded AND there are edges from DP2 to group-2
          return expandedNodes['dataproduct-2'] && hasConnectingEdges('dataproduct-2', 'group-2');
        }
      }
      if (node.type === 'inputGroup') {
        if (node.id === 'input-group-1') {
          // input-group-1 shows when DP1 is expanded AND there are edges from input-group-1 to DP1
          return expandedNodes['dataproduct-1'] && hasConnectingEdges('input-group-1', 'dataproduct-1');
        } else if (node.id === 'input-group-2') {
          // input-group-2 shows when DP2 is expanded AND there are edges connecting DP1 outputs to DP2 inputs
          // Check if there are edges from group-1 to input-group-2 AND from input-group-2 to dataproduct-2
          const hasInputConnection = hasConnectingEdges('group-1', 'input-group-2') && 
                                   hasConnectingEdges('input-group-2', 'dataproduct-2');
          return expandedNodes['dataproduct-2'] && hasInputConnection;
        }
        return expandedNodes['dataproduct-1']; // fallback
      }
      return true;
    })
    .map(node => {
      if (node.type === 'group') {
        const dataproductId = node.id === 'group-1' ? 'dataproduct-1' : 'dataproduct-2';
        const expanded = expandedNodes[dataproductId];
        return { 
          ...node, 
          data: { 
            ...node.data, 
            onChildSelect: handleChildSelect,
            onVisibleHandlesChange: (handles) => handleVisibleHandlesChange(node.id, handles),
            expanded
          } 
        };
      }
      if (node.type === 'inputGroup') {
        let expanded;
        if (node.id === 'input-group-1') {
          expanded = expandedNodes['dataproduct-1'];
        } else if (node.id === 'input-group-2') {
          expanded = expandedNodes['dataproduct-2'];
        } else {
          expanded = Object.values(expandedNodes).some(exp => exp);
        }
        return { 
          ...node, 
          data: { 
            ...node.data, 
            onInputSelect: handleInputSelect,
            onVisibleHandlesChange: (handles) => handleVisibleHandlesChange(node.id, handles),
            expanded
          } 
        };
      }
      if (node.type === 'dataproduct') {
        const expanded = expandedNodes[node.id];
        return { ...node, data: { ...node.data, onToggleExpansion: () => handleToggleExpansion(node.id), expanded } };
      }
      return node;
    });

  // Filter edges to only show when nodes are expanded and handles exist
  const filteredEdges = originalEdgesRef.current.filter(edge => {
    const sourceNode = nodesWithCallback.find(n => n.id === edge.source);
    const targetNode = nodesWithCallback.find(n => n.id === edge.target);
    
    // Only include edges if both nodes exist in the filtered node list
    if (!sourceNode || !targetNode) {
      return false;
    }
    
    // For inputGroup edges, show based on which input group it is
    if (sourceNode.type === 'inputGroup') {
      if (sourceNode.id === 'input-group-1') {
        return expandedNodes['dataproduct-1'];
      } else if (sourceNode.id === 'input-group-2') {
        return expandedNodes['dataproduct-2'];
      }
      return expandedNodes['dataproduct-1']; // fallback
    }
    
    // For edges TO inputGroup nodes
    if (targetNode.type === 'inputGroup') {
      if (targetNode.id === 'input-group-1') {
        return expandedNodes['dataproduct-1'];
      } else if (targetNode.id === 'input-group-2') {
        return expandedNodes['dataproduct-2'];
      }
      return expandedNodes['dataproduct-1']; // fallback
    }
    
    // For edges FROM dataproduct TO group nodes
    if (sourceNode.type === 'dataproduct' && targetNode.type === 'group') {
      if (sourceNode.id === 'dataproduct-1' && targetNode.id === 'group-1') {
        return expandedNodes['dataproduct-1'];
      }
      if (sourceNode.id === 'dataproduct-2' && targetNode.id === 'group-2') {
        return expandedNodes['dataproduct-2'];
      }
      return false;
    }
    
    // For edges FROM group nodes TO inputGroup nodes (DP1 outputs → DP2 inputs)
    if (sourceNode.type === 'group' && targetNode.type === 'inputGroup') {
      if (sourceNode.id === 'group-1' && targetNode.id === 'input-group-2') {
        // Show edges when both DP1 and DP2 are expanded
        return expandedNodes['dataproduct-1'] && expandedNodes['dataproduct-2'];
      }
      return false;
    }
    
    // For edges FROM group nodes TO dataproduct nodes (DP1 → DP2)
    if (sourceNode.type === 'group' && targetNode.type === 'dataproduct') {
      if (sourceNode.id === 'group-1' && targetNode.id === 'dataproduct-2') {
        return expandedNodes['dataproduct-1'];
      }
      return false;
    }
    
    return false;
  });

  if (loading) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            marginBottom: '8px' 
          }}>Loading flow data...</div>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            Error loading flow data
          </div>
          <div style={{ fontSize: '12px' }}>{error}</div>
        </div>
      </div>
    );
  }


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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
          duration: 800
        }}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 }
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