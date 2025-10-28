/**
 * Mock API service for nodes and edges data
 */

import type {
  MockApi,
  FlowData,
  ColumnLineageData,
  ColumnPort,
  ColumnRelationship,
} from '../types';

const delay = (ms: number = 1000): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let useMockApi = true;

const setUseMockApi = (flag: boolean): void => {
  useMockApi = flag;
};

/**
 * Get flow data containing nodes and relationships
 */
async function getFlowData(): Promise<FlowData> {
  if (useMockApi) {
    await delay(800); // Simulate network delay
    return {
      nodes: [
        {
          id: 'dataproduct-1',
          type: 'dataproduct',
          position: { x: 0, y: 0 },
          data: {
            label: 'WMA Account',
            inputs: [
              { id: 'dp1-input-1', label: 'Raw Data', relatedPorts: ['dp1-output-1', 'dp1-output-5'] },
              { id: 'dp1-input-2', label: 'User Events', relatedPorts: ['dp1-output-1', 'dp1-output-2'] },
              { id: 'dp1-input-3', label: 'API Calls', relatedPorts: ['dp1-output-2', 'dp1-output-4'] },
              { id: 'dp1-input-4', label: 'File Uploads', relatedPorts: ['dp1-output-3', 'dp1-output-8'] },
              { id: 'dp1-input-5', label: 'Stream Data', relatedPorts: ['dp1-output-5', 'dp1-output-7'] },
              { id: 'dp1-input-6', label: 'Batch Jobs', relatedPorts: ['dp1-output-6', 'dp1-output-7'] },
              { id: 'dp1-input-7', label: 'Webhooks', relatedPorts: ['dp1-output-4', 'dp1-output-7'] },
              { id: 'dp1-input-8', label: 'IoT Sensors', relatedPorts: ['dp1-output-5', 'dp1-output-8'] },
            ],
            outputs: [
              { id: 'dp1-output-1', label: 'Web App', relatedPorts: ['dp1-input-1', 'dp1-input-2'] },
              { id: 'dp1-output-2', label: 'Mobile App', relatedPorts: ['dp1-input-2', 'dp1-input-3'] },
              { id: 'dp1-output-3', label: 'Desktop App', relatedPorts: ['dp1-input-4'] },
              { id: 'dp1-output-4', label: 'API Gateway', relatedPorts: ['dp1-input-3', 'dp1-input-7'] },
              { id: 'dp1-output-5', label: 'Database', relatedPorts: ['dp1-input-1', 'dp1-input-5', 'dp1-input-8'] },
              { id: 'dp1-output-6', label: 'Cache Layer', relatedPorts: ['dp1-input-6'] },
              { id: 'dp1-output-7', label: 'Message Queue', relatedPorts: ['dp1-input-5', 'dp1-input-6', 'dp1-input-7'] },
              { id: 'dp1-output-8', label: 'File Storage', relatedPorts: ['dp1-input-4', 'dp1-input-8'] },
            ],
          },
        },
        {
          id: 'dataproduct-2',
          type: 'dataproduct',
          position: { x: 0, y: 0 },
          data: {
            label: 'WMA Analytics',
            inputs: [
              { id: 'dp2-input-1', label: 'Web Data', relatedPorts: ['dp2-output-1', 'dp2-output-2'] },
              { id: 'dp2-input-2', label: 'Mobile Data', relatedPorts: ['dp2-output-1', 'dp2-output-2'] },
              { id: 'dp2-input-3', label: 'Desktop Data', relatedPorts: ['dp2-output-3'] },
              { id: 'dp2-input-4', label: 'API Data', relatedPorts: ['dp2-output-3', 'dp2-output-4'] },
              { id: 'dp2-input-5', label: 'Database Data', relatedPorts: ['dp2-output-4', 'dp2-output-5'] },
              { id: 'dp2-input-6', label: 'Cache Data', relatedPorts: ['dp2-output-1', 'dp2-output-5', 'dp2-output-6'] },
            ],
            outputs: [
              { id: 'dp2-output-1', label: 'Reports API', relatedPorts: ['dp2-input-1', 'dp2-input-2', 'dp2-input-6'] },
              { id: 'dp2-output-2', label: 'Dashboard', relatedPorts: ['dp2-input-1', 'dp2-input-2'] },
              { id: 'dp2-output-3', label: 'ETL Pipeline', relatedPorts: ['dp2-input-3', 'dp2-input-4'] },
              { id: 'dp2-output-4', label: 'Data Lake', relatedPorts: ['dp2-input-4', 'dp2-input-5'] },
              { id: 'dp2-output-5', label: 'ML Pipeline', relatedPorts: ['dp2-input-5', 'dp2-input-6'] },
              { id: 'dp2-output-6', label: 'Export Service', relatedPorts: ['dp2-input-6'] },
              { id: 'dp2-output-7', label: 'Streaming API', relatedPorts: ['dp2-input-1', 'dp2-input-4'] },
            ],
          },
        },
        {
          id: 'dataproduct-3',
          type: 'dataproduct',
          position: { x: 0, y: 0 },
          data: {
            label: 'WMA Insights',
            inputs: [
              { id: 'dp3-input-1', label: 'Reports Data', relatedPorts: ['dp3-output-1', 'dp3-output-4'] },
              { id: 'dp3-input-2', label: 'Dashboard Data', relatedPorts: ['dp3-output-1', 'dp3-output-4'] },
              { id: 'dp3-input-3', label: 'API Data', relatedPorts: ['dp3-output-4'] },
              { id: 'dp3-input-4', label: 'ETL Data', relatedPorts: ['dp3-output-1', 'dp3-output-3'] },
              { id: 'dp3-input-5', label: 'Lake Data', relatedPorts: ['dp3-output-2', 'dp3-output-5'] },
              { id: 'dp3-input-6', label: 'ML Data', relatedPorts: ['dp3-output-2', 'dp3-output-5'] },
            ],
            outputs: [
              { id: 'dp3-output-1', label: 'Analytics', relatedPorts: ['dp3-input-1', 'dp3-input-2', 'dp3-input-4'] },
              { id: 'dp3-output-2', label: 'ML Model', relatedPorts: ['dp3-input-5', 'dp3-input-6'] },
              { id: 'dp3-output-3', label: 'Export', relatedPorts: ['dp3-input-4'] },
              { id: 'dp3-output-4', label: 'Insights API', relatedPorts: ['dp3-input-1', 'dp3-input-2', 'dp3-input-3'] },
              { id: 'dp3-output-5', label: 'Predictions', relatedPorts: ['dp3-input-5', 'dp3-input-6'] },
            ],
          },
        },
      ],
      relationships: [
        // Direct node-to-node relationships (shown when collapsed)
        {
          id: 'rel-dp1-to-dp2',
          sourceNode: 'dataproduct-1',
          targetNode: 'dataproduct-2',
          type: 'direct' as const,
        },
        {
          id: 'rel-dp2-to-dp3',
          sourceNode: 'dataproduct-2',
          targetNode: 'dataproduct-3',
          type: 'direct' as const,
        },
        {
          id: 'rel-dp1-to-dp3',
          sourceNode: 'dataproduct-1',
          targetNode: 'dataproduct-3',
          type: 'direct' as const,
        },
        // Port-to-port relationships (shown when expanded)
        // DP1 to DP2 connections
        {
          id: 'rel-dp1-out1-to-dp2-in1',
          sourceNode: 'dataproduct-1',
          sourcePort: 'dp1-output-1',
          targetNode: 'dataproduct-2',
          targetPort: 'dp2-input-1',
          type: 'port' as const,
        },
        {
          id: 'rel-dp1-out2-to-dp2-in2',
          sourceNode: 'dataproduct-1',
          sourcePort: 'dp1-output-2',
          targetNode: 'dataproduct-2',
          targetPort: 'dp2-input-2',
          type: 'port' as const,
        },
        {
          id: 'rel-dp1-out3-to-dp2-in3',
          sourceNode: 'dataproduct-1',
          sourcePort: 'dp1-output-3',
          targetNode: 'dataproduct-2',
          targetPort: 'dp2-input-3',
          type: 'port' as const,
        },
        {
          id: 'rel-dp1-out5-to-dp2-in5',
          sourceNode: 'dataproduct-1',
          sourcePort: 'dp1-output-5',
          targetNode: 'dataproduct-2',
          targetPort: 'dp2-input-5',
          type: 'port' as const,
        },
        // DP2 to DP3 connections
        {
          id: 'rel-dp2-out1-to-dp3-in1',
          sourceNode: 'dataproduct-2',
          sourcePort: 'dp2-output-1',
          targetNode: 'dataproduct-3',
          targetPort: 'dp3-input-1',
          type: 'port' as const,
        },
        {
          id: 'rel-dp2-out2-to-dp3-in2',
          sourceNode: 'dataproduct-2',
          sourcePort: 'dp2-output-2',
          targetNode: 'dataproduct-3',
          targetPort: 'dp3-input-2',
          type: 'port' as const,
        },
        {
          id: 'rel-dp2-out3-to-dp3-in3',
          sourceNode: 'dataproduct-2',
          sourcePort: 'dp2-output-3',
          targetNode: 'dataproduct-3',
          targetPort: 'dp3-input-3',
          type: 'port' as const,
        },
        // DP1 to DP3 direct connection
        {
          id: 'rel-dp1-out4-to-dp3-in4',
          sourceNode: 'dataproduct-1',
          sourcePort: 'dp1-output-4',
          targetNode: 'dataproduct-3',
          targetPort: 'dp3-input-4',
          type: 'port' as const,
        },
        {
          id: 'rel-dp1-out8-to-dp3-in6',
          sourceNode: 'dataproduct-1',
          sourcePort: 'dp1-output-8',
          targetNode: 'dataproduct-3',
          targetPort: 'dp3-input-6',
          type: 'port' as const,
        },
      ],
    };
  }

  const response = await fetch('*');
  return response.json();
}

