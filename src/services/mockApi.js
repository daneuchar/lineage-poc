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
              label: "WMA Account",
              inputs: [
                { id: "dp1-input-1", label: "Raw Data", relatedPorts: ["dp1-output-1", "dp1-output-5"] },
                { id: "dp1-input-2", label: "User Events", relatedPorts: ["dp1-output-1", "dp1-output-2"] },
                { id: "dp1-input-3", label: "API Calls", relatedPorts: ["dp1-output-2", "dp1-output-4"] },
                { id: "dp1-input-4", label: "File Uploads", relatedPorts: ["dp1-output-3", "dp1-output-8"] },
                { id: "dp1-input-5", label: "Stream Data", relatedPorts: ["dp1-output-5", "dp1-output-7"] },
                { id: "dp1-input-6", label: "Batch Jobs", relatedPorts: ["dp1-output-6", "dp1-output-7"] },
                { id: "dp1-input-7", label: "Webhooks", relatedPorts: ["dp1-output-4", "dp1-output-7"] },
                { id: "dp1-input-8", label: "IoT Sensors", relatedPorts: ["dp1-output-5", "dp1-output-8"] },
              ],
              outputs: [
                { id: "dp1-output-1", label: "Web App", relatedPorts: ["dp1-input-1", "dp1-input-2"] },
                { id: "dp1-output-2", label: "Mobile App", relatedPorts: ["dp1-input-2", "dp1-input-3"] },
                { id: "dp1-output-3", label: "Desktop App", relatedPorts: ["dp1-input-4"] },
                { id: "dp1-output-4", label: "API Gateway", relatedPorts: ["dp1-input-3", "dp1-input-7"] },
                { id: "dp1-output-5", label: "Database", relatedPorts: ["dp1-input-1", "dp1-input-5", "dp1-input-8"] },
                { id: "dp1-output-6", label: "Cache Layer", relatedPorts: ["dp1-input-6"] },
                { id: "dp1-output-7", label: "Message Queue", relatedPorts: ["dp1-input-5", "dp1-input-6", "dp1-input-7"] },
                { id: "dp1-output-8", label: "File Storage", relatedPorts: ["dp1-input-4", "dp1-input-8"] },
              ],
            },
          },
          {
            id: "dataproduct-2",
            type: "dataproduct",
            data: {
              label: "WMA Analytics",
              inputs: [
                { id: "dp2-input-1", label: "Web Data", relatedPorts: ["dp2-output-1", "dp2-output-2"] },
                { id: "dp2-input-2", label: "Mobile Data", relatedPorts: ["dp2-output-1", "dp2-output-2"] },
                { id: "dp2-input-3", label: "Desktop Data", relatedPorts: [ "dp2-output-3"] },
                { id: "dp2-input-4", label: "API Data", relatedPorts: ["dp2-output-3", "dp2-output-4"] },
                { id: "dp2-input-5", label: "Database Data", relatedPorts: ["dp2-output-4", "dp2-output-5"] },
                { id: "dp2-input-6", label: "Cache Data", relatedPorts: ["dp2-output-1", "dp2-output-5", "dp2-output-6"] },
              ],
              outputs: [
                { id: "dp2-output-1", label: "Reports API", relatedPorts: ["dp2-input-1", "dp2-input-2", "dp2-input-6"] },
                { id: "dp2-output-2", label: "Dashboard", relatedPorts: ["dp2-input-1", "dp2-input-2"] },
                { id: "dp2-output-3", label: "ETL Pipeline", relatedPorts: ["dp2-input-3", "dp2-input-4"] },
                { id: "dp2-output-4", label: "Data Lake", relatedPorts: ["dp2-input-4", "dp2-input-5"] },
                { id: "dp2-output-5", label: "ML Pipeline", relatedPorts: ["dp2-input-5", "dp2-input-6"] },
                { id: "dp2-output-6", label: "Export Service", relatedPorts: ["dp2-input-6"] },
                { id: "dp2-output-7", label: "Streaming API", relatedPorts: ["dp2-input-1", "dp2-input-4"] },
              ],
            },
          },
          {
            id: "dataproduct-3",
            type: "dataproduct",
            data: {
              label: "WMA Insights",
              inputs: [
                { id: "dp3-input-1", label: "Reports Data", relatedPorts: ["dp3-output-1", "dp3-output-4"] },
                { id: "dp3-input-2", label: "Dashboard Data", relatedPorts: ["dp3-output-1", "dp3-output-4"] },
                { id: "dp3-input-3", label: "API Data", relatedPorts: ["dp3-output-4"] },
                { id: "dp3-input-4", label: "ETL Data", relatedPorts: ["dp3-output-1", "dp3-output-3"] },
                { id: "dp3-input-5", label: "Lake Data", relatedPorts: ["dp3-output-2", "dp3-output-5"] },
                { id: "dp3-input-6", label: "ML Data", relatedPorts: ["dp3-output-2", "dp3-output-5"] },
              ],
              outputs: [
                { id: "dp3-output-1", label: "Analytics", relatedPorts: ["dp3-input-1", "dp3-input-2", "dp3-input-4"] },
                { id: "dp3-output-2", label: "ML Model", relatedPorts: ["dp3-input-5", "dp3-input-6"] },
                { id: "dp3-output-3", label: "Export", relatedPorts: ["dp3-input-4"] },
                { id: "dp3-output-4", label: "Insights API", relatedPorts: ["dp3-input-1", "dp3-input-2", "dp3-input-3"] },
                { id: "dp3-output-5", label: "Predictions", relatedPorts: ["dp3-input-5", "dp3-input-6"] },
              ],
            },
          },
        ],
        relationships: [
          // Direct node-to-node relationships (shown when collapsed)
          {
            id: "rel-dp1-to-dp2",
            sourceNode: "dataproduct-1",
            targetNode: "dataproduct-2",
            type: "direct",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "rel-dp2-to-dp3",
            sourceNode: "dataproduct-2",
            targetNode: "dataproduct-3",
            type: "direct",
            style: { stroke: "#10b981" },
          },
          {
            id: "rel-dp1-to-dp3",
            sourceNode: "dataproduct-1",
            targetNode: "dataproduct-3",
            type: "direct",
            style: { stroke: "#8b5cf6" },
          },
          // Port-to-port relationships (shown when expanded)
          // DP1 to DP2 connections
          {
            id: "rel-dp1-out1-to-dp2-in1",
            sourceNode: "dataproduct-1",
            sourcePort: "dp1-output-1",
            targetNode: "dataproduct-2",
            targetPort: "dp2-input-1",
            type: "port",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "rel-dp1-out2-to-dp2-in2",
            sourceNode: "dataproduct-1",
            sourcePort: "dp1-output-2",
            targetNode: "dataproduct-2",
            targetPort: "dp2-input-2",
            type: "port",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "rel-dp1-out3-to-dp2-in3",
            sourceNode: "dataproduct-1",
            sourcePort: "dp1-output-3",
            targetNode: "dataproduct-2",
            targetPort: "dp2-input-3",
            type: "port",
            style: { stroke: "#3b82f6" },
          },
          {
            id: "rel-dp1-out5-to-dp2-in5",
            sourceNode: "dataproduct-1",
            sourcePort: "dp1-output-5",
            targetNode: "dataproduct-2",
            targetPort: "dp2-input-5",
            type: "port",
            style: { stroke: "#3b82f6" },
          },
          // DP2 to DP3 connections
          {
            id: "rel-dp2-out1-to-dp3-in1",
            sourceNode: "dataproduct-2",
            sourcePort: "dp2-output-1",
            targetNode: "dataproduct-3",
            targetPort: "dp3-input-1",
            type: "port",
            style: { stroke: "#10b981" },
          },
          {
            id: "rel-dp2-out2-to-dp3-in2",
            sourceNode: "dataproduct-2",
            sourcePort: "dp2-output-2",
            targetNode: "dataproduct-3",
            targetPort: "dp3-input-2",
            type: "port",
            style: { stroke: "#10b981" },
          },
          {
            id: "rel-dp2-out3-to-dp3-in3",
            sourceNode: "dataproduct-2",
            sourcePort: "dp2-output-3",
            targetNode: "dataproduct-3",
            targetPort: "dp3-input-3",
            type: "port",
            style: { stroke: "#10b981" },
          },
          // DP1 to DP3 direct connection
          {
            id: "rel-dp1-out4-to-dp3-in4",
            sourceNode: "dataproduct-1",
            sourcePort: "dp1-output-4",
            targetNode: "dataproduct-3",
            targetPort: "dp3-input-4",
            type: "port",
            style: { stroke: "#8b5cf6" },
          },
          {
            id: "rel-dp1-out8-to-dp3-in6",
            sourceNode: "dataproduct-1",
            sourcePort: "dp1-output-8",
            targetNode: "dataproduct-3",
            targetPort: "dp3-input-6",
            type: "port",
            style: { stroke: "#8b5cf6" },
          },
        ],
      };
    }

    const response = await fetch("*");
    return response.json();
  },


};
