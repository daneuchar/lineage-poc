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
              env: 'production', // environment
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
 * Get table-based column lineage with embedded relationships
 */
async function getTableColumnLineage(): Promise<import('../types').ColumnLineageData> {
  if (useMockApi) {
    await delay(800); // Simulate network delay

    return {
      datasets: [
        {
          id: 'table-1',
          type: 'dataset',
          data: {
            env: 'production', // environment
            dp_name: 'Customer Raw Data',
            port_type: 'input', // input or output
            dp_id: 'dp-raw-customers', 
            port_id: 'port-extract-001',
            port_name: 'Customer Data Extract',
            schema: '/raw_data/customers', //table name 
            tags: ['pii', 'customer', 'raw'], // optional
            columns: [
              {
                id: 'table-1-col-1',
                name: 'customer_id',
                dataType: 'INTEGER',
                nullable: false, // optional
                isPrimaryKey: true, // optional
                isForeignKey: false, // optional
                description: 'Unique customer identifier', // optional
                sourceColumns: ['table-3-col-1'], // → left edge 
                targetColumns: ['table-4-col-1'], // → right edge 
              },
              {
                id: 'table-1-col-2',
                name: 'first_name',
                dataType: 'VARCHAR(100)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer first name',
                tags: ['pii'],
                targetColumns: ['table-3-col-2'], // → full_name (concatenated)
              },
              {
                id: 'table-1-col-3',
                name: 'last_name',
                dataType: 'VARCHAR(100)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer last name',
                tags: ['pii'],
                targetColumns: ['table-3-col-2'], // → full_name (concatenated)
              },
              {
                id: 'table-1-col-4',
                name: 'email',
                dataType: 'VARCHAR(255)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer email address',
                tags: ['pii', 'contact'],
                targetColumns: ['table-3-col-3'], // → email
              },
              {
                id: 'table-1-col-5',
                name: 'created_at',
                dataType: 'TIMESTAMP',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Account creation timestamp',
              },
              {
                id: 'table-1-col-6',
                name: 'country_code',
                dataType: 'VARCHAR(2)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'ISO country code',
                targetColumns: ['table-3-col-8'], // → country_code
              },
            ],
          },
        },
        {
          id: 'table-2',
          type: 'dataset',
          data: {
            env: 'production',
            dp_name: 'Orders Raw Data',
            port_type: 'input',
            dp_id: 'dp-raw-orders',
            port_id: 'port-extract-002',
            port_name: 'Orders Data Extract',
            schema: '/raw_data/orders',
            tags: ['transactional', 'orders', 'raw'],
            columns: [
              {
                id: 'table-2-col-1',
                name: 'order_id',
                dataType: 'INTEGER',
                nullable: false,
                isPrimaryKey: true,
                isForeignKey: false,
                description: 'Unique order identifier',
                targetColumns: ['table-3-col-4'], // → total_orders (aggregated)
              },
              {
                id: 'table-2-col-2',
                name: 'customer_id',
                dataType: 'INTEGER',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: true,
                description: 'Reference to customer',
              },
              {
                id: 'table-2-col-3',
                name: 'order_amount',
                dataType: 'DECIMAL(10,2)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Total order amount',
                targetColumns: ['table-3-col-5'], // → total_spent (aggregated)
              },
              {
                id: 'table-2-col-4',
                name: 'order_date',
                dataType: 'DATE',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Order placement date',
                targetColumns: ['table-3-col-6', 'table-3-col-7'], // → first/last order date
              },
              {
                id: 'table-2-col-5',
                name: 'status',
                dataType: 'VARCHAR(50)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Order status',
              },
            ],
          },
        },
        {
          id: 'table-3',
          type: 'dataset',
          data: {
            env: 'staging',
            dp_name: 'Customer Orders Staging',
            port_type: 'output',
            dp_id: 'dp-staging-customer-orders',
            port_id: 'port-transform-001',
            port_name: 'Customer Orders ETL',
            schema: '/staging/customer_orders',
            tags: ['staging', 'customer-orders', 'aggregated'],
            columns: [
              {
                id: 'table-3-col-1',
                name: 'customer_id',
                dataType: 'INTEGER',
                nullable: false,
                isPrimaryKey: true,
                isForeignKey: false,
                description: 'Customer identifier',
                sourceColumns: ['table-1-col-1'],
                targetColumns: ['table-4-col-1'], // → Customer Analytics
              },
              {
                id: 'table-3-col-2',
                name: 'full_name',
                dataType: 'VARCHAR(255)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer full name',
                tags: ['pii'],
                sourceColumns: ['table-1-col-2', 'table-1-col-3'],
                targetColumns: ['table-4-col-2'], // → customer_name
              },
              {
                id: 'table-3-col-3',
                name: 'email',
                dataType: 'VARCHAR(255)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer email',
                tags: ['pii', 'contact'],
                sourceColumns: ['table-1-col-4'],
                targetColumns: ['table-4-col-3'], // → email
              },
              {
                id: 'table-3-col-4',
                name: 'total_orders',
                dataType: 'INTEGER',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Total number of orders',
                sourceColumns: ['table-2-col-1'],
                targetColumns: ['table-4-col-6', 'table-4-col-8'], // → order_count, avg_order_value
              },
              {
                id: 'table-3-col-5',
                name: 'total_spent',
                dataType: 'DECIMAL(12,2)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Total amount spent',
                sourceColumns: ['table-2-col-3'],
                targetColumns: ['table-4-col-4', 'table-4-col-5', 'table-4-col-8'], // → lifetime_value, segment, avg
              },
              {
                id: 'table-3-col-6',
                name: 'first_order_date',
                dataType: 'DATE',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Date of first order',
                sourceColumns: ['table-2-col-4'],
                targetColumns: ['table-4-col-7'], // → tenure_days
              },
              {
                id: 'table-3-col-7',
                name: 'last_order_date',
                dataType: 'DATE',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Date of last order',
                sourceColumns: ['table-2-col-4'],
              },
              {
                id: 'table-3-col-8',
                name: 'country_code',
                dataType: 'VARCHAR(2)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer country',
                sourceColumns: ['table-1-col-6'],
                targetColumns: ['table-4-col-9'], // → country_code
              },
            ],
          },
        },
        {
          id: 'table-4',
          type: 'dataset',
          data: {
            env: 'production',
            dp_name: 'Customer Analytics Mart',
            port_type: 'input',
            dp_id: 'dp-mart-customer-analytics',
            port_id: 'port-analytics-001',
            port_name: 'Customer Analytics Processing',
            schema: '/mart/customer_analytics',
            tags: ['mart', 'customer-analytics', 'business-ready'],
            columns: [
              {
                id: 'table-4-col-1',
                name: 'customer_id',
                dataType: 'INTEGER',
                nullable: false,
                isPrimaryKey: true,
                isForeignKey: false,
                description: 'Customer identifier',
                sourceColumns: ['table-3-col-1'],
              },
              {
                id: 'table-4-col-2',
                name: 'customer_name',
                dataType: 'VARCHAR(255)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer full name',
                tags: ['pii'],
                sourceColumns: ['table-3-col-2'],
              },
              {
                id: 'table-4-col-3',
                name: 'email',
                dataType: 'VARCHAR(255)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer email',
                tags: ['pii', 'contact'],
                sourceColumns: ['table-3-col-3'],
              },
              {
                id: 'table-4-col-4',
                name: 'lifetime_value',
                dataType: 'DECIMAL(12,2)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer lifetime value',
                sourceColumns: ['table-3-col-5'],
              },
              {
                id: 'table-4-col-5',
                name: 'customer_segment',
                dataType: 'VARCHAR(50)',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer segmentation category',
                sourceColumns: ['table-3-col-5'],
              },
              {
                id: 'table-4-col-6',
                name: 'order_count',
                dataType: 'INTEGER',
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Total number of orders',
                sourceColumns: ['table-3-col-4'],
              },
              {
                id: 'table-4-col-7',
                name: 'tenure_days',
                dataType: 'INTEGER',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer tenure in days',
                sourceColumns: ['table-3-col-6'],
              },
              {
                id: 'table-4-col-8',
                name: 'avg_order_value',
                dataType: 'DECIMAL(10,2)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Average order value',
                sourceColumns: ['table-3-col-4', 'table-3-col-5'],
              },
              {
                id: 'table-4-col-9',
                name: 'country_code',
                dataType: 'VARCHAR(2)',
                nullable: true,
                isPrimaryKey: false,
                isForeignKey: false,
                description: 'Customer country',
                sourceColumns: ['table-3-col-8'],
              },
            ],
          },
        },
      ],
    };
  }

  const response = await fetch('/api/table-column-lineage');
  return response.json();
}

export const mockApi: MockApi = {
  getFlowData,
  getTableColumnLineage,
};
