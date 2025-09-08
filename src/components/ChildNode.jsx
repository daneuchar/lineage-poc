import { Handle, Position } from '@xyflow/react';

function ChildNode({ data }) {
  return (
    <div className="child-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <h4>{data.label}</h4>
        <p>Grouped Child</p>
      </div>
    </div>
  );
}

export default ChildNode;