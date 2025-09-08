import { Handle, Position } from '@xyflow/react';

function DataProductNode({ data }) {
  const handleClick = () => {
    if (data.onToggleExpansion) {
      data.onToggleExpansion();
    }
  };

  return (
    <div className="dataproduct-node" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="node-content">
        <h3>{data.label || 'Data Product'}</h3>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {data.expanded ? '▼ Click to collapse' : '► Click to expand'}
        </div>
      </div>
    </div>
  );
}

export default DataProductNode;