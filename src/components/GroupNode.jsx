import { Handle, Position } from '@xyflow/react';
import { useState } from 'react';

function GroupNode({ data }) {
  const [selectedChild, setSelectedChild] = useState(null);

  const handleChildClick = (childIndex) => {
    const newSelected = selectedChild === childIndex ? null : childIndex;
    setSelectedChild(newSelected);
    
    // Notify parent component about selection
    if (data.onChildSelect && data.children) {
      const childId = newSelected !== null ? data.children[newSelected].id : null;
      data.onChildSelect(childId);
    }
  };

  if (!data.expanded) {
    return (
      <div className="group-node">
        <div className="group-header">
          <h4>Output Ports</h4>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Click Data Product to expand
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-node">
      <div className="group-header">
        <h4>Output Ports</h4>
      </div>
      <div className="child-items">
        {(data.children || []).map((child, i) => (
          <div 
            key={child.id} 
            className={`child-item ${selectedChild === i ? 'selected' : ''}`}
            onClick={() => handleChildClick(i)}
          >
            <Handle 
              type="target" 
              position={Position.Left} 
              id={child.id}
              style={{ 
                position: 'absolute',
                left: '-5px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            <span>{child.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupNode;