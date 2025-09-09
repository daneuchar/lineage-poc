import { ReactFlowProvider } from '@xyflow/react'
import FlowCanvas from './components/FlowCanvas'
import './styles/flow.css'

function App() {
  return (
    <div className="App">
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  )
}

export default App
