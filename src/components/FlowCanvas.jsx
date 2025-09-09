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
      const newState = {
        ...prev,
        [nodeId]: !prev[nodeId]
      };
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