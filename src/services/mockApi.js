// Mock API service for nodes and edges data
export const mockApi = {
  // Simulate API delay
  delay: (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock data for nodes and edges
  async getFlowData() {
    await this.delay(800); // Simulate network delay
    
    return {
      nodes: [
        {
          id: 'input-group-1',
          type: 'inputGroup',
          data: { 
            label: 'Input Sources',
            inputs: [
              { id: 'input-1', label: 'Raw Data' },
              { id: 'input-2', label: 'User Events' },
              { id: 'input-3', label: 'API Calls' },
              { id: 'input-4', label: 'File Uploads' },
              { id: 'input-5', label: 'Stream Data' },
              { id: 'input-6', label: 'Batch Jobs' },
              { id: 'input-7', label: 'Webhooks' },
              { id: 'input-8', label: 'IoT Sensors' },
            ]
          },
        },
        {
          id: 'dataproduct-1',
          type: 'dataproduct',
          data: { label: 'Data Product 1' },
        },
        {
          id: 'dataproduct-2',
          type: 'dataproduct',
          data: { label: 'Data Product 2' },
        },
        {
          id: 'group-1',
          type: 'group',
          data: { 
            label: 'Output Ports',
            children: [
              { id: 'child-1', label: 'Web App' },
              { id: 'child-2', label: 'Mobile App' },
              { id: 'child-3', label: 'Desktop App' },
              { id: 'child-4', label: 'API Gateway' },
              { id: 'child-5', label: 'Database' },
              { id: 'child-6', label: 'Cache' },
              { id: 'child-7', label: 'Queue' },
              { id: 'child-8', label: 'Analytics' },
              { id: 'child-9', label: 'Logger' },
              { id: 'child-10', label: 'Monitor' },
            ]
          },
        },
        {
          id: 'input-group-2',
          type: 'inputGroup',
          data: { 
            label: 'Input Ports 2',
            inputs: [
              { id: 'input-2-1', label: 'Web Data (from DP1)' },
              { id: 'input-2-2', label: 'Mobile Data (from DP1)' },
              { id: 'input-2-3', label: 'Desktop Data (from DP1)' },
              { id: 'input-2-4', label: 'API Data (from DP1)' },
            ]
          },
        },
        {
          id: 'group-2',
          type: 'group',
          data: { 
            label: 'Output Ports 2',
            children: [
              { id: 'child-2-1', label: 'Reports API' },
              { id: 'child-2-2', label: 'Dashboard' },
              { id: 'child-2-3', label: 'ETL Pipeline' },
              { id: 'child-2-4', label: 'Data Lake' },
              { id: 'child-2-5', label: 'ML Model' },
              { id: 'child-2-6', label: 'Streaming' },
              { id: 'child-2-7', label: 'Warehouse' },
              { id: 'child-2-8', label: 'Export' },
            ]
          },
        },
      ],
      edges: [
        // Input edges (from input ports to dataproduct)
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `edge-input-dataproduct-${i + 1}`,
          source: 'input-group-1',
          sourceHandle: `input-${i + 1}`,
          target: 'dataproduct-1',
          style: { stroke: '#9ca3af', strokeWidth: 1 },
          data: {
            connectionType: 'input',
            dataType: ['raw', 'events', 'api', 'file', 'stream', 'batch', 'webhook', 'iot'][i],
          }
        })),
        // Output edges (from dataproduct-1 to output ports)
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `edge-dataproduct-child-${i + 1}`,
          source: 'dataproduct-1',
          target: 'group-1',
          targetHandle: `child-${i + 1}`,
          style: { stroke: '#9ca3af', strokeWidth: 1 },
          data: {
            connectionType: 'output',
            bandwidth: Math.floor(Math.random() * 100) + 50,
          }
        })),
        // Input edges (from DP1 output ports to DP2 input ports)
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `edge-dp1-output-to-dp2-input-${i + 1}`,
          source: 'group-1',
          sourceHandle: `child-${i + 1}`, // Use first 4 outputs from DP1
          target: 'input-group-2',
          targetHandle: `input-2-${i + 1}`,
          style: { stroke: '#9ca3af', strokeWidth: 1 },
          data: {
            connectionType: 'dp1-to-dp2-input',
            dataType: ['web-data', 'mobile-data', 'desktop-data', 'api-data'][i],
          }
        })),
        // Input edges (from DP2 input ports to dataproduct-2)
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `edge-dp2-input-to-dp2-${i + 1}`,
          source: 'input-group-2',
          sourceHandle: `input-2-${i + 1}`,
          target: 'dataproduct-2',
          style: { stroke: '#9ca3af', strokeWidth: 1 },
          data: {
            connectionType: 'input-to-dp2',
            dataType: ['web-data', 'mobile-data', 'desktop-data', 'api-data'][i],
          }
        })),
        // Direct edge from dataproduct-1 to dataproduct-2
        {
          id: 'edge-dp1-to-dp2-direct',
          source: 'dataproduct-1',
          target: 'dataproduct-2',
          style: { stroke: '#9ca3af', strokeWidth: 1 },
          data: {
            connectionType: 'direct-dp-connection',
            dataType: 'aggregated-data',
          }
        },
        // Output edges (from dataproduct-2 to output ports 2)
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `edge-dataproduct2-child-${i + 1}`,
          source: 'dataproduct-2',
          target: 'group-2',
          targetHandle: `child-2-${i + 1}`,
          style: { stroke: '#9ca3af', strokeWidth: 1 },
          data: {
            connectionType: 'output',
            bandwidth: Math.floor(Math.random() * 100) + 50,
          }
        }))
      ]
    };
  },

  // Mock different scenarios
  async getFlowDataVariant(variant = 'default') {
    await this.delay(600);
    
    const variants = {
      microservices: {
        nodes: [
          {
            id: 'parent-1',
            type: 'parent',
            position: { x: 100, y: 200 },
            data: { label: 'API Gateway' },
          },
          {
            id: 'group-1',
            type: 'group',
            position: { x: 400, y: 50 },
            data: { 
              label: 'Microservices',
              children: [
                { id: 'child-1', label: 'User Service' },
                { id: 'child-2', label: 'Order Service' },
                { id: 'child-3', label: 'Payment Service' },
                { id: 'child-4', label: 'Inventory Service' },
                { id: 'child-5', label: 'Notification Service' },
                { id: 'child-6', label: 'Analytics Service' },
                { id: 'child-7', label: 'Auth Service' },
                { id: 'child-8', label: 'Email Service' },
                { id: 'child-9', label: 'File Service' },
                { id: 'child-10', label: 'Log Service' },
              ]
            },
          },
        ],
        edges: Array.from({ length: 10 }, (_, i) => ({
          id: `edge-dataproduct-child-${i + 1}`,
          source: 'dataproduct-1',
          target: 'group-1',
          targetHandle: `child-${i + 1}`,
          style: { stroke: '#9ca3af', strokeWidth: 1 },
        }))
      },
      network: {
        nodes: [
          {
            id: 'parent-1',
            type: 'parent',
            position: { x: 100, y: 200 },
            data: { label: 'Router' },
          },
          {
            id: 'group-1',
            type: 'group',
            position: { x: 400, y: 50 },
            data: { 
              label: 'Network Devices',
              children: [
                { id: 'child-1', label: 'Switch 1' },
                { id: 'child-2', label: 'Switch 2' },
                { id: 'child-3', label: 'Firewall' },
                { id: 'child-4', label: 'Load Balancer' },
                { id: 'child-5', label: 'VPN Gateway' },
                { id: 'child-6', label: 'DNS Server' },
                { id: 'child-7', label: 'DHCP Server' },
                { id: 'child-8', label: 'Print Server' },
                { id: 'child-9', label: 'File Server' },
                { id: 'child-10', label: 'Backup Server' },
              ]
            },
          },
        ],
        edges: Array.from({ length: 10 }, (_, i) => ({
          id: `edge-dataproduct-child-${i + 1}`,
          source: 'dataproduct-1',
          target: 'group-1',
          targetHandle: `child-${i + 1}`,
          style: { stroke: '#9ca3af', strokeWidth: 1 },
        }))
      }
    };

    return variants[variant] || variants.microservices;
  }
};