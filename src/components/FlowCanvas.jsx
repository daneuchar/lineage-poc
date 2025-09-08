import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DataProductNode from './DataProductNode';
import GroupNode from './GroupNode';
import InputGroupNode from './InputGroupNode';
import { mockApi } from '../services/mockApi';

const nodeTypes = {
  dataproduct: DataProductNode,
  group: GroupNode,
  inputGroup: InputGroupNode,
};

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [_selectedInput, setSelectedInput] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [visibleHandles, setVisibleHandles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const originalEdgesRef = useRef([]);

  // Dynamic layout function
  const calculateDynamicLayout = useCallback((nodes, expandedNodes) => {
    const LAYER_SPACING = 300;
    const BASE_Y = 200;
    
    return nodes.map(node => {
      let newPosition = { ...node.position };
      
      // Layer 1: Input Group (always leftmost)
      if (node.type === 'inputGroup') {
        newPosition = { x: 50, y: BASE_Y };
      }
      
      // Layer 2: Data Product 1
      else if (node.type === 'dataproduct' && node.id === 'dataproduct-1') {
        newPosition = { 
          x: 50 + LAYER_SPACING, 
          y: BASE_Y 
        };
      }
      
      // Layer 3: Data Product 2 (to the right of DP1)
      else if (node.type === 'dataproduct' && node.id === 'dataproduct-2') {
        newPosition = { 
          x: 50 + (LAYER_SPACING * 2), 
          y: BASE_Y 
        };
      }
      
      // Layer 4: Output Group 1 (between DP1 and DP2)
      else if (node.type === 'group' && node.id === 'group-1') {
        const isExpanded = expandedNodes['dataproduct-1'] || expandedNodes['dataproduct-2'];
        if (isExpanded) {
          newPosition = { 
            x: 50 + LAYER_SPACING + 150, // Between DP1 and DP2
            y: BASE_Y - 120 
          };
        }
      }
      
      // Layer 5: Output Group 2 (right of DP2)
      else if (node.type === 'group' && node.id === 'group-2') {
        const isExpanded = expandedNodes['dataproduct-2'];
        if (isExpanded) {
          newPosition = { 
            x: 50 + (LAYER_SPACING * 3), 
            y: BASE_Y 
          };
        }
      }
      
      return { ...node, position: newPosition };
    });
  }, []);

  // Load data from mock API
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getFlowData();
        const layoutNodes = calculateDynamicLayout(data.nodes, {});
        setNodes(layoutNodes);
        originalEdgesRef.current = data.edges;
        setEdges(data.edges);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [setNodes, setEdges, calculateDynamicLayout]);

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
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);

  const handleVisibleHandlesChange = useCallback((nodeId, handles) => {
    setVisibleHandles(prev => ({
      ...prev,
      [nodeId]: handles
    }));
  }, []);

  // Update layout when expansion state changes
  useEffect(() => {
    setNodes(currentNodes => calculateDynamicLayout(currentNodes, expandedNodes));
  }, [expandedNodes, calculateDynamicLayout, setNodes]);

  // Filter and style edges based on node expansion and handle visibility
  const visibleEdges = originalEdgesRef.current
    .filter(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      // For inputGroup, show edges only when DP1 is expanded
      if (sourceNode?.type === 'inputGroup') {
        return expandedNodes['dataproduct-1'];
      }
      
      // For edges FROM group nodes TO dataproduct nodes
      if (sourceNode?.type === 'group' && targetNode?.type === 'dataproduct') {
        if (sourceNode.id === 'group-1' && targetNode.id === 'dataproduct-2') {
          return expandedNodes['dataproduct-1'] || expandedNodes['dataproduct-2'];
        }
        return false;
      }
      
      // For edges TO group nodes, check expansion
      if (targetNode?.type === 'group') {
        if (targetNode.id === 'group-1') {
          return expandedNodes['dataproduct-1'] || expandedNodes['dataproduct-2'];
        } else if (targetNode.id === 'group-2') {
          return expandedNodes['dataproduct-2'];
        }
      }
      
      // Always show edges between dataproduct nodes
      if (sourceNode?.type === 'dataproduct' && targetNode?.type === 'dataproduct') {
        return true;
      }
      
      return true;
    })
    .map(edge => {
      // Check if handles are visible for this edge
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      let isSourceHandleVisible = true;
      let isTargetHandleVisible = true;
      
      // Check source handle visibility
      if (sourceNode && visibleHandles[sourceNode.id]) {
        isSourceHandleVisible = visibleHandles[sourceNode.id].includes(edge.sourceHandle);
      }
      
      // Check target handle visibility  
      if (targetNode && visibleHandles[targetNode.id]) {
        isTargetHandleVisible = visibleHandles[targetNode.id].includes(edge.targetHandle);
      }
      
      // Hide edge if either handle is not visible
      const shouldShowEdge = isSourceHandleVisible && isTargetHandleVisible;
      
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: shouldShowEdge ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }
      };
    });

  // Update nodes to pass the callbacks and filter based on expansion
  const nodesWithCallback = nodes
    .filter(node => {
      // Hide input/output group nodes when their corresponding dataproduct is not expanded
      if (node.type === 'group') {
        if (node.id === 'group-1') {
          // group-1 shows when DP1 is expanded OR when DP2 is expanded (since DP2 needs DP1 outputs)
          return expandedNodes['dataproduct-1'] || expandedNodes['dataproduct-2'];
        } else if (node.id === 'group-2') {
          // group-2 only shows when DP2 is expanded
          return expandedNodes['dataproduct-2'];
        }
      }
      if (node.type === 'inputGroup') {
        // inputGroup only shows when DP1 is expanded (since it feeds into DP1)
        return expandedNodes['dataproduct-1'];
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
        const expanded = Object.values(expandedNodes).some(exp => exp);
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
        edges={visibleEdges}
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