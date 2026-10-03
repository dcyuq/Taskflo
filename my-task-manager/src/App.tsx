import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import WorkspaceDetail from './pages/WorkspaceDetail'
import DashboardHome from './pages/DashboardHome'

import {Routes, Route} from 'react-router-dom'


function App() {
  return (
    <Routes>
        <Route path='/' element={<LandingPage />} /> 
        <Route path="/login" element={<Login />} /> 
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="workspace/:id" element={<WorkspaceDetail />} />
        </Route>
    </Routes>
  )
}

export default App