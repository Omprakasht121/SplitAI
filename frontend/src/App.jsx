import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Workspace from './pages/Workspace'

/**
 * Main App component with routing
 * - Landing page at root
 * - Workspace (IDE) at /workspace
 */
function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/workspace" element={<Workspace />} />
            </Routes>
        </div>
    )
}

export default App
