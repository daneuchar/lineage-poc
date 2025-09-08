import { useCallback, useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from mock API
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getFlowData();
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [setNodes, setEdges]);

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

  // Update nodes to pass the callbacks and filter based on expansion
  const nodesWithCallback = nodes
    .filter(node => {
      // Hide input/output group nodes when their corresponding dataproduct is not expanded
      if (node.type === 'group') {
        // group-1 corresponds to dataproduct-1, group-2 to dataproduct-2
        const dataproductId = node.id === 'group-1' ? 'dataproduct-1' : 'dataproduct-2';
        return expandedNodes[dataproductId];
      }
      if (node.type === 'inputGroup') {
        // For now, inputGroup shows when any dataproduct is expanded
        return Object.values(expandedNodes).some(expanded => expanded);
      }
      return true;
    })
    .map(node => {
      if (node.type === 'group') {
        const dataproductId = node.id === 'group-1' ? 'dataproduct-1' : 'dataproduct-2';
        const expanded = expandedNodes[dataproductId];
        return { ...node, data: { ...node.data, onChildSelect: handleChildSelect, expanded } };
      }
      if (node.type === 'inputGroup') {
        const expanded = Object.values(expandedNodes).some(exp => exp);
        return { ...node, data: { ...node.data, onInputSelect: handleInputSelect, expanded } };
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

  // Filter edges to only show when nodes are visible
  const visibleEdges = edges.filter(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    // Always show edges between dataproduct nodes (if any)
    if (sourceNode?.type === 'dataproduct' && targetNode?.type === 'dataproduct') {
      return true;
    }
    
    // For group nodes, check if their corresponding dataproduct is expanded
    if (targetNode?.type === 'group') {
      const dataproductId = targetNode.id === 'group-1' ? 'dataproduct-1' : 'dataproduct-2';
      return expandedNodes[dataproductId];
    }
    
    // For inputGroup, show edges when any dataproduct is expanded
    if (sourceNode?.type === 'inputGroup') {
      return Object.values(expandedNodes).some(expanded => expanded);
    }
    
    // Show all other edges (between visible nodes)
    return true;
  });

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
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default FlowCanvas;