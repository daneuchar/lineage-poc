// Mock API service for nodes and edges data
export const mockApi = {
  // Simulate API delay
  delay: (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms)),

  useMockApi: true,
  setUseMockApi: (flag) => (this.useMockApi = flag),

  // Mock data for nodes and edges
  async getFlowData() {
    if (this.useMockApi) {
      await this.delay(800); // Simulate network delay
      return {
        nodes: [
          {
            id: "dataproduct-1",
            type: "dataproduct",
            data: {
              label: "Data Product 1",
              inputs: [
                { id: "dp1-input-1", label: "Raw Data" },
                { id: "dp1-input-2", label: "User Events" },
                { id: "dp1-input-3", label: "API Calls" },
                { id: "dp1-input-4", label: "File Uploads" },
                { id: "dp1-input-5", label: "Stream Data" },
                { id: "dp1-input-6", label: "Batch Jobs" },
                { id: "dp1-input-7", label: "Webhooks" },
                { id: "dp1-input-8", label: "IoT Sensors" },
              ],
              outputs: [
                { id: "dp1-output-1", label: "Web App" },
                { id: "dp1-output-2", label: "Mobile App" },
                { id: "dp1-output-3", label: "Desktop App" },
                { id: "dp1-output-4", label: "API Gateway" },
                { id: "dp1-output-5", label: "Database" },
                { id: "dp1-output-6", label: "Cache Layer" },
                { id: "dp1-output-7", label: "Message Queue" },
                { id: "dp1-output-8", label: "File Storage" },
              ],
            },
          },
          {
            id: "dataproduct-2",
            type: "dataproduct",
            data: {
              label: "Data Product 2",
              inputs: [
                { id: "dp2-input-1", label: "Web Data" },
                { id: "dp2-input-2", label: "Mobile Data" },
                { id: "dp2-input-3", label: "Desktop Data" },
                { id: "dp2-input-4", label: "API Data" },
                { id: "dp2-input-5", label: "Database Data" },
                { id: "dp2-input-6", label: "Cache Data" },
              ],
              outputs: [
                { id: "dp2-output-1", label: "Reports API" },
                { id: "dp2-output-2", label: "Dashboard" },
                { id: "dp2-output-3", label: "ETL Pipeline" },
                { id: "dp2-output-4", label: "Data Lake" },
                { id: "dp2-output-5", label: "ML Pipeline" },
                { id: "dp2-output-6", label: "Export Service" },
                { id: "dp2-output-7", label: "Streaming API" },
              ],
            },
          },
          {
            id: "dataproduct-3",
            type: "dataproduct",
            data: {
              label: "Data Product 3",
              inputs: [
                { id: "dp3-input-1", label: "Reports Data" },
                { id: "dp3-input-2", label: "Dashboard Data" },
                { id: "dp3-input-3", label: "API Data" },
                { id: "dp3-input-4", label: "ETL Data" },
                { id: "dp3-input-5", label: "Lake Data" },
                { id: "dp3-input-6", label: "ML Data" },
              ],
              outputs: [
                { id: "dp3-output-1", label: "Analytics" },
                { id: "dp3-output-2", label: "ML Model" },
                { id: "dp3-output-3", label: "Export" },
                { id: "dp3-output-4", label: "Insights API" },
                { id: "dp3-output-5", label: "Predictions" },
              ],
            },
          },
        ],
        edges: [
          // Direct edges between dataproducts (shown when collapsed)
          {
            id: "edge-dp1-to-dp2-direct",
            source: "dataproduct-1",
            target: "dataproduct-2",
            type: "default",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "edge-dp2-to-dp3-direct",
            source: "dataproduct-2",
            target: "dataproduct-3",
            type: "default",
            style: { stroke: "#10b981" },
          },
          {
            id: "edge-dp1-to-dp3-direct",
            source: "dataproduct-1",
            target: "dataproduct-3",
            type: "default",
            style: { stroke: "#8b5cf6" },
          },
          // DP1 to DP2 connections (output ports to input ports - shown when expanded)
          {
            id: "edge-dp1-out1-to-dp2-in1",
            source: "dataproduct-1",
            sourceHandle: "dp1-output-1",
            target: "dataproduct-2",
            targetHandle: "dp2-input-1",
            type: "default",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "edge-dp1-out2-to-dp2-in2",
            source: "dataproduct-1",
            sourceHandle: "dp1-output-2",
            target: "dataproduct-2",
            targetHandle: "dp2-input-2",
            type: "default",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "edge-dp1-out3-to-dp2-in3",
            source: "dataproduct-1",
            sourceHandle: "dp1-output-3",
            target: "dataproduct-2",
            targetHandle: "dp2-input-3",
            type: "default",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "edge-dp1-out5-to-dp2-in5",
            source: "dataproduct-1",
            sourceHandle: "dp1-output-5",
            target: "dataproduct-2",
            targetHandle: "dp2-input-5",
            type: "default",
            style: { stroke: "#3b82f6" },
          },
          // DP2 to DP3 connections
          {
            id: "edge-dp2-out1-to-dp3-in1",
            source: "dataproduct-2",
            sourceHandle: "dp2-output-1",
            target: "dataproduct-3",
            targetHandle: "dp3-input-1",
            type: "default",
            style: { stroke: "#10b981" },
          },
          {
            id: "edge-dp2-out2-to-dp3-in2",
            source: "dataproduct-2",
            sourceHandle: "dp2-output-2",
            target: "dataproduct-3",
            targetHandle: "dp3-input-2",
            type: "default",
            style: { stroke: "#10b981" },
          },
          {
            id: "edge-dp2-out3-to-dp3-in3",
            source: "dataproduct-2",
            sourceHandle: "dp2-output-3",
            target: "dataproduct-3",
            targetHandle: "dp3-input-3",
            type: "default",
            style: { stroke: "#10b981" },
          },
          // DP1 to DP3 direct connection
          {
            id: "edge-dp1-out4-to-dp3-in4",
            source: "dataproduct-1",
            sourceHandle: "dp1-output-4",
            target: "dataproduct-3",
            targetHandle: "dp3-input-4",
            type: "default",
            style: { stroke: "#8b5cf6" },
          },
          {
            id: "edge-dp1-out8-to-dp3-in6",
            source: "dataproduct-1",
            sourceHandle: "dp1-output-8",
            target: "dataproduct-3",
            targetHandle: "dp3-input-6",
            type: "default",
            style: { stroke: "#8b5cf6" },
          },
        ],
      };
    }

    const response = await fetch("*");
    return response.json();
  },

  // Mock different scenarios
  async getFlowDataVariant(variant = "default") {
    await this.delay(600);

    const variants = {
      microservices: {
        nodes: [
          {
            id: "parent-1",
            type: "parent",
            position: { x: 100, y: 200 },
            data: { label: "API Gateway" },
          },
          {
            id: "group-1",
            type: "group",
            position: { x: 400, y: 50 },
            data: {
              label: "Microservices",
              children: [
                { id: "child-1", label: "User Service" },
                { id: "child-2", label: "Order Service" },
                { id: "child-3", label: "Payment Service" },
                { id: "child-4", label: "Inventory Service" },
                { id: "child-5", label: "Notification Service" },
                { id: "child-6", label: "Analytics Service" },
                { id: "child-7", label: "Auth Service" },
                { id: "child-8", label: "Email Service" },
                { id: "child-9", label: "File Service" },
                { id: "child-10", label: "Log Service" },
              ],
            },
          },
        ],
        edges: Array.from({ length: 10 }, (_, i) => ({
          id: `edge-dataproduct-child-${i + 1}`,
          source: "dataproduct-1",
          target: "group-1",
          targetHandle: `child-${i + 1}`,
          style: { stroke: "#9ca3af", strokeWidth: 1 },
        })),
      },
      network: {
        nodes: [
          {
            id: "parent-1",
            type: "parent",
            position: { x: 100, y: 200 },
            data: { label: "Router" },
          },
          {
            id: "group-1",
            type: "group",
            position: { x: 400, y: 50 },
            data: {
              label: "Network Devices",
              children: [
                { id: "child-1", label: "Switch 1" },
                { id: "child-2", label: "Switch 2" },
                { id: "child-3", label: "Firewall" },
                { id: "child-4", label: "Load Balancer" },
                { id: "child-5", label: "VPN Gateway" },
                { id: "child-6", label: "DNS Server" },
                { id: "child-7", label: "DHCP Server" },
                { id: "child-8", label: "Print Server" },
                { id: "child-9", label: "File Server" },
                { id: "child-10", label: "Backup Server" },
              ],
            },
          },
        ],
        edges: Array.from({ length: 10 }, (_, i) => ({
          id: `edge-dataproduct-child-${i + 1}`,
          source: "dataproduct-1",
          target: "group-1",
          targetHandle: `child-${i + 1}`,
          style: { stroke: "#9ca3af", strokeWidth: 1 },
        })),
      },
    };

    return variants[variant] || variants.microservices;
  },
};
