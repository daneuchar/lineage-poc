import { ReactFlowProvider } from '@xyflow/react'
import FlowCanvas from './components/FlowCanvas'
import './styles/index.css'

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
