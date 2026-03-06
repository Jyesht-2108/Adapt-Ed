import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import IDEPage from './pages/IDEPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ide" replace />} />
        <Route path="/ide" element={<IDEPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
