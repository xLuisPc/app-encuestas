import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SurveyList from './pages/SurveyList'
import SurveyForm from './pages/SurveyForm'
import SurveyStats from './pages/SurveyStats'
import PublicSurvey from './pages/PublicSurvey'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/survey/:id" element={<PublicSurvey />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <PrivateRoute>
                <SurveyList />
              </PrivateRoute>
            }
          />
          <Route
            path="/surveys/new"
            element={
              <PrivateRoute requiredRole={['admin', 'creator']}>
                <SurveyForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/surveys/:id/edit"
            element={
              <PrivateRoute requiredRole={['admin', 'creator']}>
                <SurveyForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/surveys/:id/stats"
            element={
              <PrivateRoute>
                <SurveyStats />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

