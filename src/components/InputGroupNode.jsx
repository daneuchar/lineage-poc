import { Handle, Position } from '@xyflow/react';
import { useState } from 'react';

function InputGroupNode({ data }) {
  const [selectedInput, setSelectedInput] = useState(null);

  const handleInputClick = (inputIndex) => {
    const newSelected = selectedInput === inputIndex ? null : inputIndex;
    setSelectedInput(newSelected);
    
    if (data.onInputSelect && data.inputs) {
      const inputId = newSelected !== null ? data.inputs[newSelected].id : null;
      data.onInputSelect(inputId);
    }
  };

  if (!data.expanded) {
    return (
      <div className="input-group-node">
        <div className="group-header">
          <h4>Input Ports</h4>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Click Data Product to expand
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="input-group-node">
      <div className="group-header">
        <h4>Input Ports</h4>
      </div>
      <div className="input-items">
        {(data.inputs || []).map((input, i) => (
          <div 
            key={input.id} 
            className={`input-item ${selectedInput === i ? 'selected' : ''}`}
            onClick={() => handleInputClick(i)}
          >
            <span>{input.label}</span>
            <Handle 
              type="source" 
              position={Position.Right} 
              id={input.id}
              style={{ 
                position: 'absolute',
                right: '-5px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default InputGroupNode;