/**
 * Get column lineage for a specific port
 */
async function getColumnLineage(portId: string): Promise<ColumnLineageData> {
  if (useMockApi) {
    await delay(600); // Simulate network delay

    // Column data mapping for all ports
    const columnData: Record<string, ColumnPort> = {
      // DP1 Output ports
      'dp1-output-1': {
        portId: 'dp1-output-1',
        portLabel: 'Web App',
        nodeId: 'dataproduct-1',
        nodeLabel: 'WMA Account',
        columns: [
          { id: 'dp1-out1-col-1', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: true, description: 'Unique customer identifier' },
          { id: 'dp1-out1-col-2', name: 'session_id', dataType: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, description: 'User session identifier' },
          { id: 'dp1-out1-col-3', name: 'page_url', dataType: 'TEXT', nullable: true, isPrimaryKey: false, description: 'Current page URL' },
          { id: 'dp1-out1-col-4', name: 'timestamp', dataType: 'TIMESTAMP', nullable: false, isPrimaryKey: false, description: 'Event timestamp' },
          { id: 'dp1-out1-col-5', name: 'user_agent', dataType: 'TEXT', nullable: true, isPrimaryKey: false, description: 'Browser user agent' },
          { id: 'dp1-out1-col-6', name: 'ip_address', dataType: 'VARCHAR(45)', nullable: true, isPrimaryKey: false, description: 'Client IP address' },
        ],
      },
      'dp1-output-5': {
        portId: 'dp1-output-5',
        portLabel: 'Database',
        nodeId: 'dataproduct-1',
        nodeLabel: 'WMA Account',
        columns: [
          { id: 'dp1-out5-col-1', name: 'record_id', dataType: 'BIGINT', nullable: false, isPrimaryKey: true, description: 'Database record ID' },
          { id: 'dp1-out5-col-2', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer reference' },
          { id: 'dp1-out5-col-3', name: 'data_payload', dataType: 'JSONB', nullable: true, isPrimaryKey: false, description: 'Raw data payload' },
          { id: 'dp1-out5-col-4', name: 'created_at', dataType: 'TIMESTAMP', nullable: false, isPrimaryKey: false, description: 'Record creation time' },
          { id: 'dp1-out5-col-5', name: 'updated_at', dataType: 'TIMESTAMP', nullable: true, isPrimaryKey: false, description: 'Last update time' },
        ],
      },

      // DP2 Input ports
      'dp2-input-1': {
        portId: 'dp2-input-1',
        portLabel: 'Web Data',
        nodeId: 'dataproduct-2',
        nodeLabel: 'WMA Analytics',
        columns: [
          { id: 'dp2-in1-col-1', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer identifier from web' },
          { id: 'dp2-in1-col-2', name: 'session_id', dataType: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, description: 'Session identifier' },
          { id: 'dp2-in1-col-3', name: 'event_type', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Type of event' },
          { id: 'dp2-in1-col-4', name: 'timestamp', dataType: 'TIMESTAMP', nullable: false, isPrimaryKey: false, description: 'Event time' },
          { id: 'dp2-in1-col-5', name: 'page_url', dataType: 'TEXT', nullable: true, isPrimaryKey: false, description: 'Page URL' },
        ],
      },
      'dp2-input-5': {
        portId: 'dp2-input-5',
        portLabel: 'Database Data',
        nodeId: 'dataproduct-2',
        nodeLabel: 'WMA Analytics',
        columns: [
          { id: 'dp2-in5-col-1', name: 'record_id', dataType: 'BIGINT', nullable: false, isPrimaryKey: false, description: 'Source record ID' },
          { id: 'dp2-in5-col-2', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer reference' },
          { id: 'dp2-in5-col-3', name: 'data_payload', dataType: 'JSONB', nullable: true, isPrimaryKey: false, description: 'Data content' },
          { id: 'dp2-in5-col-4', name: 'created_at', dataType: 'TIMESTAMP', nullable: false, isPrimaryKey: false, description: 'Creation timestamp' },
        ],
      },

      // DP2 Output ports
      'dp2-output-1': {
        portId: 'dp2-output-1',
        portLabel: 'Reports API',
        nodeId: 'dataproduct-2',
        nodeLabel: 'WMA Analytics',
        columns: [
          { id: 'dp2-out1-col-1', name: 'report_id', dataType: 'UUID', nullable: false, isPrimaryKey: true, description: 'Unique report identifier' },
          { id: 'dp2-out1-col-2', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer ID' },
          { id: 'dp2-out1-col-3', name: 'report_type', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Type of report' },
          { id: 'dp2-out1-col-4', name: 'metrics', dataType: 'JSONB', nullable: false, isPrimaryKey: false, description: 'Report metrics' },
          { id: 'dp2-out1-col-5', name: 'generated_at', dataType: 'TIMESTAMP', nullable: false, isPrimaryKey: false, description: 'Report generation time' },
        ],
      },

      // DP3 Input ports
      'dp3-input-1': {
        portId: 'dp3-input-1',
        portLabel: 'Reports Data',
        nodeId: 'dataproduct-3',
        nodeLabel: 'WMA Insights',
        columns: [
          { id: 'dp3-in1-col-1', name: 'report_id', dataType: 'UUID', nullable: false, isPrimaryKey: false, description: 'Report reference' },
          { id: 'dp3-in1-col-2', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer identifier' },
          { id: 'dp3-in1-col-3', name: 'report_type', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Report category' },
          { id: 'dp3-in1-col-4', name: 'metrics', dataType: 'JSONB', nullable: false, isPrimaryKey: false, description: 'Metrics data' },
        ],
      },

      // DP3 Output ports
      'dp3-output-1': {
        portId: 'dp3-output-1',
        portLabel: 'Analytics',
        nodeId: 'dataproduct-3',
        nodeLabel: 'WMA Insights',
        columns: [
          { id: 'dp3-out1-col-1', name: 'insight_id', dataType: 'UUID', nullable: false, isPrimaryKey: true, description: 'Unique insight ID' },
          { id: 'dp3-out1-col-2', name: 'customer_id', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer ID' },
          { id: 'dp3-out1-col-3', name: 'insight_type', dataType: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Type of insight' },
          { id: 'dp3-out1-col-4', name: 'confidence_score', dataType: 'DECIMAL(5,2)', nullable: false, isPrimaryKey: false, description: 'Confidence level' },
          { id: 'dp3-out1-col-5', name: 'recommendations', dataType: 'TEXT', nullable: true, isPrimaryKey: false, description: 'AI recommendations' },
        ],
      },
    };

    // Column-to-column relationships (lineage)
    const columnRelationships: ColumnRelationship[] = [
      // dp1-output-1 (Web App) to dp2-input-1 (Web Data)
      { sourceColumn: 'dp1-out1-col-1', targetColumn: 'dp2-in1-col-1' }, // customer_id
      { sourceColumn: 'dp1-out1-col-2', targetColumn: 'dp2-in1-col-2' }, // session_id
      { sourceColumn: 'dp1-out1-col-3', targetColumn: 'dp2-in1-col-5' }, // page_url
      { sourceColumn: 'dp1-out1-col-4', targetColumn: 'dp2-in1-col-4' }, // timestamp

      // dp1-output-5 (Database) to dp2-input-5 (Database Data)
      { sourceColumn: 'dp1-out5-col-1', targetColumn: 'dp2-in5-col-1' }, // record_id
      { sourceColumn: 'dp1-out5-col-2', targetColumn: 'dp2-in5-col-2' }, // customer_id
      { sourceColumn: 'dp1-out5-col-3', targetColumn: 'dp2-in5-col-3' }, // data_payload
      { sourceColumn: 'dp1-out5-col-4', targetColumn: 'dp2-in5-col-4' }, // created_at

      // dp2-output-1 (Reports API) to dp3-input-1 (Reports Data)
      { sourceColumn: 'dp2-out1-col-1', targetColumn: 'dp3-in1-col-1' }, // report_id
      { sourceColumn: 'dp2-out1-col-2', targetColumn: 'dp3-in1-col-2' }, // customer_id
      { sourceColumn: 'dp2-out1-col-3', targetColumn: 'dp3-in1-col-3' }, // report_type
      { sourceColumn: 'dp2-out1-col-4', targetColumn: 'dp3-in1-col-4' }, // metrics
    ];

    // Get the selected port data
    const selectedPort = columnData[portId];
    if (!selectedPort) {
      throw new Error(`Port ${portId} not found`);
    }

    // Find upstream and downstream ports based on existing port relationships
    const flowData = await getFlowData();
    const relationships = flowData.relationships;

    const upstreamPorts: ColumnPort[] = [];
    const downstreamPorts: ColumnPort[] = [];

    relationships.forEach((rel) => {
      if (rel.type === 'port') {
        // If this port is a target, the source is upstream
        if (rel.targetPort === portId && columnData[rel.sourcePort]) {
          upstreamPorts.push(columnData[rel.sourcePort]!);
        }
        // If this port is a source, the target is downstream
        if (rel.sourcePort === portId && columnData[rel.targetPort]) {
          downstreamPorts.push(columnData[rel.targetPort]!);
        }
      }
    });

    // Build column lineage data structure
    return {
      selectedPort: {
        ...selectedPort,
        columns: selectedPort.columns.map((col) => {
          // Find upstream columns
          const upstreamColumns = columnRelationships
            .filter((rel) => rel.targetColumn === col.id)
            .map((rel) => rel.sourceColumn);

          // Find downstream columns
          const downstreamColumns = columnRelationships
            .filter((rel) => rel.sourceColumn === col.id)
            .map((rel) => rel.targetColumn);

          return {
            ...col,
            upstreamColumns,
            downstreamColumns,
          };
        }),
      },
      upstreamPorts: upstreamPorts.map((port) => ({
        ...port,
        columns: port.columns.map((col) => {
          const downstreamColumns = columnRelationships
            .filter((rel) => rel.sourceColumn === col.id)
            .map((rel) => rel.targetColumn);
          return { ...col, downstreamColumns };
        }),
      })),
      downstreamPorts: downstreamPorts.map((port) => ({
        ...port,
        columns: port.columns.map((col) => {
          const upstreamColumns = columnRelationships
            .filter((rel) => rel.targetColumn === col.id)
            .map((rel) => rel.sourceColumn);
          return { ...col, upstreamColumns };
        }),
      })),
      columnRelationships,
    };
  }

  const response = await fetch(`/api/column-lineage/${portId}`);
  return response.json();
}

export const mockApi: MockApi = {
  delay,
  useMockApi,
  setUseMockApi,
  getFlowData,
  getColumnLineage,
};
