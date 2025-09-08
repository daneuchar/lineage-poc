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
          position: { x: 50, y: 50 },
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
          position: { x: 350, y: 200 },
          data: { label: 'Data Product' },
        },
        {
          id: 'group-1',
          type: 'group',
          position: { x: 650, y: 50 },
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
        // Output edges (from dataproduct to output ports)
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